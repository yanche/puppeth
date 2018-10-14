
import Web3 = require("web3");
import * as utility from "../utility";
import * as config from "../config";

const sendEtherGasCost = 21000;
const ethChainId = 1;

export async function oneToMany(options: {
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
    const address = web3.eth.accounts.privateKeyToAccount(options.privateKey).address;
    console.log(`address: ${address}`);
    const balance = await web3.eth.getBalance(address);
    console.log(`balance: ${balance}`);
    const cost = options.recipientNumber * (options.wei + options.gasPriceWei * sendEtherGasCost);
    if (balance < cost) {
        throw new Error(`insufficient balance, you need: ${cost}`);
    }
    const nonceStart = await web3.eth.getTransactionCount(address);

    const txArr = await Promise.all(recipientAccounts.map(async ({ address }, index) => {
        // this shall be synchronous call
        const nonce = index + nonceStart + 1;
        const tx = await web3.eth.accounts.signTransaction({
            nonce: nonce,
            to: address,
            value: options.wei,
            gas: sendEtherGasCost,
            gasPrice: options.gasPriceWei,
            chainId: ethChainId,
        }, options.privateKey);
        return <config.Transaction>{
            txData: tx.rawTransaction,
            from: address,
            nonce: nonce,
            to: address,
            wei: options.wei,
            gas: sendEtherGasCost,
            gasPriceWei: options.gasPriceWei,
            tag: options.tag,
        };
    }));
    const txCollection = config.mongo.collections.transactions;
    const txColl = db.getCollClient<config.Transaction>(txCollection.name, txCollection.fields);
    await txColl.bulkInsert(txArr);
}