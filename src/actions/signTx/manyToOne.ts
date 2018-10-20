
import * as config from "../../config";
import { nonEmptyString, nonNegInt, posInt, getAddressListOrThrow, signTxOffline, ethValue, gasPrice } from "./util";

export const shape = {
    value: ethValue,
    gasPrice: gasPrice,
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

    const resultArr = senderAccounts.map(entry => {
        // synchronous signing
        return signTxOffline({
            privateKey: entry.acct.privateKey,
            nonce: entry.acct.nextNonce,
            address: options.address,
            value: options.value,
            gasPrice: options.gasPrice,
            tag: options.tag,
        });
    });

    await config.txColl.bulkInsert(resultArr);
    await config.acctColl.updateAll(
        // increase the nextNonce field of all related accounts
        { index: { $gte: options.senderStartIndex, $lt: options.senderStartIndex + options.senderNumber } },
        { $inc: { nextNonce: 1 } });

    console.info(`signed & saved ${resultArr.length} transactions into mongo with tag ${options.tag}`);
}
