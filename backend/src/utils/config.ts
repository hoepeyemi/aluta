import 'dotenv/config'
import { Chain, Address, createPublicClient, createWalletClient, http, WalletClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// Cronos testnet configuration
const cronosTestnet: Chain = {
  id: 338,
  name: 'Cronos Testnet',
  nativeCurrency: {
    name: 'CRO',
    symbol: 'CRO',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://evm-t3.cronos.org'],
    },
    public: {
      http: ['https://evm-t3.cronos.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Cronos Testnet Explorer',
      url: 'https://explorer.cronos.org/testnet',
    },
  },
}

interface NetworkConfig {
    rpcProviderUrl: string
    blockExplorer: string
    chain: Chain
    nativeTokenAddress: Address
}

// Network configuration
const networkConfig: NetworkConfig = {
    rpcProviderUrl: 'https://evm-t3.cronos.org',
    blockExplorer: 'https://explorer.cronos.org/testnet',
    chain: cronosTestnet,
    nativeTokenAddress: '0x0000000000000000000000000000000000000000' as Address, // Native CRO token
}

// Helper functions
const validateEnvironmentVars = () => {
    if (!process.env.WALLET_PRIVATE_KEY && !process.env.ECDSA_PRIVATE_KEY_TEST) {
        throw new Error('WALLET_PRIVATE_KEY or ECDSA_PRIVATE_KEY_TEST is required in .env file')
    }
}

validateEnvironmentVars()

// Create account from private key
const privateKey = (process.env.WALLET_PRIVATE_KEY || process.env.ECDSA_PRIVATE_KEY_TEST) as `0x${string}`;
export const account = privateKeyToAccount(privateKey);

export const networkInfo = {
    ...networkConfig,
    rpcProviderUrl: process.env.RPC_PROVIDER_URL || networkConfig.rpcProviderUrl,
}

const baseConfig = {
    chain: networkInfo.chain,
    transport: http(networkInfo.rpcProviderUrl),
} as const

export const publicClient = createPublicClient(baseConfig)
export const walletClient: WalletClient = createWalletClient({
    chain: networkInfo.chain,
    transport: http(networkInfo.rpcProviderUrl),
    account,
})

// Export constants
export const NATIVE_TOKEN_ADDRESS = networkInfo.nativeTokenAddress
export const BLOCK_EXPLORER_URL = networkInfo.blockExplorer
