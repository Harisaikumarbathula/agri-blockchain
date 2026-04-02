# AgriChain Local

AgriChain Local is a localhost-only agricultural supply chain app built with React, Express, MongoDB, Solidity, Truffle, and Ganache.

This v2 rebuild uses:

- INR pricing stored as integer paise
- simulated UPI and COD payments
- backend-signed blockchain proofs
- no MetaMask requirement for buyers
- public order traceability by order number

## Project Structure

```text
agri-blockchain/
├── blockchain/
├── backend/
├── frontend/
└── README.md
```

## What Changed In V2

- The smart contract is now a proof ledger instead of an ETH escrow wallet.
- Buyers pay with simulated `UPI` or `COD`.
- The backend signs all blockchain transactions with a Ganache private key.
- The frontend no longer uses MetaMask, `window.ethereum`, or browser-side contract calls.
- Orders and products include traceability details such as batch code, origin, and harvest date.

## Core Features

### Blockchain

- Records products on-chain with:
  - name
  - category
  - unit
  - quantity
  - batch code
  - origin location
  - harvest date
- Records orders on-chain with:
  - order number
  - product id
  - quantity
  - total paise
  - payment method
  - payment status
  - order status
- Emits proof events:
  - `ProductRecorded`
  - `ProductUpdated`
  - `ProductDeactivated`
  - `OrderRecorded`
  - `PaymentRecorded`
  - `OrderStatusUpdated`
  - `OrderCancelled`
  - `CodCollected`

### Backend

- JWT authentication
- role-based access for `buyer`, `farmer`, and `admin`
- MongoDB persistence with Mongoose
- backend-to-blockchain integration through Web3.js
- stores blockchain transaction hashes on products and orders
- computes platform revenue as a reporting-only 20% fee

### Frontend

- login and registration
- buyer marketplace and cart
- simulated UPI checkout
- COD checkout
- farmer dashboard for products and order actions
- buyer order tracking and payment retry
- admin dashboard
- public traceability page at `/track/:orderNumber`

## Order Flow

### UPI

1. Buyer creates an order with `paymentMethod=upi`
2. Backend reserves inventory and records the order on-chain
3. Buyer simulates payment success or failure
4. Backend records payment status on-chain
5. Farmer confirms and ships only after UPI is marked `paid`
6. Buyer confirms delivery

### COD

1. Buyer creates an order with `paymentMethod=cod`
2. Backend reserves inventory and records the order on-chain
3. Farmer confirms and ships
4. Buyer confirms delivery
5. Backend marks payment as `collected` and records COD collection on-chain

## Local URLs

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:5000`
- Backend health: `http://127.0.0.1:5000/api/health`
- Ganache RPC: `http://127.0.0.1:7545`
- MongoDB: `mongodb://127.0.0.1:27017/agri-blockchain`

## Default Admin

- Email: `admin@agri.local`
- Password: `Admin123!`

## Environment

### `backend/.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/agri-blockchain
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=7d
CLIENT_URL=http://127.0.0.1:5173
GANACHE_URL=http://127.0.0.1:7545
CONTRACT_NETWORK_ID=1337
CHAIN_ID=1337
BLOCKCHAIN_SIGNER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ADMIN_NAME=Platform Admin
ADMIN_EMAIL=admin@agri.local
ADMIN_PASSWORD=Admin123!
```

### `frontend/.env`

```env
VITE_API_URL=http://127.0.0.1:5000/api
```

## Run The Project

Open separate terminals and run the following.

### 1. Start Ganache

```bash
cd blockchain
npm install
npm run ganache
```

### 2. Deploy The Contract

```bash
cd blockchain
npm run reset
```

This deploys the current `FarmSupplyChain` proof-ledger contract to local Ganache.

### 3. Start MongoDB

Make sure a local MongoDB server is running on:

```text
mongodb://127.0.0.1:27017
```

### 4. Start The Backend

```bash
cd backend
npm install
npm start
```

The backend will:

- connect to MongoDB
- seed the default admin if missing
- use the configured Ganache private key to sign blockchain transactions

### 5. Start The Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5173
```

## Reset Local State

If you want a clean v2 environment:

1. stop backend and frontend
2. drop the `agri-blockchain` MongoDB database
3. run `npm run reset` inside `blockchain`
4. restart backend and frontend

## Important API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Products

- `GET /api/products`
- `GET /api/products/my/listings`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Orders

- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `POST /api/orders/:id/payment/simulate`
- `PUT /api/orders/:id/status`
- `DELETE /api/orders/:id`

### Public Tracking

- `GET /api/track/:orderNumber`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/products`
- `GET /api/admin/orders`

## Verified Locally

The current codebase has been verified locally with:

- `truffle compile`
- `truffle migrate --reset`
- backend app load
- frontend production build
- end-to-end API smoke tests for:
  - farmer registration
  - buyer registration
  - admin login
  - product creation with traceability fields
  - UPI failed then paid retry flow
  - farmer confirm and ship flow
  - buyer delivery confirmation
  - COD collection on delivery
  - buyer cancellation before farmer confirmation
  - public tracking lookup

## Notes

- UPI is simulated for localhost use only.
- No real payment gateway is used.
- No cloud services are required.
- Buyers do not need MetaMask.
- Ganache is still required because blockchain proof records are written in the background.
