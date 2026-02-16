# Backend Environment Setup

## Quick Setup

1. **Copy the example file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `.env` file** with your actual credentials (see below)

## Required Configuration

Create a `.env` file in the `backend` directory with the following content:

```bash
# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://user:password@host:port/database

# Redis Configuration (REQUIRED for auto-pay queue)
# Option 1: Full connection string (recommended)


# Option 2: Individual components (used if REDIS_URL is not set)
# REDIS_USERNAME=default
# REDIS_PASSWORD=WsjE9g4MJCwrcmyXL0dR80etUIAZ8sOZ
# REDIS_HOST=redis-15358.c15.us-east-1-2.ec2.cloud.redislabs.com
# REDIS_PORT=15358

# Server Configuration
PORT=5000

# Optional: Wallet Configuration (for contract interactions)
# WALLET_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Optional: RPC Configuration (Hedera Testnet)
# RPC_PROVIDER_URL=https://testnet.hashio.io/api

# Optional: Pinata IPFS Configuration
# PINATA_JWT=

# Optional: Yakoa API Configuration
# YAKOA_API_KEY=
# YAKOA_SUBDOMAIN=
# YAKOA_NETWORK=hedera_testnet

# Optional: NFT Contract Configuration
# NFT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Optional: Payment asset for auto-pay worker (default: zero address = native HBAR)
# PAYMENT_ASSET_TESTNET=0x...
```

## Redis Configuration

The auto-pay queue and payment scheduler **require** Redis. You must set either:

- **REDIS_URL** – full connection string, e.g. `redis://username:password@host:port`, or  
- **REDIS_USERNAME**, **REDIS_PASSWORD**, **REDIS_HOST**, **REDIS_PORT**

Without Redis, the backend will fail when the worker initializes.

### Examples

1. **Local Redis:**
   ```bash
   REDIS_URL=redis://localhost:6379
   ```

2. **Redis Cloud:**
   - Sign up at https://redis.com/cloud
   - Create a database
   - Copy the connection URL
   - Set `REDIS_URL` in `.env`

## Network Configuration

- **Network**: Hedera Testnet
- **Chain ID**: 296
- **RPC URL**: https://testnet.hashio.io/api
- **Explorer**: https://hashscan.io/testnet
- **Native Token**: HBAR

## To Get Your Real Credentials

### Database URL:
1. Use your PostgreSQL connection string
2. Format: `postgresql://user:password@host:port/database`

### Pinata JWT (for IPFS - optional):
1. Go to [Pinata Developers](https://app.pinata.cloud/developers/api-keys)
2. Create a new API key
3. Copy the JWT token

## Running the Backend

After creating the `.env` file:

```bash
cd backend
yarn install
yarn start
```

The backend should now start successfully with:
- ✅ Database connection
- ✅ Redis connection (for auto-pay queue)
- ✅ Payment scheduler (if Redis is configured)
