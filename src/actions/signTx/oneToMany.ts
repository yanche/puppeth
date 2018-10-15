
import Web3 = require("web3");
import * as utility from "../../utility";
import * as config from "../../config";
import { parseEthUnit, validateNonEmptyString, validateNonNegInt, validatePosInt } from "./util";

// validator
export async function oneToMany(args: { [key: string]: any }): Promise<void> {
    const errors: string[] = [];

    const wei = parseEthUnit("value", args["value"], errors);
    const gasPriceWei = parseEthUnit("gasPrice", args["gasPrice"], errors);
    const startIndex: number = args["startIndex"];
    const recipientNumber: number = args["recipientNumber"];
    const privateKey: string = args["privateKey"];
    const tag: string = args["tag"];

    if (!wei.valid ||
        !gasPriceWei.valid ||
        !validateNonNegInt("startIndex", startIndex, errors) ||
        !validatePosInt("recipientNumber", recipientNumber, errors) ||
        !validateNonEmptyString("privateKey", privateKey, errors) ||
        !validateNonEmptyString("tag", tag, errors)) {
        throw new Error(errors.join("\n"));
    }

    await _oneToMany({
        wei: wei.wei,
        gasPriceWei: gasPriceWei.wei,
        privateKey: privateKey.trim(),
        startIndex,
        recipientNumber,
        tag: tag.trim(),
    });
}

// CORE processor
async function _oneToMany(options: {
    wei: number;
    gasPriceWei: number;
    privateKey: string;
    startIndex: number;
    recipientNumber: number;
    tag: string;
}): Promise<void> {
    const accountCollection = config.mongo.collections.accounts;
    const db = new utility.mongo.DbClient(config.mongo.url);
    const acctColl = db.getCollClient<config.Account>(accountCollection.name, accountCollection.fields);
    const recipientAccounts = await acctColl.getAll({ index: { $gte: options.startIndex, $lt: options.startIndex + options.recipientNumber } }, { address: 1 });
    if (recipientAccounts.length !== options.recipientNumber) {
        throw new Error(`no enough accounts, found ${recipientAccounts.length} from index ${options.startIndex}`);
    }

    const web3 = new Web3(config.web3Provider);
    const senderAddress = web3.eth.accounts.privateKeyToAccount(options.privateKey).address;
    console.log(`address: ${senderAddress}`);
    const balance = await web3.eth.getBalance(senderAddress);
    console.log(`balance: ${balance}`);
    const cost = options.recipientNumber * (options.wei + options.gasPriceWei * config.sendEtherGasCost);
    if (balance < cost) {
        throw new Error(`insufficient balance, you need: ${cost}`);
    }
    const nonceStart = await web3.eth.getTransactionCount(senderAddress);

    const txArr = await Promise.all(recipientAccounts.map(async ({ address }, index) => {
        // this shall be synchronous call
        const nonce = index + nonceStart + 1;
        const tx = await web3.eth.accounts.signTransaction({
            nonce: nonce,
            to: address,
            value: options.wei,
            gas: config.sendEtherGasCost,
            gasPrice: options.gasPriceWei,
            chainId: config.chainId,
        }, options.privateKey);
        return <config.Transaction>{
            txData: tx.rawTransaction,
            from: senderAddress,
            nonce: nonce,
            to: address,
            wei: options.wei,
            gas: config.sendEtherGasCost,
            gasPriceWei: options.gasPriceWei,
            tag: options.tag,
        };
    }));
    const txCollection = config.mongo.collections.transactions;
    const txColl = db.getCollClient<config.Transaction>(txCollection.name, txCollection.fields);
    await txColl.bulkInsert(txArr);
}
