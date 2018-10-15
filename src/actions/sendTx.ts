
import Web3 = require("web3");
import * as utility from "../utility";
import * as config from "../config";
import { roll } from "@belongs/asyncutil";

export function process(arg: string): Promise<void> {
    return sendTxWithTag(arg);
}

async function sendTxWithTag(tag: string): Promise<void> {
    const txCollection = config.mongo.collections.transactions;
    const db = new utility.mongo.DbClient(config.mongo.url);
    const txColl = db.getCollClient<config.Transaction>(txCollection.name, txCollection.fields);
    const txArr = await txColl.getAll({ tag: tag }, { _id: 1, txData: 1 });
    console.info(`found ${txArr.length} transactions with tag: ${tag}`);

    const web3 = new Web3(config.web3Provider);
    await roll<config.Transaction, void>(txArr, async tx => {
        try {
            await web3.eth.sendSignedTransaction(tx.txData);
        } catch (err) {
            console.error(`failed to send tx, mongo _id: ${tx._id.toHexString()}`);
            console.error(err);
            throw err;
        }
        await txColl.updateAll({ _id: tx._id }, { $set: { done: 1 } });
    }, Math.min(10, txArr.length));
}
