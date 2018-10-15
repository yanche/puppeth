
import * as config from "../../config";

export function parseEthUnit(name: string, input: string, minValue: number, errors: string[]): {
    valid: boolean;
    wei: number;
} {
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
    if (!unit || !Number.isSafeInteger(num) || num < minValue) {
        return fail();
    }

    return {
        valid: true,
        wei: num * unit,
    };

    function fail() {
        errors.push(`${name} must be non empty string like {NUM}GWei or {NUM}Wei or {Num}Eth, min: ${minValue}wei`);
        return {
            valid: false,
            wei: 0,
        };
    }
}

export function validateNonEmptyString(name: string, input: any, errors: string[]): boolean {
    if (typeof input === "string" && input.trim().length > 0) {
        return true;
    } else {
        errors.push(`${name} must be non empty string`);
    }
}

export function validatePosInt(name: string, input: any, errors: string[]): boolean {
    if (typeof input === "number" && Number.isInteger(input) && input > 0) {
        return true;
    } else {
        errors.push(`${name} must be positive integer`);
    }
}

export function validateNonNegInt(name: string, input: any, errors: string[]): boolean {
    if (typeof input === "number" && Number.isInteger(input) && input >= 0) {
        return true;
    } else {
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
