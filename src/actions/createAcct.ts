
import Web3 = require("web3");
import * as utility from "../utility";
import * as config from "../config";

export async function process(arg: string): Promise<void> {
    const num = Number(arg);
    if (!Number.isSafeInteger(num) || num <= 0) {
        throw new Error(`input must be an positive integer: ${arg}`);
    }

    await createAccounts(num);
}

// number must be positive integer
async function createAccounts(number: number): Promise<void> {
    console.info(`creating ${number} accounts.`);

    const accountCollection = config.mongo.collections.accounts;
    const coll = new utility.mongo.DbClient(config.mongo.url).getCollClient<config.Account>(accountCollection.name, accountCollection.fields);
    // ASSUME accounts in mongodb has consecutive index starts from 0
    const acctNum = await coll.count();
    console.info(`now have ${acctNum} accounts, index starts from ${acctNum}`);

    const web3 = new Web3();
    const arr = Array<config.Account>(number);
    for (let i = 0; i < number; ++i) {
        const { privateKey, address } = web3.eth.accounts.create();
        arr[i] = {
            privateKey: privateKey,
            address: address,
            index: acctNum + i,
        };
    }

    await coll.bulkInsert(arr);
    const acctNum2 = await coll.count();
    console.info(`now have ${acctNum2} accounts.`);
}
