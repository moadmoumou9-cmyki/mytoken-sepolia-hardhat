const hre = require("hardhat");

// ── Configure these two values before running ────────────────────────────────
const RECIPIENT = "0xAbD77836F07a1E5E418105be056E7b6e8fdEf829"
const AMOUNT    = "100"; // MTK to send (whole tokens, not wei)
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_ADDRESS = "0x53C6B34161810fb57df803c0d1E3F608Bc0af91A";

async function main() {
  if (RECIPIENT === "0xREPLACE_WITH_RECIPIENT_ADDRESS") {
    throw new Error("Set RECIPIENT to a real address before running.");
  }

  const [owner] = await hre.ethers.getSigners();
  const token   = await hre.ethers.getContractAt("MyToken", TOKEN_ADDRESS);
  const decimals = await token.decimals();

  console.log("Network   :", hre.network.name);
  console.log("From      :", owner.address);
  console.log("To        :", RECIPIENT);
  console.log("Amount    :", AMOUNT, "MTK");
  console.log("");

  // Balances before
  const senderBefore    = await token.balanceOf(owner.address);
  const recipientBefore = await token.balanceOf(RECIPIENT);
  console.log("Sender balance before    :", hre.ethers.formatUnits(senderBefore, decimals), "MTK");
  console.log("Recipient balance before :", hre.ethers.formatUnits(recipientBefore, decimals), "MTK");
  console.log("");

  // Send the transfer
  const tx = await token.transfer(RECIPIENT, hre.ethers.parseUnits(AMOUNT, decimals));
  console.log("Tx sent :", tx.hash);
  console.log("Waiting for confirmation...");
  await tx.wait();
  console.log("Confirmed!");
  console.log("");

  // Balances after
  const senderAfter    = await token.balanceOf(owner.address);
  const recipientAfter = await token.balanceOf(RECIPIENT);
  console.log("Sender balance after     :", hre.ethers.formatUnits(senderAfter, decimals), "MTK");
  console.log("Recipient balance after  :", hre.ethers.formatUnits(recipientAfter, decimals), "MTK");
  console.log("");
  console.log("View tx on Etherscan:");
  console.log(`  https://sepolia.etherscan.io/tx/${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
