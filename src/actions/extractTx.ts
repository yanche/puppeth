
import * as config from "../config";

export async function process(arg: string): Promise<void> {
    if (typeof arg !== "string" || !arg.trim().length) {
        throw new Error(`input as tag must be a non empty string: ${arg}`);
    }

    await extractTxWithTag(arg.trim());
}

async function extractTxWithTag(tag: string): Promise<void> {
    const txArr = await config.txColl.getAll({ tag: tag }, { txData: 1 });
    // output tx list to stdout
    console.log(txArr.map(tx => tx.txData).join("\n"));
}
