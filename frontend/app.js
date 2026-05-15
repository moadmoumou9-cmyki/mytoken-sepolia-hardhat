import { ethers } from "https://esm.sh/ethers@6.13.0";

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTRACT_ADDRESS = "0x53C6B34161810fb57df803c0d1E3F608Bc0af91A";
const SEPOLIA_CHAIN_ID = 11155111n;

// Human-readable ABI — only the functions this UI needs
const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// ── DOM refs ──────────────────────────────────────────────────────────────────

const connectBtn     = document.getElementById("connect-btn");
const refreshBtn     = document.getElementById("refresh-btn");
const sendBtn        = document.getElementById("send-btn");
const switchBtn      = document.getElementById("switch-btn");

const connectSection  = document.getElementById("connect-section");
const networkWarning  = document.getElementById("network-warning");
const walletSection   = document.getElementById("wallet-section");
const sendSection     = document.getElementById("send-section");
const networkBadge    = document.getElementById("network-badge");

const walletAddressEl = document.getElementById("wallet-address");
const mtkBalanceEl    = document.getElementById("mtk-balance");
const recipientInput  = document.getElementById("recipient");
const amountInput     = document.getElementById("amount");
const txStatus        = document.getElementById("tx-status");

// ── State ─────────────────────────────────────────────────────────────────────

let provider, signer, contract;

// ── Helpers ───────────────────────────────────────────────────────────────────

const short = (addr) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

function setStatus(html, type = "info") {
  txStatus.innerHTML = html;
  txStatus.className = `tx-status ${type}`;
  txStatus.classList.remove("hidden");
}

function clearStatus() {
  txStatus.classList.add("hidden");
}

function showConnectedUI(address) {
  walletAddressEl.textContent = short(address);
  walletAddressEl.title = address;
  connectSection.classList.add("hidden");
  networkWarning.classList.add("hidden");
  walletSection.classList.remove("hidden");
  sendSection.classList.remove("hidden");
  networkBadge.classList.remove("hidden");
}

function showNetworkWarning() {
  walletSection.classList.add("hidden");
  sendSection.classList.add("hidden");
  networkBadge.classList.add("hidden");
  networkWarning.classList.remove("hidden");
}

// ── Core actions ──────────────────────────────────────────────────────────────

async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask not detected.\nInstall it from metamask.io and reload.");
    return;
  }

  connectBtn.textContent = "Connecting…";
  connectBtn.disabled = true;

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer   = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const { chainId } = await provider.getNetwork();
    if (chainId !== SEPOLIA_CHAIN_ID) {
      showNetworkWarning();
      return;
    }

    const address = await signer.getAddress();
    showConnectedUI(address);
    await loadBalance();
  } catch (err) {
    console.error(err);
    alert("Connection failed: " + err.message);
  } finally {
    connectBtn.textContent = "Connect MetaMask";
    connectBtn.disabled = false;
  }
}

async function loadBalance() {
  mtkBalanceEl.textContent = "Loading…";
  try {
    const address  = await signer.getAddress();
    const raw      = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    mtkBalanceEl.textContent = `${ethers.formatUnits(raw, decimals)} MTK`;
  } catch (err) {
    mtkBalanceEl.textContent = "Error";
    console.error(err);
  }
}

async function sendTokens() {
  clearStatus();
  const recipient = recipientInput.value.trim();
  const amount    = amountInput.value.trim();

  if (!ethers.isAddress(recipient)) {
    setStatus("Invalid recipient address.", "error");
    return;
  }
  if (!amount || parseFloat(amount) <= 0) {
    setStatus("Enter a valid amount greater than 0.", "error");
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = "Waiting for MetaMask…";
  setStatus("Open MetaMask and confirm the transaction.", "info");

  try {
    const decimals = await contract.decimals();
    const parsed   = ethers.parseUnits(amount, decimals);
    const tx       = await contract.transfer(recipient, parsed);

    sendBtn.textContent = "Mining…";
    setStatus(`Transaction sent — waiting for confirmation…<br><code>${short(tx.hash)}</code>`, "info");

    await tx.wait();

    setStatus(
      `✓ Sent <strong>${amount} MTK</strong> to <code>${short(recipient)}</code>.<br>
       <a href="https://sepolia.etherscan.io/tx/${tx.hash}" target="_blank" rel="noopener">
         View on Etherscan ↗
       </a>`,
      "success"
    );

    recipientInput.value = "";
    amountInput.value    = "";
    await loadBalance();
  } catch (err) {
    console.error(err);
    if (err.code === 4001 || err.code === "ACTION_REJECTED") {
      setStatus("Transaction rejected in MetaMask.", "error");
    } else if (err.message?.includes("ERC20InsufficientBalance")) {
      setStatus("Insufficient MTK balance.", "error");
    } else {
      setStatus("Error: " + (err.reason ?? err.message), "error");
    }
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send MTK";
  }
}

async function switchToSepolia() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }],
    });
  } catch (err) {
    // 4902 = chain not added to MetaMask yet
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0xaa36a7",
          chainName: "Sepolia",
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://rpc.sepolia.org"],
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
        }],
      });
    }
  }
}

// ── MetaMask event listeners ──────────────────────────────────────────────────

function setupMetaMaskListeners() {
  if (!window.ethereum) return;

  // User switches account in MetaMask
  window.ethereum.on("accountsChanged", async (accounts) => {
    if (accounts.length === 0) {
      location.reload(); // wallet locked / disconnected
    } else {
      signer   = await provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const address = await signer.getAddress();
      walletAddressEl.textContent = short(address);
      walletAddressEl.title = address;
      clearStatus();
      await loadBalance();
    }
  });

  // User switches network in MetaMask — safest to reload
  window.ethereum.on("chainChanged", () => location.reload());
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

connectBtn.addEventListener("click", connectWallet);
refreshBtn.addEventListener("click", loadBalance);
sendBtn.addEventListener("click", sendTokens);
switchBtn.addEventListener("click", switchToSepolia);

setupMetaMaskListeners();
