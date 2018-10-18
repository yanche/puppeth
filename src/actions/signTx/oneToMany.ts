
import Web3 = require("web3");
import * as config from "../../config";
import { wei, nonEmptyString, nonNegInt, posInt, getAddressListOrThrow } from "./util";

export const shape = {
    value: wei,
    gasPrice: wei,
    privateKey: nonEmptyString,
    recipientStartIndex: nonNegInt,
    recipientNumber: posInt,
    tag: nonEmptyString,
}

export type InputType = {
    value: number;
    gasPrice: number;
    privateKey: string;
    recipientStartIndex: number;
    recipientNumber: number;
    tag: string;
}

// CORE processor
// NO input validation
export async function signTx(options: InputType): Promise<void> {
    const recipientAccounts = await getAddressListOrThrow(options.recipientStartIndex, options.recipientNumber);

    const web3 = new Web3(config.web3Provider);
    const senderAddress = web3.eth.accounts.privateKeyToAccount(options.privateKey).address;
    console.log(`from address: ${senderAddress}`);
    const balance = await web3.eth.getBalance(senderAddress);
    console.log(`balance: ${balance}`);
    const cost = options.recipientNumber * (options.value + options.gasPrice * config.sendEtherGasCost);
    if (balance < cost) {
        throw new Error(`insufficient balance, you need: ${cost}`);
    }
    const nonceStart = await web3.eth.getTransactionCount(senderAddress);

    const txArr = await Promise.all(recipientAccounts.map(async (account, index) => {
        // this shall be synchronous call
        const nonce = index + nonceStart;
        const tx = await web3.eth.accounts.signTransaction({
            nonce: nonce,
            to: account.address,
            value: options.value,
            gas: config.sendEtherGasCost,
            gasPrice: options.gasPrice,
            chainId: config.chainId,
        }, options.privateKey);
        return <config.Transaction>{
            txData: tx.rawTransaction,
            from: senderAddress,
            nonce: nonce,
            to: account.address,
            wei: options.value,
            gas: config.sendEtherGasCost,
            gasPriceWei: options.gasPrice,
            tag: options.tag,
        };
    }));
    await config.txColl.bulkInsert(txArr);
}
