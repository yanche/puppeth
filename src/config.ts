
import * as config from "config";
import * as utility from "./utility";
import { ObjectID } from "mongodb";

// mongodb document interface
export interface Account {
    _id?: ObjectID;
    index?: number;
    privateKey?: string;
    address?: string;
    nextNonce?: number;
}

// mongodb document interface
export interface Transaction {
    _id?: ObjectID;
    txData?: string;
    tag?: string;
    from?: string;
    to?: string;
    value?: number;
    gas?: number;
    gasPrice?: number;
    nonce?: number;
    txHash?: string;
    status?: TxStatus;
    blockHash?: string;
    blockNumber?: number;
}

export const mongo = {
    collections: {
        accounts: {
            name: "acct",
            fields: {
                _id: 1,
                index: 1,
                privateKey: 1,
                address: 1,
                nextNonce: 1,
            },
        },
        transactions: {
            name: "tx",
            fields: {
                _id: 1,
                txData: 1,
                tag: 1,
                from: 1,
                to: 1,
                value: 1,
                gas: 1,
                gasPrice: 1,
                nonce: 1,
                txHash: 1,
                status: 1,
                blockHash: 1,
                blockNumber: 1,
            }
        },
    }
};

const infuraKey = config.get<string>("infuraKey");
export const ethNetwork = config.get<string>("ethNetwork");
let _chainId = 0;
switch (ethNetwork) {
    case "mainnet": {
        _chainId = 1;
        break;
    }
    case "ropsten": {
        _chainId = 3;
        break;
    }
    default:
        throw new Error(`unknown ETH network: ${ethNetwork}, valid values: mainnet, ropsten`);
}

export const web3Provider: string = `https://${ethNetwork}.infura.io/v3/${infuraKey}`;
export const chainId = _chainId;
export const sendTxFreqMs = config.get<number>("sendTxFreqMs");

export const sendEtherGasCost = 21000;
export const weiPerEther = Math.pow(10, 18);
export const weiPerGWei = Math.pow(10, 9);

const mongoUrl = config.get<string>("mongoUrl");
const db = new utility.mongo.DbClient(mongoUrl);
export const txColl = db.getCollClient<Transaction>(mongo.collections.transactions.name, mongo.collections.transactions.fields);
export const acctColl = db.getCollClient<Account>(mongo.collections.accounts.name, mongo.collections.accounts.fields);

export enum TxStatus {
    pending = "pending",
    complete = "complete",
    unknown = "unknown",
}
