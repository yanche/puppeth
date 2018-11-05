
import * as config from "../config";
import * as ethers from "ethers";

export async function handle(arg: string): Promise<void> {
    const num = Number(arg);
    if (!Number.isSafeInteger(num) || num <= 0) {
        throw new Error(`input must be an positive integer: ${arg}`);
    }

    await createAccounts(num);
}

// number must be positive integer
async function createAccounts(number: number): Promise<void> {
    console.info(`creating ${number} accounts.`);

    // ASSUME accounts in mongodb has consecutive index starts from 0
    const acctNum = await config.acctColl.count();
    console.info(`had ${acctNum} accounts`);

    const arr = Array<config.Account>(number);
    for (let i = 0; i < number; ++i) {
        const mnemonic = ethers.utils.HDNode.entropyToMnemonic(ethers.utils.randomBytes(32));
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);
        arr[i] = {
            mwords: wallet.mnemonic,
            privateKey: wallet.privateKey,
            address: wallet.address,
            index: acctNum + i,
            nextNonce: 0,
        };
    }
    
    await config.acctColl.bulkInsert(arr);
    const acctNum2 = await config.acctColl.count();
    console.info(`now have ${acctNum2} accounts. new accounts' index starts from ${acctNum}`);
}
