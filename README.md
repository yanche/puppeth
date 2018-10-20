## Puppeth
This is a tool to 
- Create ethereum account/private key
- Sign transaction offline
- Send transaction using Infura

Account and TX data will be stored in mongodb for future reference and query.

## Prerequisite
- mongodb
- nodejs
- typescript

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
Send signed tx to public network using infura.
#### TTY mode, retrieve signed tx from mongodb by provided tag
```sh
$ sendTx {tag}
$ node ./src/index.js sendTx {tag}
```
#### Pipe mode, retrieve signed tx from stdin.
```sh
$ echo "txdata" >./sendTx
$ echo "txdata" > node ./src/index.js sendTx
```

### EXTRACT TX
Extract tx from mongodb by tag, output to stdout.
```sh
$ ./extractTx {tag}
$ node ./src/index.js extractTx {tag}
```