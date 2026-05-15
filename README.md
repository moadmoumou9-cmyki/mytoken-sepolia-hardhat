# MyToken — ERC20 Smart Contract on Sepolia

A production-style ERC20 token built with Solidity and OpenZeppelin, deployed to the Ethereum Sepolia testnet. This project covers the full lifecycle: writing, testing, deploying, and interacting with a smart contract on a live network.

---

## Contract

| | |
|---|---|
| **Network** | Ethereum Sepolia testnet |
| **Address** | `0x53C6B34161810fb57df803c0d1E3F608Bc0af91A` |
| **Name** | My Token |
| **Symbol** | MTK |
| **Decimals** | 18 |
| **Initial supply** | 1,000,000 MTK |

View on Etherscan: https://sepolia.etherscan.io/address/0x53C6B34161810fb57df803c0d1E3F608Bc0af91A

---

## What MyToken does

`MyToken` inherits three OpenZeppelin contracts:

- **ERC20** — standard token with `transfer`, `approve`, `transferFrom`, balances, allowances, and events
- **ERC20Burnable** — adds `burn(amount)` so any holder can permanently destroy their own tokens, and `burnFrom(from, amount)` for approved spenders
- **Ownable** — tracks a single owner address and exposes the `onlyOwner` modifier, used to gate `mint()`

The only custom logic is:

```solidity
constructor(address initialOwner)
    ERC20("My Token", "MTK")
    Ownable(initialOwner)
{
    _mint(initialOwner, 1_000_000 * 10 ** decimals());
}

function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
}
```

Everything else — transfers, approvals, burns, ownership transfer — is inherited from OpenZeppelin with no modification.

---

## Tech stack

| Tool | Version | Role |
|---|---|---|
| Solidity | 0.8.28 | Smart contract language |
| Hardhat | 2.x | Development environment, test runner, deployer |
| OpenZeppelin Contracts | 5.x | Audited ERC20 / Ownable base contracts |
| ethers.js | 6.x | Blockchain interaction in scripts and frontend |
| Mocha + Chai | — | Test framework (via hardhat-toolbox) |
| dotenv | 17.x | Loads `.env` into `hardhat.config.js` |
| Vanilla JS + HTML/CSS | — | Frontend dApp (no framework, no build step) |

---

## Project structure

```
contracts/
  MyToken.sol          — the main ERC20 token contract
  SimpleToken.sol      — hand-rolled ERC20 (learning reference, not deployed)
  Lock.sol             — Hardhat default starter contract

scripts/
  deployMyToken.js     — deploys MyToken to any configured network
  interactMyToken.js   — reads state, mints, and burns on the live contract
  transferMyToken.js   — transfers MTK to a recipient on Sepolia
  interactToken.js     — local demo using SimpleToken (Hardhat network only)

test/
  MyToken.js           — 15 unit tests covering all contract behaviour
  SimpleToken.js       — tests for the hand-rolled token
  Lock.js              — tests for the starter contract

frontend/
  index.html           — dApp UI: connect wallet, view balance, send MTK
  app.js               — ethers.js v6 logic: wallet, contract calls, MetaMask events
  style.css            — dark-theme styling, no framework

hardhat.config.js      — network config (Hardhat local + Sepolia)
.env.example           — template showing required environment variables
```

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_64_hex_char_private_key_no_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key
```

> Never commit `.env` — it is listed in `.gitignore`.

### 3. Compile

```bash
npx hardhat compile
```

### 4. Run tests

```bash
npx hardhat test test/MyToken.js
```

All 15 tests should pass in under 2 seconds against the local Hardhat network — no ETH needed.

### 5. Deploy to Sepolia

```bash
npx hardhat run scripts/deployMyToken.js --network sepolia
```

The script prints the deployed address, token metadata, and the Etherscan verification command.

### 6. Interact with the live contract

Read state, mint 500 MTK, and burn 100 MTK:

```bash
npx hardhat run scripts/interactMyToken.js --network sepolia
```

Transfer tokens to another address (edit `RECIPIENT` in the script first):

```bash
npx hardhat run scripts/transferMyToken.js --network sepolia
```

### 7. Run the frontend dApp

Open the dApp in your browser — no build step required.

**Option A — VS Code Live Server (recommended)**
1. Install the **Live Server** extension in VS Code
2. Right-click `frontend/index.html` → **Open with Live Server**
3. Browser opens at `http://127.0.0.1:5500`

**Option B — terminal**
```bash
npx serve frontend
```
Then open `http://localhost:3000`.

> Do not open `index.html` directly as a `file://` URL — browsers block ES modules on that protocol.

The dApp will:
- Ask MetaMask to connect and verify you are on Sepolia
- Display your wallet address and live MTK balance
- Let you send MTK to any address and track the transaction on Etherscan

### 8. Verify on Etherscan (optional)

Requires `ETHERSCAN_API_KEY` in `.env`:

```bash
npx hardhat verify --network sepolia 0x53C6B34161810fb57df803c0d1E3F608Bc0af91A "0xD90cab3A1e49E05F058dC4323ad02A45E10339E1"
```

---

## Test suite

All 15 tests run against the local Hardhat network using `loadFixture` for fast, isolated setup.

| Group | Tests | What is verified |
|---|---|---|
| Deployment | 4 | Name, symbol, decimals, initial supply minted to owner, owner address |
| ERC20 inherited | 4 | `transfer`, `approve`/`transferFrom`, insufficient-balance revert, insufficient-allowance revert |
| mint() | 2 | Owner can mint; non-owner reverts with `OwnableUnauthorizedAccount` |
| burn() | 3 | Holder can burn own tokens; burning more than balance reverts; `burnFrom` works after approval |
| Ownable | 2 | Ownership transfers correctly; old owner loses mint access after transfer |

---

## What I learned

**Solidity and ERC20**
- How the ERC20 standard works under the hood: balances, allowances, `Transfer` and `Approval` events
- How OpenZeppelin's inheritance model works — importing audited contracts and extending them with only the custom logic you need
- The difference between `transfer` (sender calls it) and `transferFrom` (third party calls it after approval)
- How `burn` permanently removes tokens from supply, and how `burnFrom` requires an allowance

**Hardhat development workflow**
- Compiling, testing, and deploying with Hardhat
- Using `loadFixture` in tests for clean, isolated state per test
- Reading custom errors (`ERC20InsufficientBalance`, `OwnableUnauthorizedAccount`) with `revertedWithCustomError`
- Attaching to an already-deployed contract with `getContractAt` instead of redeploying

**Testnet deployment**
- Configuring Hardhat for Sepolia with an RPC URL and private key via `.env`
- What happens after deployment: reading live state, sending real transactions, paying real gas
- How to use `waitForDeployment()` and `tx.wait()` to confirm transactions are mined
- How to add an ERC20 token to MetaMask and verify transfers between accounts

**Frontend and Web3**
- How a browser dApp connects to MetaMask using `BrowserProvider` from ethers.js v6
- How to read contract state (`balanceOf`, `decimals`) and write to it (`transfer`) from the frontend
- How MetaMask handles transaction confirmation and why `tx.wait()` is needed to know when a tx is mined
- How to handle MetaMask events: `accountsChanged` (user switches wallet) and `chainChanged` (user switches network)
- How to detect the wrong network and prompt the user to switch with `wallet_switchEthereumChain`
- Using a human-readable ABI in ethers.js instead of the full compiled JSON
