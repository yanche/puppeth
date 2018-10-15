
import Web3 = require("web3");
import { roll } from "@belongs/asyncutil";
import * as config from "../../config";
import { parseEthUnit, validateNonEmptyString, validateNonNegInt, validatePosInt, getAddressListOrThrow } from "./util";

// validator
export async function manyToOne(args: { [key: string]: any }): Promise<void> {
    const errors: string[] = [];

    const wei = parseEthUnit("value", args["value"], 0, errors);
    // at least 1GWei gas price
    const gasPriceWei = parseEthUnit("gasPrice", args["gasPrice"], config.weiPerGWei, errors);
    const senderStartIndex: number = args["senderStartIndex"];
    const senderNumber: number = args["senderNumber"];
    const address: string = args["address"];
    const tag: string = args["tag"];

    if (!wei.valid ||
        !gasPriceWei.valid ||
        !validateNonNegInt("senderStartIndex", senderStartIndex, errors) ||
        !validatePosInt("senderNumber", senderNumber, errors) ||
        !validateNonEmptyString("address", address, errors) ||
        !validateNonEmptyString("tag", tag, errors)) {
        throw new Error(errors.join("\n"));
    }

    await _manyToOne({
        wei: wei.wei,
        gasPriceWei: gasPriceWei.wei,
        address: address.trim(),
        senderStartIndex,
        senderNumber,
        tag: tag.trim(),
    });
}

// CORE processor
async function _manyToOne(options: {
    wei: number;
    gasPriceWei: number;
    address: string;
    senderStartIndex: number;
    senderNumber: number;
    tag: string;
}): Promise<void> {
    console.log(`to address: ${options.address}`);

    const senderAccounts = (await getAddressListOrThrow(options.senderStartIndex, options.senderNumber)).map((acct, i) => ({ acct: acct, index: i }));
    const web3 = new Web3(config.web3Provider);

    const resultArr = Array<config.Transaction>(senderAccounts.length);
    await roll(senderAccounts, async entry => {

        // synchronous signing
        const tx = await web3.eth.accounts.signTransaction({
            nonce: entry.acct.nextNonce,
            to: options.address,
            value: options.wei,
            gas: config.sendEtherGasCost,
            gasPrice: options.gasPriceWei,
            chainId: config.chainId,
        }, entry.acct.privateKey);

        resultArr[entry.index] = {
            txData: tx.rawTransaction,
            from: entry.acct.address,
            nonce: entry.acct.nextNonce,
            to: options.address,
            wei: options.wei,
            gas: config.sendEtherGasCost,
            gasPriceWei: options.gasPriceWei,
            tag: options.tag,
        };

        // 100: just to not have too many promises
    }, Math.min(senderAccounts.length, 100));

    await config.txColl.bulkInsert(resultArr);
    await config.acctColl.updateAll(
        // increase the nextNonce field of all related accounts
        { index: { $gte: options.senderStartIndex, $lt: options.senderStartIndex + options.senderNumber } },
        { $inc: { nextNonce: 1 } });
}
