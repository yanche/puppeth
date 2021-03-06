
import * as mongo from "./mongo";
import Tx = require("ethereumjs-tx");

export { mongo };

export function getPipedString(): Promise<string> {
    return new Promise<string>((res, rej) => {
        const buffers: Buffer[] = [];
        process.stdin
            .on("data", buf => buffers.push(buf))
            .on("end", () => {
                const buf = Buffer.concat(buffers, buffers.reduce((sum, buf) => sum + buf.length, 0));
                res(buf.toString("utf-8"));
            })
            .on("error", rej);
    });
}

// return first and last 6 char, concat with ...
export function shortenMsg(msg: string): string {
    return msg.length > 12 ? `${msg.slice(0, 6)}...${msg.slice(-6)}` : msg;
}

export function logHeadTailShortMsg(msgs: string[]): void {
    if (msgs.length === 1) {
        console.info(shortenMsg(msgs[0]));
    } else if (msgs.length > 1) {
        console.info(`first: ${shortenMsg(msgs[0])}`);
        console.info(`last: ${shortenMsg(msgs[msgs.length - 1])}`);
    }
}

// @types/ethereum-tx currently does not have .hash as a method
export function rawTxDataToHash(rawTx: string): string {
    return "0x" + (<any>new Tx(rawTx)).hash().toString("hex");
}

export function hexToBuffer(hex: string): Buffer {
    if (hex.length % 2) {
        throw new Error(`hex string length must be even number: ${hex}, ${hex.length}`);
    }

    return Buffer.from(hex.startsWith("0x") ? hex.slice(2) : hex, "hex");
}

export function bufferToHex(buf: Buffer): string {
    return "0x" + buf.toString("hex");
}
