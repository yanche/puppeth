
import Web3 = require("web3");
import * as utility from "../utility";
import * as config from "../config";
import { roll, delay } from "@belongs/asyncutil";

export function process(arg: string): Promise<void> {
    return sendTxWithTag(arg);
}

async function sendTxWithTag(tag: string): Promise<void> {
    const txCollection = config.mongo.collections.transactions;
    const db = new utility.mongo.DbClient(config.mongo.url);
    const txColl = db.getCollClient<config.Transaction>(txCollection.name, txCollection.fields);
    const txArr = await txColl.getAll({ tag: tag }, { _id: 1, txData: 1 });
    console.info(`found ${txArr.length} transactions with tag: ${tag}`);

    if (!txArr.length) {
        return;
    }

    const web3 = new Web3(config.web3Provider);
    await roll<config.Transaction, void>(txArr, async tx => {
        await delay(config.sendTxFreqMs);

        try {
            await sendSignedTransaction(web3, tx.txData);
        } catch (err) {
            console.error(`failed to send tx, mongo _id: ${tx._id.toHexString()}`);
            console.error(err);
            throw err;
        }
        await txColl.updateAll({ _id: tx._id }, { $set: { done: 1 } });
    }, 1);
}

function sendSignedTransaction(web3: Web3, txData: string): Promise<void> {
    return new Promise((res, rej) => {
        // for some reason without callback, sendSignedTransaction does not work (hang forever)
        web3.eth.sendSignedTransaction(txData, (err, result) => {
            err ? rej(err) : res();
        });
    });
}
