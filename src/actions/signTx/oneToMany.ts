
import Web3 = require("web3");
import * as config from "../../config";
import { parseEthUnit, validateNonEmptyString, validateNonNegInt, validatePosInt, getAddressListOrThrow } from "./util";

// validator
export async function oneToMany(args: { [key: string]: any }): Promise<void> {
    const errors: string[] = [];

    const wei = parseEthUnit("value", args["value"], 0, errors);
    // at least 1GWei gas price
    const gasPriceWei = parseEthUnit("gasPrice", args["gasPrice"], config.weiPerGWei, errors);
    const recipientStartIndex: number = args["recipientStartIndex"];
    const recipientNumber: number = args["recipientNumber"];
    const privateKey: string = args["privateKey"];
    const tag: string = args["tag"];

    if (!wei.valid ||
        !gasPriceWei.valid ||
        !validateNonNegInt("recipientStartIndex", recipientStartIndex, errors) ||
        !validatePosInt("recipientNumber", recipientNumber, errors) ||
        !validateNonEmptyString("privateKey", privateKey, errors) ||
        !validateNonEmptyString("tag", tag, errors)) {
        throw new Error(errors.join("\n"));
    }

    await _oneToMany({
        wei: wei.wei,
        gasPriceWei: gasPriceWei.wei,
        privateKey: privateKey.trim(),
        recipientStartIndex,
        recipientNumber,
        tag: tag.trim(),
    });
}

// CORE processor
async function _oneToMany(options: {
    wei: number;
    gasPriceWei: number;
    privateKey: string;
    recipientStartIndex: number;
    recipientNumber: number;
    tag: string;
}): Promise<void> {
    const recipientAccounts = await getAddressListOrThrow(options.recipientStartIndex, options.recipientNumber);

    const web3 = new Web3(config.web3Provider);
    const senderAddress = web3.eth.accounts.privateKeyToAccount(options.privateKey).address;
    console.log(`from address: ${senderAddress}`);
    const balance = await web3.eth.getBalance(senderAddress);
    console.log(`balance: ${balance}`);
    const cost = options.recipientNumber * (options.wei + options.gasPriceWei * config.sendEtherGasCost);
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
            value: options.wei,
            gas: config.sendEtherGasCost,
            gasPrice: options.gasPriceWei,
            chainId: config.chainId,
        }, options.privateKey);
        return <config.Transaction>{
            txData: tx.rawTransaction,
            from: senderAddress,
            nonce: nonce,
            to: account.address,
            wei: options.wei,
            gas: config.sendEtherGasCost,
            gasPriceWei: options.gasPriceWei,
            tag: options.tag,
        };
    }));
    await config.txColl.bulkInsert(txArr);
}
