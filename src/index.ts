
import * as createAcct from "./actions/createAcct";
import * as signTx from "./actions/signTx";
import * as sendTx from "./actions/sendTx";
import * as extractTx from "./actions/extractTx";

const actionMap = new Map<string, (arg: string) => Promise<any>>();
actionMap.set("createAcct", createAcct.handle);
actionMap.set("signTx", signTx.handle);
actionMap.set("sendTx", sendTx.handle);
actionMap.set("extractTx", extractTx.handle);

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
        throw new Error(`action not supported: ${actionType}`);
    }
}

processAction()
    .then(() => {
        return 0;
    }, err => {
        console.error(err);
        return 1;
    })
    .then(n => process.exit(n));
