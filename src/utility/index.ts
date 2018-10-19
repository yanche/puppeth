
import * as mongo from "./mongo";

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
