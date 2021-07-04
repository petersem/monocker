const Telegram = require('telegram-notify');
const Docker = require('dockerode');
const pjson = require("./package.json");

let docker = new Docker({socketPath: '/var/run/docker.sock'});
// var docker = new Docker({
//     protocol: 'http', //you can enforce a protocol
//     host: 'localhost',
//     port: 2375 //process.env.DOCKER_PORT || 2375
// });

const TID = process.env.TELEGRAM_ID; // || "1472584417:AAFW1zbGk17i8kGeTLAByLxmwkaBScWhqvo";
const TCID = process.env.TELEGRAM_CHAT_ID; // || "-448418280";
const LABEL_ENABLE = process.env.MONOCKER_LABEL_DISABLE || 'false'
const LABEL_DISABLE = process.env.MONOCKER_LABEL_DISABLE || 'false'


let monContainers = [];
console.log("-------------------------------------------------------");
console.log(" Monocker - MONitor dOCKER container states");
console.log(" Developed by Matt Petersen - Brisbane Australia");
console.log(" ");
console.log(" Version: " + pjson.version);
console.log("-------------------------------------------------------");

async function send(message){
    let notify = new Telegram({token:TID, chatId:TCID});
    await notify.send(message, {timeout: 10000}, {parse_mode: 'html'});
}

async function list(){
    let now = new Date();
    console.log(now.toLocaleString() + " - Container scan");
    docker.listContainers({all: true}, function(err, containers) {
        // check for changes in status (first run is populating data only)
        let newConArray = [];
        containers.forEach(c => {
            // determine if covered by healthcheck
            let hcStatus = "";
            if(c.Status.includes("(healthy)")) hcStatus="(healthy)"
            if(c.Status.includes("(unhealthy)")) hcStatus="(unhealthy)"
            if(monContainers.includes(c.Id + "," + c.State + "," + hcStatus) == false && monContainers.length !== 0 ){
                console.log("    - " +c.Names[0].replace("/","") + ": " + c.State + " " + hcStatus);
                send(`<b>MONOCKER</b>
` + c.Names[0].replace("/","") +": <i>"+c.State + " " + hcStatus + "</i>")
            }
            // create new container array
            newConArray.push(c.Id + "," + c.State + "," + hcStatus);
        });

//         // check if any containers have been deleted between scans
//         if(monContainers.length !== 0 ){
//             monContainers.forEach(c => {
//                 let delArray = newConArray.filter(nc => nc.includes(c.Id));
//                 // if no match in history array and latest scan, then is deleted
//                 if(delArray.length==0){
//                     console.log("    - " +c.Names[0].replace("/","") + ": Deleted");
//                     send(`<b>MONOCKER</b>
// ` + c.Names[0].replace("/","") +": <i>Deleted</i>")
//                 }
//             });
//         }

        // assign new array to be current array state
        monContainers = newConArray;
    }, Promise.resolve(0));
}

async function run(){
    await list();
}

send(`<b>MONOCKER</b>
Monitoring started`)
setInterval(run,10000);
