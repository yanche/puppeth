
import Web3 = require("web3");
import * as config from "../config";
import { roll, delay } from "@belongs/asyncutil";
import { getPipedString } from "../utility";

export function handle(arg: string): Promise<void> {
    if (process.stdin.isTTY) {
        return handleTTYMode(arg);
    } else {
        return handlePipeMode();
    }
}

async function handleTTYMode(arg: string): Promise<void> {
    // TTY mode, tag from cmd line argument
    if (typeof arg !== "string" || !arg.trim().length) {
        throw new Error(`input as tag must be a non empty string: ${arg}`);
    }
    // get tx data from db
    const tag = arg.trim();

    const txArr = await config.txColl.getAll({ tag: tag }, { _id: 1, txData: 1 });
    console.info(`found ${txArr.length} transactions with tag: ${tag}`);

    const web3 = new Web3(config.web3Provider);
    await roll(txArr, async tx => {
        await delay(config.sendTxFreqMs);
        const success = await sendSignedTransaction(web3, tx.txData);
        if (success) {
            // update db status
            await config.txColl.updateAll({ _id: tx._id }, { $set: { done: 1 } });
        }
    }, 1);
}

async function handlePipeMode(): Promise<void> {
    // non TTY, assume tx data from stdin
    const pipedStr = await getPipedString();
    const txDataArr = pipedStr.split("\n").filter(n => n.trim());
    const web3 = new Web3(config.web3Provider);
    await roll(txDataArr, async txData => {
        await delay(config.sendTxFreqMs);
        await sendSignedTransaction(web3, txData);
    }, 1);
}

// promise never rejected, return true for success, false for failure
function sendSignedTransaction(web3: Web3, txData: string): Promise<boolean> {
    return new Promise(res => {
        // for some reason without callback, sendSignedTransaction does not work (hang forever)
        web3.eth.sendSignedTransaction(txData, (err, result) => {
            if (err) {
                console.error(`failed to send tx ${txData}`);
                console.error(err);
                res(false);
            } else {
                res(true);
            }
        });
    });
}
