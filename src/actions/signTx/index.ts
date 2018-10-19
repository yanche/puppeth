
import * as fs from "fs";
import * as oneToMany from "./oneToMany";
import * as manyToOne from "./manyToOne";
import * as oneToOne from "./oneToOne";
import { preProcessInput } from "./util";

export async function handle(arg: string): Promise<void> {
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

    switch (type.trim()) {
        case "oneToMany": {
            return oneToMany.signTx(preProcessInput<oneToMany.InputType>(obj, oneToMany.shape));
        }
        case "manyToOne": {
            return manyToOne.signTx(preProcessInput<manyToOne.InputType>(obj, manyToOne.shape));
        }
        case "oneToOne": {
            return oneToOne.signTx(preProcessInput<oneToOne.InputType>(obj, oneToOne.shape));
        }
        default:
            throw new Error(`unknown type: ${type}`);
    }
}
