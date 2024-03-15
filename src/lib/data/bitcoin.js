import {useState, useEffect, useMemo} from "react";
import { singletonHook } from "react-singleton-hook";

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

const _initBitcoin = async (networkId) => {
    const config = btcNetworkConfig[networkId];
    return {
        networkId,
        config,
        fetchUTXOs: (address) => fetchUTXOs(address, config.rpcUrl),
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
