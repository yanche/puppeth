
import * as fs from "fs";
import { oneToMany } from "./oneToMany";

const processMap = new Map<string, (args: { [key: string]: any }) => Promise<void>>();
processMap.set("oneToMany", oneToMany);

export async function process(arg: string): Promise<void> {
    const content = fs.readFileSync(arg).toString("utf-8");
    let obj: { [key: string]: any } = null;
    try {
        obj = JSON.parse(content);
    } catch (err) {
        throw new Error(`failed to parse file content as json: ${arg}`);
    }

    const type: string = obj["type"];
    if (typeof type !== "string") {
        throw new Error(`type field must be a non empty string: ${type}`);
    }

    const handler = processMap.get(type.trim());
    if (!handler) {
        throw new Error(`unknown type: ${type}`);
    } else {
        await handler(obj);
    }
}
