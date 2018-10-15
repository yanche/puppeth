
import * as createAcct from "./actions/createAcct";
import * as signTx from "./actions/signTx";
import * as sendTx from "./actions/sendTx";

const actionMap = new Map<string, (arg: string) => Promise<any>>();
actionMap.set("createAcct", createAcct.process);
actionMap.set("signTx", signTx.process);
actionMap.set("sendTx", sendTx.process);

// node ./src/index.js createAcct {number}
// node ./src/index.js sendTx {tag}
// node ./src/index.js signTx {path-to-json}

async function processAction() {
    const actionType = process.argv[2];
    const actionArg = process.argv[3];

    const handler = actionMap.get(actionType);
    if (handler) {
        await handler(actionArg);
    } else {
        throw new Error(`action not found: ${actionType}`);
    }
}

processAction()
    .then(() => {
        console.info("done");
    }, err => {
        console.error(err);
    });
