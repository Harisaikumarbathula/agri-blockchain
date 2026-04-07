# AgriChain Local

AgriChain Local is a local-first agricultural marketplace and traceability platform built with React, Express, MongoDB, Solidity, Truffle, Ganache, and Web3.js.

It lets farmers publish produce, buyers place orders with simulated UPI or COD payments, admins oversee the platform, and anyone with an order number verify the supply-chain journey through a public tracking page.

The project is designed for localhost development and demos:

- no MetaMask is required for buyers
- blockchain writes are signed by the backend
- payments are simulated for smooth local testing and demos
- blockchain proofs are still recorded for products, orders, payment updates, and order lifecycle changes

## Table Of Contents

- Overview
- Key Capabilities
- User Roles
- Project Structure
- Tech Stack
- How The System Works
- Order Lifecycle
- Local URLs
- Prerequisites
- Environment Variables
- Getting Started
- Default Admin Account
- Important Frontend Routes
- Important API Routes
- Data Notes
- Resetting Local State
- Helpful Notes
- Project Focus

## Overview

AgriChain Local combines three layers:

1. `frontend/`
   A React + Vite client for buyers, farmers, and admins.
2. `backend/`
   An Express API with JWT auth, MongoDB persistence, business logic, blockchain integration, analytics, and GPS simulation.
3. `blockchain/`
   A Truffle/Ganache workspace that deploys the `FarmSupplyChain` smart contract used as a proof ledger.

This project uses a backend-signed blockchain architecture:

- the backend is the blockchain writer
- Ganache is the local chain
- MongoDB stores the application state
- the smart contract stores verifiable proof events and ledger state

## Key Capabilities

- Farmer product listing with traceability fields such as batch code, origin location, harvest date, unit, quantity, and price
- Buyer marketplace, cart, and grouped checkout by farmer
- Simulated `UPI` and `COD` payment flows
- Buyer profile management with photo, address, pincode, phone extension, role, and bio
- Order records that snapshot buyer delivery details and farmer contact details
- Buyer order history with cancellation and payment retry flows
- Farmer order handling for confirm, ship, and out-for-delivery transitions
- Public order tracking by order number
- Farm address and buyer delivery address shown during tracking
- Admin dashboard with users, products, orders, revenue, and analytics access
- GPS simulation for `out_for_delivery` orders
- Automatic blockchain re-sync for local products when the backend starts against an empty chain

## User Roles

### Buyer

- Browse the marketplace
- Add produce to cart
- Enter delivery details during checkout
- Pay with simulated UPI or choose COD
- View order history
- Cancel eligible pending orders
- Confirm delivery
- Edit profile

### Farmer

- Create and manage product listings
- View own marketplace listings
- Confirm orders
- Mark orders as shipped
- Mark orders as out for delivery
- View blockchain-backed order progress
- Edit profile

### Admin

- View platform statistics
- View registered users
- View all products
- View all orders
- Disable products
- Open delivery analytics dashboard

## Project Structure

```text
agri-blockchain/
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   |-- .env.example
|   `-- package.json
|-- blockchain/
|   |-- contracts/
|   |-- migrations/
|   |-- build/
|   |-- truffle-config.js
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- pages/
|   |   `-- utils/
|   `-- package.json
`-- README.md
```

## Tech Stack

### Frontend

- React 18
- React Router
- Vite
- Axios
- React Toastify
- Recharts
- Leaflet / React Leaflet

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- Web3.js
- Morgan
- CORS

### Blockchain

- Solidity `0.8.19`
- Truffle
- Ganache

## How The System Works

### 1. Product publishing

- Farmers create products in MongoDB.
- The backend records the product on-chain using the backend signer account.
- The product stores:
  - blockchain product id
  - initial blockchain transaction hash
  - latest blockchain transaction hash

### 2. Order creation

- Buyers check out from the cart.
- Checkout requires:
  - email
  - mobile extension
  - mobile number
  - address / place
  - state
  - country
  - pincode
- The backend creates order records in MongoDB and records proof data on-chain.
- Each order snapshots:
  - buyer delivery details
  - farmer contact details
  - payment method
  - payment status
  - order status

### 3. Payment flow

- `UPI` is simulated.
- `COD` is simulated and marked collected when delivery is confirmed.
- Payment state changes are also written to the blockchain proof ledger.

### 4. Tracking

- Public tracking is available at `/track/:orderNumber`.
- The tracking page shows:
  - product details
  - order lifecycle timeline
  - blockchain proof hashes
  - farm details
  - buyer delivery details
- When an order is `out_for_delivery`, the backend GPS simulator updates coordinates every 5 seconds.

### 5. Startup helpers

On backend startup, the server:

- connects to MongoDB
- ensures the default admin user exists
- attempts to re-sync local products to an empty blockchain
- starts GPS simulation for delivery orders

## Order Lifecycle

### UPI flow

1. Buyer places an order with `paymentMethod=upi`
2. Backend records the order on-chain with payment status `pending`
3. Buyer simulates payment as `paid` or `failed`
4. Backend records the payment update on-chain
5. Farmer confirms the order after successful payment
6. Farmer marks it shipped
7. Farmer marks it out for delivery
8. Buyer confirms delivery

### COD flow

1. Buyer places an order with `paymentMethod=cod`
2. Backend records the order on-chain
3. Farmer confirms the order
4. Farmer marks it shipped
5. Farmer marks it out for delivery
6. Buyer confirms delivery
7. Backend marks COD as `collected` and records that proof on-chain

### Cancellation

- Buyers can cancel eligible pending orders
- cancellation is recorded on-chain
- product stock is restored in MongoDB

## Blockchain Smart Contract

The deployed contract is `FarmSupplyChain`.

It records proof-ledger state for:

- product creation
- product update
- product deactivation
- order creation
- payment recording
- order status updates
- order cancellation
- COD collection

Core contract event types:

- `ProductRecorded`
- `ProductUpdated`
- `ProductDeactivated`
- `OrderRecorded`
- `PaymentRecorded`
- `OrderStatusUpdated`
- `OrderCancelled`
- `CodCollected`

## Local URLs

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:5000/api`
- Backend health: `http://127.0.0.1:5000/api/health`
- Ganache RPC: `http://127.0.0.1:7545`
- MongoDB: `mongodb://127.0.0.1:27017/agri-blockchain`

## Prerequisites

Install these locally before running the project:

- Node.js 18+ recommended
- npm
- MongoDB running locally
- Ganache CLI via project dependency

Out of the box, the project works without:

- MetaMask
- a public blockchain
- a real payment gateway

## Environment Variables

### Backend: `backend/.env`

Copy from `backend/.env.example`.

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

### Frontend: `frontend/.env`

Create this file if it does not exist:

```env
VITE_API_URL=http://127.0.0.1:5000/api
```

### Blockchain: `blockchain/.env`

Copy from `blockchain/.env.example` if needed by your local tooling:

```env
GANACHE_HOST=127.0.0.1
GANACHE_PORT=7545
CONTRACT_NETWORK_ID=1337
```

## Getting Started

Open separate terminals for blockchain, backend, and frontend.

### 1. Install dependencies

```bash
cd blockchain
npm install

cd ..\\backend
npm install

cd ..\\frontend
npm install
```

### 2. Start Ganache

```bash
cd blockchain
npm run ganache
```

This starts a local chain on `127.0.0.1:7545` using the configured deterministic mnemonic and local database folder.

### 3. Deploy the smart contract

In a new terminal:

```bash
cd blockchain
npm run reset
```

Useful blockchain commands:

```bash
npm run compile
npm run migrate
npm run reset
npm run test
```

### 4. Start MongoDB

Make sure MongoDB is running locally at:

```text
mongodb://127.0.0.1:27017
```

### 5. Start the backend

```bash
cd backend
npm start
```

Or use watch mode:

```bash
npm run dev
```

The backend will:

- connect to MongoDB
- seed the default admin user if missing
- sync products to the blockchain if the chain is empty
- start GPS simulation for `out_for_delivery` orders

### 6. Start the frontend

```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5173
```

## Default Admin Account

By default the backend seeds an admin user from environment variables.

Default values:

- Email: `admin@agri.local`
- Password: `Admin123!`

If you change `ADMIN_EMAIL` or `ADMIN_PASSWORD` in `backend/.env`, the seeded credentials change as well.

## Important Frontend Routes

- `/` - landing page
- `/login` - login
- `/register` - buyer/farmer registration
- `/forgot-password` - placeholder recovery page
- `/marketplace` - authenticated marketplace
- `/cart` - buyer checkout
- `/buyer/orders` - buyer order history
- `/farmer/dashboard` - farmer operations
- `/profile` - profile management
- `/admin` - admin dashboard
- `/admin/analytics` - admin delivery analytics
- `/track/:orderNumber` - public tracking page

## Important API Routes

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`

### Config

- `GET /api/config/blockchain`

### Products

- `GET /api/products`
- `GET /api/products/:id`
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

### Tracking

- `GET /api/track/:orderNumber`
- `GET /api/track/details/:id`
- `PUT /api/track/status/:id`
- `GET /api/track/analytics`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/products`
- `GET /api/admin/orders`

## Data Notes

### Pricing

- Product and order pricing is stored as integer paise
- UI formatting converts paise to INR

### Profiles

User profiles currently support:

- profile photo
- full name
- phone extension
- phone number
- email
- place
- state
- country
- pincode
- role
- bio

### Orders

Orders store:

- buyer reference
- farmer reference
- product reference
- on-chain ids and tx hashes
- payment history
- status history
- delivery location coordinates
- buyer contact snapshot
- farmer contact snapshot

## Resetting Local State

If you want to start fresh:

1. stop frontend and backend
2. stop Ganache
3. drop the `agri-blockchain` MongoDB database
4. restart Ganache with `npm run ganache` inside `blockchain`
5. redeploy the contract with `npm run reset` inside `blockchain`
6. restart the backend
7. restart the frontend

## Helpful Notes

### Admin pages are not opening

For the best experience, make sure:

- you are logged in as an admin account
- backend is running
- frontend is pointing to the correct backend URL

Admin pages:

- `/admin`
- `/admin/analytics`

### Public tracking is empty

Check that:

- the order exists in MongoDB
- you are using the correct `orderNumber`
- backend is running

### Blockchain errors after reset

After resetting Ganache or redeploying the contract, this flow keeps everything aligned:

- run `npm run reset` in `blockchain`
- restart the backend
- refresh the frontend

The backend tries to re-sync products to an empty chain at startup.

### Checkout says delivery details are required

Checkout is designed to capture:

- email
- mobile extension
- mobile number
- address / place
- state
- country
- pincode

You can prefill these from the profile page before opening the cart.

### MongoDB connection issues

Make sure MongoDB is running locally at:

```text
mongodb://127.0.0.1:27017/agri-blockchain
```

### Large frontend build warning

The Vite production build currently completes successfully. A future code-splitting pass can make the production bundle even leaner.

## Project Focus

AgriChain Local is especially well suited for:

- local demos and guided product walkthroughs
- academic and portfolio projects
- proof-of-concept supply-chain workflows
- experimenting with React + Express + MongoDB + Solidity integration
- validating blockchain-backed order and tracking flows without external dependencies

## Summary

AgriChain Local is a full-stack farm-to-buyer demo platform with:

- marketplace and role-based dashboards
- blockchain-backed proof recording
- simulated local payments
- public tracking
- admin analytics
- profile and delivery detail management
