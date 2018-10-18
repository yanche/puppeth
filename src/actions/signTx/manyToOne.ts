
import * as config from "../../config";
import { wei, nonEmptyString, nonNegInt, posInt, getAddressListOrThrow, signTxOffline } from "./util";

export const shape = {
    value: wei,
    gasPrice: wei,
    address: nonEmptyString,
    senderStartIndex: nonNegInt,
    senderNumber: posInt,
    tag: nonEmptyString,
}

export type InputType = {
    value: number;
    gasPrice: number;
    address: string;
    senderStartIndex: number;
    senderNumber: number;
    tag: string;
}

// CORE processor
// NO input validation
export async function signTx(options: InputType): Promise<void> {
    console.log("running in offline mode");
    console.log(`to address: ${options.address}`);

    const senderAccounts = (await getAddressListOrThrow(options.senderStartIndex, options.senderNumber)).map((acct, i) => ({ acct: acct, index: i }));

    const resultArr = await Promise.all(senderAccounts.map(entry => {
        // synchronous signing
        return signTxOffline({
            privateKey: entry.acct.privateKey,
            nonce: entry.acct.nextNonce,
            address: options.address,
            value: options.value,
            gasPrice: options.gasPrice,
            tag: options.tag,
        });
    }));

    await config.txColl.bulkInsert(resultArr);
    await config.acctColl.updateAll(
        // increase the nextNonce field of all related accounts
        { index: { $gte: options.senderStartIndex, $lt: options.senderStartIndex + options.senderNumber } },
        { $inc: { nextNonce: 1 } });
}
