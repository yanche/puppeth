
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

const infuraKey = config.get<string>("infuraKey");
const ethNetwork = config.get<string>("ethNetwork");
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
