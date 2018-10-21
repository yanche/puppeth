
import * as config from "../../config";
import { getPipedString, shortenMsg } from "../../utility";

export async function retrieveTxData(arg: string, mongoFields: Object, rawMapping: (raw: string) => config.Transaction): Promise<{
    txArr: config.Transaction[];
    piped: boolean;
}> {
    const piped = !process.stdin.isTTY;
    const txArr = await (piped ? handlePipeMode(rawMapping) : handleTTYMode(arg, mongoFields));
    return {
        piped: piped,
        txArr: txArr,
    };
}

async function handleTTYMode(arg: string, mongoFields: Object): Promise<config.Transaction[]> {
    // TTY mode, tag from cmd line argument
    if (typeof arg !== "string" || !arg.trim().length) {
        throw new Error(`input as tag must be a non empty string: ${arg}`);
    }
    // get tx data from db
    return await config.txColl.getAll({ tag: arg.trim() }, mongoFields);
}

async function handlePipeMode(rawMapping: (raw: string) => config.Transaction): Promise<config.Transaction[]> {
    // non TTY, assume tx data from stdin
    const pipedStr = await getPipedString();
    return pipedStr.split("\n").filter(n => n.trim()).map(rawMapping);
}
