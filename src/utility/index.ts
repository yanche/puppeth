
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
