
import * as config from "../../config";

type InputFieldType = "nonEmptyString" | "nonNegInt" | "posInt" | "wei";

export const wei: InputFieldType = "wei";
export const nonEmptyString: InputFieldType = "nonEmptyString";
export const nonNegInt: InputFieldType = "nonNegInt";
export const posInt: InputFieldType = "posInt";

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
                validateNonNegInt(name, inputVal, errors);
                result[name] = inputVal;
                break;
            }
            case "posInt": {
                validatePosInt(name, inputVal, errors);
                result[name] = inputVal;
                break;
            }
            case "wei": {
                result[name] = parseEthUnit(name, inputVal, errors);
                break;
            }
        }
    });

    if (errors.length > 0) {
        throw new Error(errors.join("\n"));
    }

    return <any>result;
}

function parseEthUnit(name: string, input: string, errors: string[]): number {
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
    const num = Number(numstr);
    if (!unit || !Number.isSafeInteger(num) || num < config.weiPerGWei) {
        return fail();
    }

    return num * unit;

    function fail() {
        errors.push(`${name} must be non empty string like {NUM}GWei or {NUM}Wei or {Num}Eth, min: ${config.weiPerGWei}wei`);
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

function validateNonNegInt(name: string, input: any, errors: string[]): void {
    if (typeof input !== "number" || !Number.isInteger(input) || input < 0) {
        errors.push(`${name} must be non negative integer`);
    }
}

export async function getAddressListOrThrow(startIndex: number, count: number): Promise<config.Account[]> {
    const accounts = await config.acctColl.getAll({ index: { $gte: startIndex, $lt: startIndex + count } });

    if (accounts.length !== count) {
        throw new Error(`no enough accounts, found ${accounts.length} from index ${startIndex}, while ${count} were asked`);
    }

    return accounts;
}
