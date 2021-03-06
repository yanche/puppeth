
import * as config from "../../config";
import Web3 = require("web3");
import { rawTxDataToHash, hexToBuffer, bufferToHex } from "../../utility";
import Tx = require("ethereumjs-tx");

type InputFieldType = "nonEmptyString" | "nonNegInt" | "posInt" | "ethValue" | "gasPrice" | "optionalNonNegInt";

export const ethValue: InputFieldType = "ethValue";
export const gasPrice: InputFieldType = "gasPrice";
export const nonEmptyString: InputFieldType = "nonEmptyString";
export const nonNegInt: InputFieldType = "nonNegInt";
export const posInt: InputFieldType = "posInt";
export const optionalNonNegInt: InputFieldType = "optionalNonNegInt";

export function preProcessInput<T>(input: { [key: string]: any }, shape: { [K in keyof T]: InputFieldType }): T {
    const errors: string[] = [];
    const result: { [k: string]: number | string } = {};

    Object.keys(shape).forEach(name => {
        const inputVal = (<any>input)[name];
        const type: InputFieldType = (<any>shape)[name];
        switch (type) {
            case "nonEmptyString": {
                result[name] = parseNonEmptyString(name, inputVal, errors);
                break;
            }
            case "nonNegInt": {
                validateNonNegInt(name, inputVal, false, errors);
                result[name] = inputVal;
                break;
            }
            case "posInt": {
                validatePosInt(name, inputVal, errors);
                result[name] = inputVal;
                break;
            }
            case "gasPrice": {
                result[name] = parseEthUnit(name, inputVal, config.weiPerGWei, errors);
                break;
            }
            case "ethValue": {
                result[name] = parseEthUnit(name, inputVal, 0, errors);
                break;
            }
            case "optionalNonNegInt": {
                validateNonNegInt(name, inputVal, true, errors);
                result[name] = inputVal;
                break;
            }
            default:
                throw new Error(`unknown shape field type: ${name}`);
        }
    });

    if (errors.length > 0) {
        throw new Error(errors.join("\n"));
    }

    return <any>result;
}

function parseEthUnit(name: string, input: string, min: number, errors: string[]): number {
    if (typeof input !== "string" || !input.trim().length) {
        return fail();
    }
    input = input.trim();

    let numstr = "";
    let unit = 0;
    if (input.slice(-3).toLowerCase() === "eth") {
        numstr = input.slice(0, -3);
        unit = config.weiPerEther;
    } else if (input.slice(-4).toLowerCase() === "gwei") {
        numstr = input.slice(0, -4);
        unit = config.weiPerGWei;
    } else if (input.slice(-3).toLowerCase() === "wei") {
        numstr = input.slice(0, -3);
        unit = 1;
    }
    const num = unit * Number(numstr);
    if (!Number.isSafeInteger(num) || num < min) {
        return fail();
    }

    return num;

    function fail() {
        errors.push(`${name} must be non empty string like {NUM}GWei or {NUM}Wei or {Num}Eth, min: ${min}wei`);
        return 0;
    }
}

function parseNonEmptyString(name: string, input: any, errors: string[]): string {
    if (typeof input !== "string" || input.trim().length === 0) {
        errors.push(`${name} must be non empty string`);
        return "";
    } else {
        return input.trim();
    }
}

function validatePosInt(name: string, input: any, errors: string[]): void {
    if (typeof input !== "number" || !Number.isInteger(input) || input === 0) {
        errors.push(`${name} must be positive integer`);
    }
}

function validateNonNegInt(name: string, input: any, optional: boolean, errors: string[]): void {
    if ((typeof input !== "number" || !Number.isInteger(input) || input < 0) && (!optional || input !== undefined)) {
        errors.push(`${name} must be non negative integer${optional ? " or blank" : ""} `);
    }
}

export async function getAddressListOrThrow(startIndex: number, count: number): Promise<config.Account[]> {
    const accounts = await config.acctColl.getAll({ index: { $gte: startIndex, $lt: startIndex + count } });

    if (accounts.length !== count) {
        throw new Error(`no enough accounts, found ${accounts.length} from index ${startIndex}, while ${count} were asked`);
    }

    return accounts;
}

// NO input validation
export function signTxOffline(options: {
    privateKey: string;
    nonce: number;
    address: string;
    value: number;
    gas?: number;
    gasPrice: number;
    tag: string;
}): config.Transaction {
    const gas = options.gas || config.sendEtherGasCost;
    const web3 = new Web3();
    const tx = new Tx({
        nonce: options.nonce,
        to: options.address,
        value: options.value,
        gasLimit: gas,
        gasPrice: options.gasPrice,
        chainId: config.chainId,
    });
    tx.sign(hexToBuffer(options.privateKey));

    return {
        txData: bufferToHex(tx.serialize()),
        from: web3.eth.accounts.privateKeyToAccount(options.privateKey).address,
        nonce: options.nonce,
        to: options.address,
        value: options.value,
        gas: gas,
        gasPrice: options.gasPrice,
        tag: options.tag,
        txHash: bufferToHex((<any>tx).hash()),
        status: config.TxStatus.unknown,
    };
}
