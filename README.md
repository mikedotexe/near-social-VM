## Near Social VM

AKA "BOS VM"

The VM provides a limited version of React JSX implementation with a bunch of helper methods to access NEAR blockchain.

The VM is based on the following security principles:
- No raw access to DOM. The DOM access is only provided through JSX elements.
- No raw JS execution in the main thread. All JS code is executed in either a VM or a sandboxed iframe.
- No raw access to local storage.

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

### Changelog

See [CHANGELOG.md](./CHANGELOG.md)

### Try it

You can play with the VM at one of the gateways:
- https://near.social/
- https://dev.near.social/ (`dev` VM branch)
- https://near.org/
- https://jutsu.ai/

### Bitcoin usage

The `Bitcoin` object is a global object just like `Near` and others. A component can use various objects and methods.

#### Types

- `transaction`: allows components to create a [`Transaction` class](https://github.com/bitcoinjs/bitcoinjs-lib/blob/3c26beb1d205943efbd40f7171ff947dc66ac5c2/ts_src/transaction.ts#L66) from `bitcoinjs-lib`.
- `psbt`: allows components to create a [`Psbt` class](https://github.com/bitcoinjs/bitcoinjs-lib/blob/3c26beb1d205943efbd40f7171ff947dc66ac5c2/ts_src/psbt.ts#L127) from `bitcoinjs-lib`. (Note: this library uses a base class from `bip174` and hasn't allowed the PSBT to utilize the `getTransaction` method available to it. This is why we're temporarily using a fork of the package until [this pull request](https://github.com/bitcoinjs/bitcoinjs-lib/pull/2090) is addressed.)

#### Utility functions
- `networks`: return the `bitcoinjs-lib` `Network`s for mainnet, testnet, and regtest.
- `toBTC`: utility function converting satoshis to Bitcoin
- `toSatoshis`: utility function converting Bitcoin to satoshis
- `getBalanceFromUTXOs`: takes UTXOs and sums the values
- `joinSignature`: takes an object with `r` and `s` values and concatenates them. (These are returned in the transaction event when the MPC responds.)
- `fetchUTXOs`: get basic UTXO info given an address. Calls an external API fetching UTXOs (defaults to the [blockstream.info](https://blockstream.info) API)
- `fetchFeeRate`: uses an external API to obtain the fee rate. This is used to calculate the fee using the [`coinselect` package](https://www.npmjs.com/package/coinselect).
- `getScriptType`: typically used for input UTXOs once the details have been fetched from an API. Returns the type of the script. Returns `NotSegWit`, `P2WPKH`, or `P2WSH`.
- `getInputUTXOWitness`: takes an array of input UTXO details (after fetched from the API) and returns the type of the script. Uses `getScriptType` and returns an array of witness information, where the indices match the inputs argument.
- `fetchTransaction`: takes a transaction hash and returns details. (Used by `getUtxoAndFeeDetails`) 
- `getUtxoAndFeeDetails`: takes basic input UTXO info (from `fetchUTXOs`) and calls an API getting further details on the UTXO inputs. Returns everything the [`coinselect` package](https://github.com/bitcoinjs/coinselect?tab=readme-ov-file#example) does, under that key. It also returns the results of the detailed input UTXOs, under the key `inputUTXOResults`.

#### NEAR MPC
- `deriveProductionAddress`: MPC method to derive a user's external address based on account name, path, network, and optional version of MPC. (Note: the MPC root public key is hardcoded in the VM under `NearMPC.TESTNET_MPC_PUBLIC_KEY`)
- ``

### Credits

These two functions are taken from the MIT licensed [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib): `transactionFromBuffer` and `PsbtTransaction`.

--- delme
"bitcoinjs-lib": "^6.1.5",
"bitcoinjs-lib": "file:../../other/bitcoinjs-lib",

