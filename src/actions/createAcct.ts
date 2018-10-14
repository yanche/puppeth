
import Web3 = require("web3");
import * as utility from "../utility";
import * as config from "../config";

// number must be positive integer
export async function createAccounts(number: number): Promise<void> {
    const accountCollection = config.mongo.collections.accounts;
    const coll = new utility.mongo.DbClient(config.mongo.url).getCollClient<config.Account>(accountCollection.name, accountCollection.fields);
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
