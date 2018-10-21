
import Web3 = require("web3");
import * as config from "../../config";
import { roll, delay } from "@belongs/asyncutil";
import { shortenMsg, logHeadTailShortMsg } from "../../utility";
import { retrieveTxData } from "./util";

export async function handle(arg: string): Promise<void> {
    const input = await retrieveTxData(arg, { txData: 1 }, raw => ({ txData: raw }));
    const count = input.txArr.length;
    if (input.piped) {
        console.info(`received ${count} transactions from stdin`);
        logHeadTailShortMsg(input.txArr.map(tx => tx.txData));
    } else {
        console.info(`found ${count} transactions with tag: ${arg.trim()}`);
    }

    if (count > 0) {
        console.info(`now start sending, NETWORK: ${config.signTxToNetwork}`);
        await sendAllSignedTransactions(input.txArr.map(tx => tx.txData));
    }
}

// promise never rejected
async function sendAllSignedTransactions(txDataArr: string[]): Promise<void> {
    const web3 = new Web3(config.web3Provider);
    await roll(txDataArr, async txData => {
        await delay(config.sendTxFreqMs);
        await sendSignedTransaction(web3, txData);
    }, 1);
}

// promise never rejected
function sendSignedTransaction(web3: Web3, txData: string): Promise<void> {
    return new Promise(res => {
        // for some reason without callback, sendSignedTransaction does not work (hang forever)
        web3.eth.sendSignedTransaction(txData, (err, result) => {
            const shortTxMsg = shortenMsg(txData);
            if (err) {
                console.error(`failed to send tx ${shortTxMsg}`);
                // stack trace won't make any sense here
                console.error(err.message);
            } else {
                console.info(`done ${shortTxMsg}, hash: ${shortenMsg(result)}`);
            }
            res();
        });
    });
}
