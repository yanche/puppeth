
import Web3 = require("web3");
import * as config from "../../config";
import { parseEthUnit, validateNonEmptyString } from "./util";

// validator
export async function oneToOne(args: { [key: string]: any }): Promise<void> {
    const errors: string[] = [];

    const wei = parseEthUnit("value", args["value"], 0, errors);
    // at least 1GWei gas price
    const gasPriceWei = parseEthUnit("gasPrice", args["gasPrice"], config.weiPerGWei, errors);
    const privateKey: string = args["privateKey"];
    const recipientAddress: string = args["recipientAddress"];
    const tag: string = args["tag"];

    if (!wei.valid ||
        !gasPriceWei.valid ||
        !validateNonEmptyString("recipientAddress", recipientAddress, errors) ||
        !validateNonEmptyString("privateKey", privateKey, errors) ||
        !validateNonEmptyString("tag", tag, errors)) {
        throw new Error(errors.join("\n"));
    }

    await _oneToOne({
        wei: wei.wei,
        gasPriceWei: gasPriceWei.wei,
        privateKey: privateKey.trim(),
        recipientAddress,
        tag: tag.trim(),
    });
}

// CORE processor
async function _oneToOne(options: {
    wei: number;
    gasPriceWei: number;
    privateKey: string;
    recipientAddress: string;
    tag: string;
}): Promise<void> {
    const web3 = new Web3(config.web3Provider);
    const senderAddress = web3.eth.accounts.privateKeyToAccount(options.privateKey).address;
    console.log(`from address: ${senderAddress}`);
    const balance = await web3.eth.getBalance(senderAddress);
    console.log(`balance: ${balance}`);
    const cost = options.wei + options.gasPriceWei * config.sendEtherGasCost;
    if (balance < cost) {
        throw new Error(`insufficient balance, you need: ${cost}`);
    }

    const nonce = await web3.eth.getTransactionCount(senderAddress);
    // this shall be synchronous call
    const tx = await web3.eth.accounts.signTransaction({
        nonce: nonce,
        to: options.recipientAddress,
        value: options.wei,
        gas: config.sendEtherGasCost,
        gasPrice: options.gasPriceWei,
        chainId: config.chainId,
    }, options.privateKey);

    await config.txColl.createOne({
        txData: tx.rawTransaction,
        from: senderAddress,
        nonce: nonce,
        to: options.recipientAddress,
        wei: options.wei,
        gas: config.sendEtherGasCost,
        gasPriceWei: options.gasPriceWei,
        tag: options.tag,
    });
}
