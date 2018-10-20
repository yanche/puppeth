
import Web3 = require("web3");
import * as config from "../config";
import { roll } from "@belongs/asyncutil";

export async function handle(): Promise<void> {
    const web3 = new Web3(config.web3Provider);
    const accounts = await config.acctColl.getAll({}, { _id: 1, address: 1 });
    console.info(`found ${accounts.length} accounts`);
    await roll(accounts, async account => {
        const balance = await web3.eth.getBalance(account.address);
        await config.acctColl.updateAll({ _id: account._id }, { $set: { balance: balance } });
        console.info(`${account.address} done, balance: ${balance}`);
    }, Math.min(10, accounts.length));
}
