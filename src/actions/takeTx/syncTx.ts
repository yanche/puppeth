
import Web3 = require("web3");
import * as config from "../../config";
import { roll } from "@belongs/asyncutil";
import { logHeadTailShortMsg } from "../../utility";
import { retrieveTxData } from "./util";

export async function handle(arg: string): Promise<void> {
    const input = await retrieveTxData(arg, { _id: 1, txHash: 1 }, raw => ({ txHash: raw }));
    const count = input.txArr.length;
    if (input.piped) {
        console.info(`received ${count} transactions from stdin`);
        logHeadTailShortMsg(input.txArr.map(tx => tx.txHash));
    } else {
        console.info(`found ${count} transactions with tag: ${arg.trim()}`);
    }

    if (count > 0) {
        console.info(`now start sync-ing, NETWORK: ${config.ethNetwork}`);
        await syncTransactions(input.txArr, !input.piped);
    }
}

// promise never rejected
async function syncTransactions(txArr: config.Transaction[], saveDb: boolean): Promise<void> {
    const web3 = new Web3(config.web3Provider);
    await roll(txArr, async tx => {
        try {
            const txInChain = await web3.eth.getTransaction(tx.txHash);
            if (!txInChain.blockHash) {
                // pending transaction
                console.info(`${tx.txHash}: pending`);
                saveDb && await config.txColl.updateAll({ _id: tx._id }, { $set: { status: config.TxStatus.pending } });
            } else {
                // complte
                console.info(`${tx.txHash}: completed, ${txInChain.blockNumber}`);
                saveDb && await config.txColl.updateAll({ _id: tx._id }, { $set: { status: config.TxStatus.complete, blockHash: txInChain.blockHash, blockNumber: txInChain.blockNumber } });
            }
        }
        catch (err) {
            // unknown
            console.error(`error when sync ${tx.txHash}: ${err.message}`);
            saveDb && await config.txColl.updateAll({ _id: tx._id }, { $set: { status: config.TxStatus.unknown } });
        }
    }, Math.min(10, txArr.length));
}
