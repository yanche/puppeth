
import Web3 = require("web3");
import * as config from "../../config";
import { nonEmptyString, nonNegInt, posInt, getAddressListOrThrow, signTxOffline, optionalNonNegInt, ethValue, gasPrice } from "./util";

export const shape = {
    value: ethValue,
    gasPrice: gasPrice,
    privateKey: nonEmptyString,
    recipientStartIndex: nonNegInt,
    recipientNumber: posInt,
    tag: nonEmptyString,
    nonceStart: optionalNonNegInt,
}

export type InputType = {
    value: number;
    gasPrice: number;
    privateKey: string;
    recipientStartIndex: number;
    recipientNumber: number;
    tag: string;
    nonceStart?: number;
}

// CORE processor
// NO input validation
export async function signTx(options: InputType): Promise<void> {
    const recipientAccounts = await getAddressListOrThrow(options.recipientStartIndex, options.recipientNumber);

    const offlineMode = options.nonceStart !== undefined;
    const web3 = new Web3(config.web3Provider);

    console.log(`running in ${offlineMode ? "offline" : "online"} mode`);

    const senderAddress = web3.eth.accounts.privateKeyToAccount(options.privateKey).address;
    console.log(`from address: ${senderAddress}`);

    if (!offlineMode) {
        const balance = await web3.eth.getBalance(senderAddress);
        console.log(`balance: ${balance}`);
        const cost = options.recipientNumber * (options.value + options.gasPrice * config.sendEtherGasCost);
        if (balance < cost) {
            throw new Error(`insufficient balance, you need: ${cost}`);
        }
    }

    const nonceStart = offlineMode ? options.nonceStart : await web3.eth.getTransactionCount(senderAddress);

    const txArr = recipientAccounts.map((account, index) => {
        // this shall be synchronous call
        return signTxOffline({
            privateKey: options.privateKey,
            nonce: index + nonceStart,
            address: account.address,
            value: options.value,
            gasPrice: options.gasPrice,
            tag: options.tag,
        });
    });

    await config.txColl.bulkInsert(txArr);
    
    console.info(`signed & saved ${txArr.length} transactions into mongo with tag ${options.tag}`);
}
