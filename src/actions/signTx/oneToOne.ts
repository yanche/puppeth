
import Web3 = require("web3");
import * as config from "../../config";
import { nonEmptyString, signTxOffline, optionalNonNegInt, ethValue, gasPrice } from "./util";

export const shape = {
    value: ethValue,
    gasPrice: gasPrice,
    privateKey: nonEmptyString,
    recipientAddress: nonEmptyString,
    tag: nonEmptyString,
    nonce: optionalNonNegInt,
}

export type InputType = {
    value: number;
    gasPrice: number;
    privateKey: string;
    recipientAddress: string;
    tag: string;
    nonce?: number;
}

// CORE processor
// NO input validation
export async function signTx(options: InputType): Promise<void> {
    const offlineMode = options.nonce !== undefined;
    const web3 = new Web3(config.web3Provider);

    console.log(`running in ${offlineMode ? "offline" : "online"} mode`);

    const senderAddress = web3.eth.accounts.privateKeyToAccount(options.privateKey).address;
    console.log(`from address: ${senderAddress}`);

    if (!offlineMode) {
        const balance = await web3.eth.getBalance(senderAddress);
        console.log(`balance: ${balance}`);
        const cost = options.value + options.gasPrice * config.sendEtherGasCost;
        if (balance < cost) {
            throw new Error(`insufficient balance, you need: ${cost}`);
        }
    }

    const nonce = offlineMode ? options.nonce : await web3.eth.getTransactionCount(senderAddress);
    // this shall be synchronous call
    const tx = await signTxOffline({
        nonce: nonce,
        address: options.recipientAddress,
        value: options.value,
        gasPrice: options.gasPrice,
        privateKey: options.privateKey,
        tag: options.tag,
    });

    await config.txColl.createOne(tx);
}
