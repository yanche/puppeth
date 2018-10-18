
import Web3 = require("web3");
import * as config from "../../config";
import { wei, nonEmptyString } from "./util";

export const shape = {
    value: wei,
    gasPrice: wei,
    privateKey: nonEmptyString,
    recipientAddress: nonEmptyString,
    tag: nonEmptyString,
}

export type InputType = {
    value: number;
    gasPrice: number;
    privateKey: string;
    recipientAddress: string;
    tag: string;
}

// CORE processor
// NO input validation
export async function signTx(options: InputType): Promise<void> {
    const web3 = new Web3(config.web3Provider);
    const senderAddress = web3.eth.accounts.privateKeyToAccount(options.privateKey).address;
    console.log(`from address: ${senderAddress}`);
    const balance = await web3.eth.getBalance(senderAddress);
    console.log(`balance: ${balance}`);
    const cost = options.value + options.gasPrice * config.sendEtherGasCost;
    if (balance < cost) {
        throw new Error(`insufficient balance, you need: ${cost}`);
    }

    const nonce = await web3.eth.getTransactionCount(senderAddress);
    // this shall be synchronous call
    const tx = await web3.eth.accounts.signTransaction({
        nonce: nonce,
        to: options.recipientAddress,
        value: options.value,
        gas: config.sendEtherGasCost,
        gasPrice: options.gasPrice,
        chainId: config.chainId,
    }, options.privateKey);

    await config.txColl.createOne({
        txData: tx.rawTransaction,
        from: senderAddress,
        nonce: nonce,
        to: options.recipientAddress,
        wei: options.value,
        gas: config.sendEtherGasCost,
        gasPriceWei: options.gasPrice,
        tag: options.tag,
    });
}
