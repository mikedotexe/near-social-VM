import {useState, useEffect, useMemo} from "react";
import { singletonHook } from "react-singleton-hook";
import { Transaction as BitcoinTransaction } from 'bitcoinjs-lib';
import Big from "big.js";
import { reverseBuffer } from "bitcoinjs-lib/src/bufferutils";
import { Psbt as PsbtBip174 } from 'bip174'

const btcNetworkConfig = {
    testnet: {
        rpcUrl: "https://blockstream.info/testnet/api",
    },
    mainnet: {
        // assuming there's a local node running
        rpcUrl: "http://127.0.0.1:8333",
    },
};

async function fetchUTXOs(address, rpcUrl) {
    if (!address) return

    try {
        const response = await fetch(`${rpcUrl}/address/${address}/utxo`);
        const utxos = await response.json();
        console.log(`UTXOs for ${address}`, utxos);

        return utxos;
    } catch (error) {
        console.error("Failed to fetch UTXOs:", error);
        return [];
    }
}

export async function signMPC(
    account,
    payload,
    path
) {
    const result = await account.functionCall({
        contractId: "multichain-testnet-2.testnet",
        methodName: "sign",
        args: {
            payload: payload.slice().reverse(),
            path,
        },
        gas: new BN("300000000000000"),
        attachedDeposit: new BN("0"),
    });

    if ("SuccessValue" in (result.status)) {
        const successValue = (result.status).SuccessValue;
        const decodedValue = Buffer.from(successValue, "base64").toString("utf-8");
        const parsedJSON = JSON.parse(decodedValue);

        return {
            r: parsedJSON[0].slice(2),
            s: parsedJSON[1],
        };
    }

    return undefined;
}

// This function calls "sign" on the mpc-recovery contract
// See
// async function getNearSignTx(transactionHash, rpc) {
//     console.log('aloha VM leftoff transactionHash', transactionHash)
//     console.log('aloha VM leftoff rpc', rpc)
//
//     return {
//         contractName:
//     }
//
//
//     const signature = await signMPC(
//       account,
//       Array.from(ethers.getBytes(transactionHash)),
//       keyPath
//     );
//
//     if (!signature) {
//         throw new Error("Failed to sign transaction");
//     }
//
//     return Buffer.from(Bitcoin.joinSignature(signature));
// }

async function mpcSign(transactionHash, rpc) {
    console.log('aloha VM leftoff transactionHash', transactionHash)
    console.log('aloha VM leftoff rpc', rpc)
    // const account = useAccount()
    // console.log('aloha VM leftoff account', account)


    const signature = await signMPC(
      account,
      Array.from(ethers.getBytes(transactionHash)),
      keyPath
    );

    if (!signature) {
        throw new Error("Failed to sign transaction");
    }

    return Buffer.from(Bitcoin.joinSignature(signature));
}

async function fetchTransactionById(transactionId, rpc) {
    // console.log('aloha VM fetchTransactionById. transactionId', transactionId)
    // console.log('aloha VM fetchTransactionById. rpc', rpc)
    // return 'hardcoded'
    const txDetails  = await (await fetch(
        `${rpc}/tx/${transactionId}`
    )).json();
    console.log('aloha VM fetchTransactionById. data', txDetails)
    const tx = new BitcoinTransaction();

    tx.version = txDetails.version;
    tx.locktime = txDetails.locktime;

    txDetails.vin.forEach(vin => {
        const txHash = Buffer.from(vin.txid, "hex").reverse();
        const vout = vin.vout;
        const sequence = vin.sequence;
        const scriptSig = vin.scriptsig
            ? Buffer.from(vin.scriptsig, "hex")
            : undefined;
        tx.addInput(txHash, vout, sequence, scriptSig);
    });

    txDetails.vout.forEach(vout => {
        const value = vout.value;
        const scriptPubKey = Buffer.from(vout.scriptpubkey, "hex");
        tx.addOutput(scriptPubKey, value);
    });

    txDetails.vin.forEach((vin, index) => {
        if (vin.witness && vin.witness.length > 0) {
            const witness = vin.witness.map((w) => Buffer.from(w, "hex"));
            tx.setWitness(index, witness);
        }
    });

    return tx;
    // const response = await axios.get(`${this.rpcEndpoint}fee-estimates`);
    // try {
    //     // const response = await fetch(`${rpcUrl}/fee-estimates`);
    //     // console.log('aloha fee response', response);
    //     // const feeEstimates = await response.json();
    //     // console.log('aloha feeEstimates', feeEstimates);
    //     // // const feeEstimatesFormData = await response.formData();
    //     // // console.log('aloha feeEstimatesFormData', feeEstimatesFormData);
    //     // // const feeEstimatesBlob = await response.blob();
    //     // // console.log('aloha feeEstimatesBlob', feeEstimatesBlob);
    //     //
    //     // // Consider having this be a param
    //     // const confirmationTarget = 6;
    //     // if (feeEstimates[confirmationTarget]) {
    //     //     return feeEstimates[confirmationTarget];
    //     // } else {
    //     //     throw new Error(
    //     //         `Fee rate data for ${confirmationTarget} blocks confirmation target is missing in the response`
    //     //     );
    //     // }
    //     //
    //     // return feeEstimates;
    // } catch (error) {
    //     console.error("Failed to fetch Bitcoin transaction", error);
    //     return [];
    // }
}

async function fetchFee(rpcUrl = 'https://blockstream.info/testnet/api') {
    // const response = await axios.get(`${this.rpcEndpoint}fee-estimates`);
    try {
        const response = await fetch(`${rpcUrl}/fee-estimates`);
        // console.log('aloha fee response', response);
        const feeEstimates = await response.json();
        // console.log('aloha feeEstimates', feeEstimates);
        // const feeEstimatesFormData = await response.formData();
        // console.log('aloha feeEstimatesFormData', feeEstimatesFormData);
        // const feeEstimatesBlob = await response.blob();
        // console.log('aloha feeEstimatesBlob', feeEstimatesBlob);

        // Consider having this be a param
        const confirmationTarget = 6;
        if (feeEstimates[confirmationTarget]) {
            const rawEstimate = feeEstimates[confirmationTarget];
            console.log('aloha VM fetFee. rawEstimate', rawEstimate)
            const estimate = Big(rawEstimate).round(0).toNumber()
            console.log('aloha VM fetFee. estimate', estimate)

            return estimate
            // return feeEstimates[confirmationTarget];
        } else {
            throw new Error(
                `Fee rate data for ${confirmationTarget} blocks confirmation target is missing in the response`
            );
        }
        //
        // return feeEstimates;
    } catch (error) {
        console.error("Failed to fetch Bitcoin fees", error);
        return [];
    }
}

const _initBitcoin = async (networkId) => {
    const config = btcNetworkConfig[networkId];
    return {
        networkId,
        config,
        fetchUTXOs: (address, rpc) => fetchUTXOs(address, rpc),
        fetchFee: (rpc) => fetchFee(rpc),
        fetchTransactionById: (transactionId, rpc) => fetchTransactionById(transactionId, rpc),
        mpcSign: (transactionHash, rpc) => mpcSign(transactionHash, rpc),
        // getNearSignTx: (transactionHash, rpc) => getNearSignTx(transactionHash, rpc),
    };
};

export const useInitBitcoin = singletonHook({}, () => {
    const [bitcoinPromise, setBitcoinPromise] = useState(null);

    useEffect(() => {
        const initPromises = Object.keys(btcNetworkConfig).map(_initBitcoin);
        const configsPromise = Promise.all(initPromises).then(
            (configs) => configs.reduce(
                (acc, config) => ({
                    ...acc,
                    [config.networkId]: config,
                }), {}
            )
        );
        setBitcoinPromise(configsPromise);
    }, []);

    const initBitcoin = (args) => {
        const networkId = args.networkId || "testnet";
        setBitcoinPromise(
            _initBitcoin(networkId).then(config => ({
                ...config,
                default: config.networkId === networkId,
            }))
        );
    };

    return {
        bitcoinPromise,
        initBitcoin,
    };
});

export const useBitcoin = (networkId = "testnet") => {
    const { bitcoinPromise } = useInitBitcoin();
    const [config, setConfig] = useState(null);

    useEffect(() => {
        bitcoinPromise &&
        bitcoinPromise.then((configs) => {
            setConfig(configs[networkId]);
        });
    }, [bitcoinPromise, networkId]);

    return config;
};

/*
 The two functions below are taken from the MIT licensed bitcoinjs-lib
 See: https://github.com/bitcoinjs/bitcoinjs-lib
 */

/**
 * This function is needed to pass to the bip174 base class's fromBuffer.
 * It takes the "transaction buffer" portion of the psbt buffer and returns a
 * Transaction (From the bip174 library) interface.
 */
export const transactionFromBuffer = buffer => new PsbtTransaction(buffer);
/**
 * This class implements the Transaction interface from bip174 library.
 * It contains a bitcoinjs-lib Transaction object.
 */
export class PsbtTransaction {
    constructor(buffer = Buffer.from([2, 0, 0, 0, 0, 0, 0, 0, 0, 0])) {
        console.log('aloha VM bitcoin. new PsbtTransaction with buffer', buffer, buffer.toString('hex'))
        this.tx = BitcoinTransaction.fromBuffer(buffer);
        checkTxEmpty(this.tx);
        Object.defineProperty(this, 'tx', {
            enumerable: false,
            writable: true,
        });
    }
    getInputOutputCounts() {
        return {
            inputCount: this.tx.ins.length,
            outputCount: this.tx.outs.length,
        };
    }
    addInput(input) {
        if (
            input.hash === undefined ||
            input.index === undefined ||
            (!Buffer.isBuffer(input.hash) && typeof input.hash !== 'string') ||
            typeof input.index !== 'number'
        ) {
            throw new Error('Error adding input.');
        }
        const hash =
            typeof input.hash === 'string'
                ? (0, reverseBuffer)(Buffer.from(input.hash, 'hex'))
                : input.hash;
        this.tx.addInput(hash, input.index, input.sequence);
    }
    addOutput(output) {
        if (
            output.script === undefined ||
            output.value === undefined ||
            !Buffer.isBuffer(output.script) ||
            typeof output.value !== 'number'
        ) {
            throw new Error('Error adding output.');
        }
        this.tx.addOutput(output.script, output.value);
    }
    toBuffer() {
        return this.tx.toBuffer();
    }
}

function checkTxEmpty(tx) {
    const isEmpty = tx.ins.every(
        input =>
            input.script &&
            input.script.length === 0 &&
            input.witness &&
            input.witness.length === 0,
    );
    if (!isEmpty) {
        throw new Error('Format Error: Transaction ScriptSigs are not empty');
    }
}
