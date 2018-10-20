
import * as createAcct from "./actions/createAcct";
import * as signTx from "./actions/signTx";
import * as sendTx from "./actions/sendTx";
import * as extractTx from "./actions/extractTx";
import * as syncBalance from "./actions/syncBalance";

const actionMap = new Map<string, (arg: string) => Promise<any>>();
actionMap.set("createAcct", createAcct.handle);
actionMap.set("signTx", signTx.handle);
actionMap.set("sendTx", sendTx.handle);
actionMap.set("extractTx", extractTx.handle);
actionMap.set("syncBalance", syncBalance.handle);

async function processAction() {
    const actionType = process.argv[2];
    const actionArg = process.argv[3];

    const handler = actionMap.get(actionType);
    if (handler) {
        await handler(actionArg || "");
    } else {
        throw new Error(`action not supported: ${actionType}`);
    }
}

processAction()
    .then(() => {
        return 0;
    }, err => {
        console.error("ERROR:", err.message);
        return 1;
    })
    .then(n => process.exit(n));
