const https = require('https');
const Telegram = require('telegram-notify');
const Docker = require('dockerode');
const pjson = require("./package.json");
const PushBullet = require('pushbullet');
const Pushover = require('node-pushover');
const { Webhook } = require('discord-webhook-node');

let docker = new Docker({socketPath: '/var/run/docker.sock'});
// var docker = new Docker({
//     protocol: 'http', //you can enforce a protocol
//     host: 'localhost',
//     port: 2375 //process.env.DOCKER_PORT || 2375
// });
const NODE_ENV = process.env.NODE_ENV || "production";
const SERVER_LABEL = process.env.SERVER_LABEL || "";
const MESSAGE_PLATFORM = process.env.MESSAGE_PLATFORM || "";
const LABEL_ENABLE = process.env.LABEL_ENABLE || 'false';
const ONLY_OFFLINE_STATES = process.env.ONLY_OFFLINE_STATES || 'false';
const EXCLUDE_EXITED = process.env.EXCLUDE_EXITED || 'false';
// Default to 10 seconds if less than 10 or blank.
if(process.env.PERIOD != "" || process.env.PERIOD < 10) {process.env.PERIOD = 10;}
const PERIOD = process.env.PERIOD;
const DISABLE_STARTUP_MSG = process.env.DISABLE_STARTUP_MSG || 'false';
      
let msgDetails = MESSAGE_PLATFORM.split('@');
let isFirstRun = true;
let monContainers = [];
let offlineStates = [
    'exited',
    'dead',
    'running (unhealthy)',
    'paused'
];
let runClock;

console.log("-------------------------------------------------------");
console.log(" Monocker - MONitor dOCKER container states");
console.log(" Developed by Matt Petersen - Brisbane Australia");
console.log(" ");
console.log(" Version: " + pjson.version);
console.log("-------------------------------------------------------");
console.log(" ");

async function sendWhatsapp(title, message){
    let msg = `*${title}*: ${message}`;
    https.get(`https://api.callmebot.com/whatsapp.php?source=php&phone=${msgDetails[1]}&text=${encodeURIComponent(msg)}&apikey=${msgDetails[2]}`, res => {
        let data = [];
        res.on('data', chunk => {
            data.push(chunk);
        });
        res.on('end', () => {
            console.log(`Response from callmebot.com: ${Buffer.concat(data).toString()}`);            
        });
    }).on('error', err => {
        console.log('Error while calling callmebot.com: ', err.message);
    });
}

async function sendNtfySh(title, message){
    let ntfyServer = msgDetails[1]
    let ntfyTopic = msgDetails[2]
    let headerData = {
    	...{
        	'Content-Type': 'text/plain',
        	'Title': title,
        	'Tags': 'whale2,server,docker',
        	'Priority': ((message.includes("dead") || message.includes("unhealthy")) ? 4 : 3)
    	},
      	...((msgDetails.length == 4 && msgDetails[3].length > 0) && { "Authorization": `Bearer ${msgDetails[3]}`})
    }
    let req = https.request(`${ntfyServer}/${ntfyTopic}`, {
        method: 'POST',
        headers: headerData
    }, res => {
        let data = [];
        res.on('data', chunk => {
            data.push(chunk);
        });
        res.on('end', () => {
            console.log(`Response from ${ntfyServer}:: ${Buffer.concat(data).toString()}`);            
        });
    })    
    req.on('error', err => {
        console.log(`Error while calling ${ntfyServer}: `, err.message);
    });
    req.write(message);
    req.end();
}

async function sendTelegram(message){
    let notify = new Telegram({token:msgDetails[1], chatId:msgDetails[2]});
    await notify.send(message, {timeout: 10000}, {parse_mode: 'html'});
}

async function sendPushbullet(title, message){
    var pusher = new PushBullet(msgDetails[1]);
    pusher.note(msgDetails[2], title, message, function(error, response) {});
}

async function sendPushover(title, message){
    var push = new Pushover({
        token: msgDetails[2],
        user: msgDetails[1]
    });
    push.send(title, message);
}

async function sendDiscord(title, message){
    const hook = new Webhook(msgDetails[1]);
    hook.setUsername(title);
    hook.send(message);
}


async function send(message) {
    let title = "MONOCKER";
    if(SERVER_LABEL.length !== 0) title += " (" + SERVER_LABEL + ")"

    switch(msgDetails[0].toLowerCase()) {
        case "telegram":
            sendTelegram(`<b>` + title + `</b>
` + message);
            break;
        case "pushbullet":
            sendPushbullet(title, message);
            break;
        case "pushover":
            sendPushover(title, message);
            break;
        case "discord":
            sendDiscord(title, message);
            break;
        case "whatsapp":
            sendWhatsapp(title, message)
        case "ntfy.sh":
            sendNtfySh(title, message)
        case "default":
            // do nothing
            break;
    }
}

async function list(){
    let opts;

    if(LABEL_ENABLE=='true'){
        opts = {
            "filters": '{"label": ["monocker.enable=true"]}'
        };
    }
    else{
        opts = {all: true};
    }

    //let now = new Date();
    //console.log(now.toLocaleString() + " - Container scan");
    docker.listContainers(opts, function(err, containers) {
        // check for changes in status (first run is populating data only)
        let newConArray = [];
        containers.forEach(c => {
            // if label_enable is false then exclude any specifically false labelled containers
            if(LABEL_ENABLE=='false' && JSON.stringify(c.Labels).includes('"monocker.enable":"false"')){
                if(isFirstRun==true){
                    console.log('    - Excluding: ' + c.Names[0].replace("/",""));
                    send('Excluding: ' + c.Names[0].replace("/",""));
                }
            }
            else{
                // If label_enable is true, list the specifically included containers
                if(LABEL_ENABLE=='true' && JSON.stringify(c.Labels).includes('"monocker.enable":"true"')){
                    if(isFirstRun==true){
                        console.log('    - Monitoring: ' + c.Names[0].replace("/",""));
                        send('Monitoring: ' + c.Names[0].replace("/",""));
                    }
                }
                // determine if covered by healthcheck
                let hcStatus = "";
                if(c.Status.includes("(healthy)")) hcStatus="(healthy)"
                if(c.Status.includes("(unhealthy)")) hcStatus="(unhealthy)"
                if(monContainers.includes(c.Id + "," + c.State + "," + c.Names[0] + "," + hcStatus) == false && monContainers.length !== 0 ){
                    // exclude exited status if set
                    if(EXCLUDE_EXITED == 'true' && c.State.toLocaleLowerCase() == 'exited'){
                        // ignore 
                    }
                    else{
                        // if only offline is set, then only show state changes that are offline
                        if(ONLY_OFFLINE_STATES=='true'){
                            if(offlineStates.includes(c.State) || offlineStates.includes(c.State + " " + hcStatus)){
                                console.log("    - " +c.Names[0].replace("/","") + ": " + c.State + " " + hcStatus);
                                send(c.Names[0].replace("/","") +": "+c.State + " " + hcStatus);
                            }
                        }
                        else{
                            console.log("    - " +c.Names[0].replace("/","") + ": " + c.State + " " + hcStatus);
                            send(c.Names[0].replace("/","") +": "+c.State + " " + hcStatus);
                        }
                    }
                }
                // create new container array
                newConArray.push(c.Id + "," + c.State + "," + c.Names[0] + ","  + hcStatus);
            }
        });
        if(isFirstRun==true){
            console.log("     - Currently monitoring " + newConArray.length + " (running) containers");
            if(DISABLE_STARTUP_MSG.toLowerCase()!='true'){
                send("Currently monitoring " + newConArray.length + " (running) containers");
            }
            isFirstRun=false;
        }

        // check if any containers have been deleted between scans
        if(monContainers.length !== 0 ){
            monContainers.forEach(c => {
                let delArray = newConArray.filter(nc => nc.includes(c.split(",")[0]));
                // if no match in history array and latest scan, then is deleted
                if(delArray.length==0 && EXCLUDE_EXITED !== 'true'){
                    console.log("    - " + c.split(",")[2].replace("/","") + ": exited");
                    send(c.split(",")[2].replace("/","") +": exited")
                }
            });
        }

        // assign new array to be current array state
        monContainers = newConArray;
    }, Promise.resolve(0));
}

async function run(){
    // stop timer to ensure no race conditions
    clearInterval(runClock);
    // run check
    await list();
    // restart timer
    runClock = setInterval(run,(PERIOD * 1000));
}

console.log(`Monitoring started 
     - Messaging platform: ` + MESSAGE_PLATFORM.split("@")[0] + `
     - Polling period: ` + PERIOD + ` seconds 
     - Only offline state monitoring: ` + ONLY_OFFLINE_STATES + `
     - Only include labelled containers: ` + LABEL_ENABLE + ` 
     - Do not monitor 'Exited': ` + EXCLUDE_EXITED + `
     - Disable Startup Messages: ` + DISABLE_STARTUP_MSG.toLowerCase());

console.log()
if(DISABLE_STARTUP_MSG.toLowerCase()!='true'){
    send(`Monitoring started 
        - Messaging platform: ` + MESSAGE_PLATFORM.split("@")[0] + `
        - Only offline state monitoring: ` + ONLY_OFFLINE_STATES + `
        - Only include labelled containers: ` + LABEL_ENABLE + `
        - Do not monitor 'Exited': ` + EXCLUDE_EXITED + `
        - Disable Startup Messages: ` + DISABLE_STARTUP_MSG);
}

// start processing
run();
