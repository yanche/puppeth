
import * as config from "config";
import { ObjectID } from "mongodb";

// mongodb document interface
export interface Account {
    _id?: ObjectID;
    index?: number;
    privateKey?: string;
    address?: string;
}

// mongodb document interface
export interface Transaction {
    _id?: ObjectID;
    txData?: string;
    tag?: string;
    from?: string;
    to?: string;
    wei?: number;
    gas?: number;
    gasPriceWei?: number;
    nonce?: number;
}

export const mongo = {
    url: config.get<string>("mongoUrl"),
    collections: {
        accounts: {
            name: "acct",
            fields: {
                _id: 1,
                index: 1,
                privateKey: 1,
                address: 1,
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
                wei: 1,
                gas: 1,
                gasPriceWei: 1,
                nonce: 1,
            }
        },
    }
};

export const web3Provider: string = config.get<string>("web3Provider");