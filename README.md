## Puppeth
This is a tool to 
- Create ethereum account/private key
- Sign transaction offline
- Send transaction

Account and TX data will be stored in mongodb for future reference and query.

## Prerequisite
- mongodb
- nodejs
- typescript

## Pre-build
Fill the config file, in ./config/default.json, several known free public ETH endpoint
- https://api.myetherwallet.com/rop & https://api.myetherwallet.com/eth
- https://ropsten.infura.io & https://mainnet.infura.io/

## Build
```sh
$ npm install
$ tsc
```

### CREATE ACCOUNTS (offline)
Create ethereum accounts (private keys) using web3 api and store them in mongodb (highly suggest using an offline local db).
```sh
$ ./createAcct {number}
$ node ./src/index.js createAcct {number}
```

### SIGN TX (offline if nonce provided)
Sign transaction, several different types are supported (one-to-many, many-to-one, one-to-one), take json file as input, check ./signTxSamples/\*.json for json format.
Signed tx will be stored in mongodb with tag, use this tag to identify a set of tx and use as argument in sendTx.
```sh
$ ./signTx {path-to-json}
$ node ./src/index.js signTx {path-to-json}
```

### SEND TX
Send signed tx to public network.
#### TTY mode, retrieve signed tx from mongodb by provided tag.
```sh
$ sendTx {tag}
$ node ./src/index.js sendTx {tag}
```
#### Pipe mode, retrieve signed tx from stdin.
```sh
$ echo "txdata" | ./sendTx
$ echo "txdata" | node ./src/index.js sendTx
```

### EXTRACT TX
Extract tx from mongodb by tag, output to stdout.
```sh
$ ./extractTx {tag}
$ node ./src/index.js extractTx {tag}
```

### Sync Account Balance
Get account balance from network(by config) and save to mongodb.
```sh
$ ./syncBalance
$ node ./src/index.js syncBalance
```

### SYNC TX
Sync tx status from public network(by config)
#### TTY mode, retrieve tx hash from mongodb by provided tag.
```sh
$ syncTx {tag}
$ node ./src/index.js syncTx {tag}
```
#### Pipe mode, retrieve tx hash from stdin.
```sh
$ echo "txhash" | ./syncTx
$ echo "txhash" | node ./src/index.js syncTx
```
