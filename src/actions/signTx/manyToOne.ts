
import Web3 = require("web3");
import { roll } from "@belongs/asyncutil";
import * as config from "../../config";
import { wei, nonEmptyString, nonNegInt, posInt, getAddressListOrThrow } from "./util";

export const shape = {
    value: wei,
    gasPrice: wei,
    address: nonEmptyString,
    senderStartIndex: nonNegInt,
    senderNumber: posInt,
    tag: nonEmptyString,
}

export type InputType = {
    value: number;
    gasPrice: number;
    address: string;
    senderStartIndex: number;
    senderNumber: number;
    tag: string;
}

// CORE processor
// NO input validation
export async function signTx(options: InputType): Promise<void> {
    console.log(`to address: ${options.address}`);

    const senderAccounts = (await getAddressListOrThrow(options.senderStartIndex, options.senderNumber)).map((acct, i) => ({ acct: acct, index: i }));
    const web3 = new Web3(config.web3Provider);

    const resultArr = Array<config.Transaction>(senderAccounts.length);
    await roll(senderAccounts, async entry => {

        // synchronous signing
        const tx = await web3.eth.accounts.signTransaction({
            nonce: entry.acct.nextNonce,
            to: options.address,
            value: options.value,
            gas: config.sendEtherGasCost,
            gasPrice: options.gasPrice,
            chainId: config.chainId,
        }, entry.acct.privateKey);

        resultArr[entry.index] = {
            txData: tx.rawTransaction,
            from: entry.acct.address,
            nonce: entry.acct.nextNonce,
            to: options.address,
            wei: options.value,
            gas: config.sendEtherGasCost,
            gasPriceWei: options.gasPrice,
            tag: options.tag,
        };

        // 100: just to not have too many promises
    }, Math.min(senderAccounts.length, 100));

    await config.txColl.bulkInsert(resultArr);
    await config.acctColl.updateAll(
        // increase the nextNonce field of all related accounts
        { index: { $gte: options.senderStartIndex, $lt: options.senderStartIndex + options.senderNumber } },
        { $inc: { nextNonce: 1 } });
}
