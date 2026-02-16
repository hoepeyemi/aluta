"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCK_EXPLORER_URL = exports.NATIVE_TOKEN_ADDRESS = exports.walletClient = exports.publicClient = exports.networkInfo = exports.account = void 0;
require("dotenv/config");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
// Hedera testnet configuration
const hederaTestnet = {
    id: 296,
    name: 'Hedera Testnet',
    nativeCurrency: {
        name: 'HBAR',
        symbol: 'HBAR',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://testnet.hashio.io/api'],
        },
        public: {
            http: ['https://testnet.hashio.io/api'],
        },
    },
    blockExplorers: {
        default: {
            name: 'HashScan Testnet',
            url: 'https://hashscan.io/testnet',
        },
    },
};
// Network configuration
const networkConfig = {
    rpcProviderUrl: 'https://testnet.hashio.io/api',
    blockExplorer: 'https://hashscan.io/testnet',
    chain: hederaTestnet,
    nativeTokenAddress: '0x0000000000000000000000000000000000000000', // Native HBAR
};
// Helper functions
const validateEnvironmentVars = () => {
    if (!process.env.WALLET_PRIVATE_KEY && !process.env.ECDSA_PRIVATE_KEY_TEST) {
        throw new Error('WALLET_PRIVATE_KEY or ECDSA_PRIVATE_KEY_TEST is required in .env file');
    }
};
validateEnvironmentVars();
// Create account from private key
const privateKey = (process.env.WALLET_PRIVATE_KEY || process.env.ECDSA_PRIVATE_KEY_TEST);
exports.account = (0, accounts_1.privateKeyToAccount)(privateKey);
exports.networkInfo = {
    ...networkConfig,
    rpcProviderUrl: process.env.RPC_PROVIDER_URL || networkConfig.rpcProviderUrl,
};
const baseConfig = {
    chain: exports.networkInfo.chain,
    transport: (0, viem_1.http)(exports.networkInfo.rpcProviderUrl),
};
exports.publicClient = (0, viem_1.createPublicClient)(baseConfig);
exports.walletClient = (0, viem_1.createWalletClient)({
    chain: exports.networkInfo.chain,
    transport: (0, viem_1.http)(exports.networkInfo.rpcProviderUrl),
    account: exports.account,
});
// Export constants
exports.NATIVE_TOKEN_ADDRESS = exports.networkInfo.nativeTokenAddress;
exports.BLOCK_EXPLORER_URL = exports.networkInfo.blockExplorer;
