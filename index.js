const Telegram = require('telegram-notify');
const Docker = require('dockerode');
const pjson = require("./package.json");
const PushBullet = require('pushbullet');
const Pushover = require('node-pushover');

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

let msgDetails = MESSAGE_PLATFORM.split('@');
let isFirstRun = true;
let monContainers = [];

console.log("-------------------------------------------------------");
console.log(" Monocker - MONitor dOCKER container states");
console.log(" Developed by Matt Petersen - Brisbane Australia");
console.log(" ");
console.log(" Version: " + pjson.version);
console.log("-------------------------------------------------------");

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
                    console.log("    - " +c.Names[0].replace("/","") + ": " + c.State + " " + hcStatus);
                    send(c.Names[0].replace("/","") +": "+c.State + " " + hcStatus)
                }
                // create new container array
                newConArray.push(c.Id + "," + c.State + "," + c.Names[0] + ","  + hcStatus);
            }
        });
        if(isFirstRun==true){
            console.log("    - Currently monitoring " + newConArray.length + " (running) containers");
            send("Currently monitoring " + newConArray.length + " (running) containers");
            isFirstRun=false;
        }

        // check if any containers have been deleted between scans
        if(monContainers.length !== 0 ){
            monContainers.forEach(c => {
                let delArray = newConArray.filter(nc => nc.includes(c.split(",")[0]));
                // if no match in history array and latest scan, then is deleted
                if(delArray.length==0){
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
    await list();
}

send("Monitoring started")
console.log("Monitoring started")
setInterval(run,10000);