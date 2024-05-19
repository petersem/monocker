import Telegram from "telegram-notify";
import Docker from "dockerode";
import { createRequire } from "module";
const pjson = createRequire(import.meta.url)("./package.json");
import PushBullet from "pushbullet";
import Pushover from 'node-pushover';
import { Webhook } from 'discord-webhook-node';
import { NtfyClient } from 'ntfy';
import { WebClient } from '@slack/web-api';
process.on('warning', (warning) => {
    console.log(warning.stack);
});
// for health check
import http from "http";
const host = 'localhost';
const port = 8000;
const requestListener = function (req, res) {
    res.writeHead(200);
    res.end("Monocker is functional!");
};
const server = http.createServer(requestListener);
server.listen(port, host, () => {});

// main program
let docker = new Docker({socketPath: '/var/run/docker.sock'});
const NODE_ENV = process.env.NODE_ENV || "production";
const SERVER_LABEL = process.env.SERVER_LABEL || "";
const SERVER_AVATAR = process.env.SERVER_AVATAR || "";
const MESSAGE_PLATFORM = process.env.MESSAGE_PLATFORM || "";
const LABEL_ENABLE = process.env.LABEL_ENABLE || 'false';
const ONLY_OFFLINE_STATES = process.env.ONLY_OFFLINE_STATES || 'false';
const EXCLUDE_EXITED = process.env.EXCLUDE_EXITED || 'false';
const SHA = process.env.SHA || 'false';
// Default to 10 seconds if less than 10, blank or undefined.
if(process.env.PERIOD == "" || process.env.PERIOD === undefined || process.env.PERIOD < 10) {process.env.PERIOD = 10;}
const PERIOD = process.env.PERIOD;
const DISABLE_STARTUP_MSG = process.env.DISABLE_STARTUP_MSG || 'false';

// NTFY settings
const CUSTOM_NTFY_SERVER = process.env.CUSTOM_NTFY_SERVER || null;
const NTFY_USER = process.env.NTFY_USER || "";
const NTFY_PASS = process.env.NTFY_PASS || "";

let msgDetails = MESSAGE_PLATFORM.split("@");
let isFirstRun = true;
let monContainers = [];
let offlineStates = ["exited", "dead", "running (unhealthy)", "paused"];
let runClock;

console.log("-------------------------------------------------------");
console.log(" Monocker - MONitor dOCKER container states");
console.log(" Developed by Matt Petersen - Brisbane Australia");
console.log(" ");
console.log(" Version: " + pjson.version);
console.log("-------------------------------------------------------");
console.log(" ");

console.log(`Monitoring started 
     - Version: ` + pjson.version + `
     - Messaging platform: ` + MESSAGE_PLATFORM.split("@")[0] + `
     - Polling period: ` + PERIOD + ` seconds 
     - Only offline state monitoring: ` + ONLY_OFFLINE_STATES + `
     - Only include labelled containers: ` + LABEL_ENABLE + ` 
     - Do not monitor 'Exited': ` + EXCLUDE_EXITED + `
     - Disable Startup Messages: ` + DISABLE_STARTUP_MSG.toLowerCase() + `
     - Display SHA ID: ` + SHA);

console.log()
if(DISABLE_STARTUP_MSG.toLowerCase()!='true'){
    send(`Monitoring started 
        -- Version: ` + pjson.version + `
        -- Messaging platform: ` + MESSAGE_PLATFORM.split("@")[0] +`
        -- Polling period: ` + PERIOD + ` seconds` +`
        -- Only offline state monitoring: ` + ONLY_OFFLINE_STATES +`
        -- Only include labelled containers: ` + LABEL_ENABLE +`
        -- Do not monitor 'Exited': ` + EXCLUDE_EXITED +`
        -- Disable Startup Messages: ` + DISABLE_STARTUP_MSG +` 
        -- Display SHA ID: ` + SHA);
}



async function sendTelegram(message) {
    let notify = new Telegram({ token: msgDetails[1], chatId: msgDetails[2] });
    await notify.send(message, { timeout: 10000 }, { parse_mode: "html" });
}

async function sendPushbullet(title, message) {
    var pusher = new PushBullet(msgDetails[1]);
    pusher.note(msgDetails[2], title, message, function (err, res) {
        if (err) return console.log(err.message);
        console.error(res.message);
    });
}

async function sendPushover(title, message) {
    var push = new Pushover({
        token: msgDetails[2],
        user: msgDetails[1],
    });
    push.send(title, message, function (err, res) {
        if (err) return console.log(err);
        console.error(res);
    });
}

async function sendDiscord(title, message) {
    const hook = new Webhook(msgDetails[1]);
    hook.setUsername(title);
    hook.setAvatar(SERVER_AVATAR);
    try {
        await hook.send(message);
    } catch (e) {
        console.error(e.message);
    }
}

async function sendNtfyAuth(title, message) {
    const ntfy = new NtfyClient();
    try {
        await ntfy.publish({
            authorization: {
                password: NTFY_PASS,
                username: NTFY_USER
            },
            server: CUSTOM_NTFY_SERVER,
            topic: msgDetails[1],
            title: title,
            message: message,
            iconURL: SERVER_AVATAR
        });
    } catch (e) {
        console.error(e.message);
    }
}

async function sendNtfy(title, message) {
    const ntfy = new NtfyClient();
    try {
        await ntfy.publish({
            server: CUSTOM_NTFY_SERVER,
            topic: msgDetails[1],
            title: title,
            message: message,
            iconURL: SERVER_AVATAR,
        });
    } catch (e) {
        console.error(e.message);
    }
}

async function sendSlack(title, message) {
    const web = new WebClient(msgDetails[1]);
    try {
        await web.chat.postMessage({
            channel: msgDetails[2],
            username: title,
            text: message,
            icon_url: SERVER_AVATAR,
        });
    } catch (e) {
        console.error(e.message);
    }
}

async function send(message) {
    let title = "MONOCKER";
    if (SERVER_LABEL.length !== 0) title += " (" + SERVER_LABEL + ")";

    switch (msgDetails[0].toLowerCase()) {
        case "telegram":
            sendTelegram(`<b>` + title + `</b>` + message);
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
        case "ntfy":
            if (NTFY_PASS.length == 0) sendNtfy(title, message);
            else sendNtfyAuth(title, message);
            break;
        case "slack":
            sendSlack(title, message);
            break;
        case "default":
            // do nothing
            break;
    }
}

async function list() {
    let opts;
    let messages = "";
    if(LABEL_ENABLE == 'true') {

        opts = {
            filters: '{"label": ["monocker.enable=true"]}',
        };
    } else {
        opts = { all: true };
    }

    //let now = new Date();
    //console.log(now.toLocaleString() + " - Container scan");
    docker.listContainers(opts, function(err, containers) {
        // check for changes in status (first run is populating data only)
        let newConArray = [];
        if (containers.length > 0) {
            containers.forEach(c => {
                // if label_enable is false then exclude any specifically false labelled containers
                if (LABEL_ENABLE == 'false' && JSON.stringify(c.Labels).includes('"monocker.enable":"false"')) {
                    if (isFirstRun == true) {
                        console.log('    - Excluding: ' + c.Names[0].replace("/", ""));
                        //send('Excluding: ' + c.Names[0].replace("/",""));
                        messages += 'Excluding: ' + c.Names[0].replace("/", "") + "\r\n";
                    }
                }
                else {
                    // If label_enable is true, list the specifically included containers
                    if (LABEL_ENABLE == 'true' && JSON.stringify(c.Labels).includes('"monocker.enable":"true"')) {
                        if (isFirstRun == true) {
                            console.log('    - Monitoring: ' + c.Names[0].replace("/", ""));
                            //send('Monitoring: ' + c.Names[0].replace("/",""));
                            messages += 'Monitoring: ' + c.Names[0].replace("/", "") + "\r\n";
                        }
                    }
                    // determine if covered by healthcheck
                    let hcStatus = "";

                    if (c.Status.includes("(healthy)")) hcStatus = "(healthy)"
                    if (c.Status.includes("(unhealthy)")) hcStatus = "(unhealthy)"
                    if (monContainers.includes(c.Id + "," + c.State + "," + c.Names[0] + "," + hcStatus) == false && monContainers.length !== 0) {
                        // exclude exited status if set
                        if (EXCLUDE_EXITED == 'true' && c.State.toLocaleLowerCase() == 'exited') {
                            // ignore 
                        }
                        else {
                            // if only offline is set, then only show state changes that are offline
                            var output = c.Names[0].replace("/", "") + ": " + c.State + " " + hcStatus;
                            if (SHA.toLowerCase() == 'true') {
                                output += " " + c.ImageID
                            }
                            if (ONLY_OFFLINE_STATES == 'true') {
                                if (offlineStates.includes(c.State) || offlineStates.includes(c.State + " " + hcStatus)) {
                                    console.log("    - " + output);
                                    //send(output);
                                    messages += output + "\r\n";
                                }
                            }
                            else {
                                console.log("    - " + output);
                                //send(output);
                                console.log('*****' + output);
                                messages += output + "\r\n";
                            }
                        }
                    }
                    // create new container array
                    newConArray.push(c.Id + "," + c.State + "," + c.Names[0] + "," + hcStatus);
                }
            }
            );
        }
        if(isFirstRun==true){
            console.log("     - Currently monitoring " + newConArray.length + " (running) containers");
            if(DISABLE_STARTUP_MSG.toLowerCase()!='true'){
                //send("Currently monitoring " + newConArray.length + " (running) containers");
                messages += "Currently monitoring " + newConArray.length + " (running) containers" + "\r\n";
            }
            isFirstRun=false;
        }

        // check if any containers have been deleted between scans
        if(monContainers.length !== 0 ){
            monContainers.forEach(c => {
                let delArray = newConArray.filter(nc => nc.includes(c.split(",")[0]));
                // if no match in history array and latest scan, then is deleted
                if(delArray.length==0 && EXCLUDE_EXITED !== 'true'){
                    var output = c.split(",")[2].replace("/","") + ": exited"
                    if(SHA.toLowerCase()=='true'){
                        output += " " + c.ImageID
                    }
                    console.log("    - " + output);
                    //send(output)
                    messages += output + "\r\n";
                }
            });
        }

        // do final send of any messages generated
        //send(messages.length);
        if(messages.length != 0){
           send(messages);
        }
//        let now = new Date();
//        send('tick: ' + now.toLocaleString());
        // assign new array to be current array state
        monContainers = newConArray;
    }, Promise.resolve(0));
}

async function run() {
    // stop timer to ensure no race conditions
    clearInterval(runClock);
    // run check
    await list();
    // restart timer
    runClock = setInterval(run, PERIOD * 1000);
}

// start processing
run();
