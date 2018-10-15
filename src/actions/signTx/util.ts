
const unitEther = Math.pow(10, 18);
const unitGwei = Math.pow(10, 9);
export function parseEthUnit(name: string, input: any, errors: string[]): {
    valid: boolean;
    wei: number;
} {
    if (typeof name !== "string" || !name.trim().length) {
        return fail();
    }
    name = name.trim();

    let numstr = "";
    let unit = 0;
    if (name.slice(-3).toLowerCase() === "eth") {
        numstr = name.slice(0, -3);
        unit = unitEther;
    } else if (name.slice(-4).toLowerCase() === "gwei") {
        numstr = name.slice(0, -4);
        unit = unitGwei;
    } else if (name.slice(-3).toLowerCase() === "wei") {
        numstr = name.slice(0, -3);
        unit = 1;
    }
    const num = Number(numstr);
    if (!unit || !Number.isSafeInteger(num) || num <= 0) {
        return fail();
    }

    return {
        valid: true,
        wei: num * unit,
    };

    function fail() {
        errors.push(`${name} must be non empty string like {NUM}GWei or {NUM}Wei or {Num}Eth`);
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
