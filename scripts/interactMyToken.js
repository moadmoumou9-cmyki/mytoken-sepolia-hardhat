const hre = require("hardhat");

const TOKEN_ADDRESS = "0x53C6B34161810fb57df803c0d1E3F608Bc0af91A";

async function main() {
  const [owner] = await hre.ethers.getSigners();

  console.log("Network  :", hre.network.name);
  console.log("Account  :", owner.address);
  console.log("Token    :", TOKEN_ADDRESS);
  console.log("");

  // Attach to the already-deployed contract — no redeployment
  const token = await hre.ethers.getContractAt("MyToken", TOKEN_ADDRESS);

  // ── 1. Read contract state ───────────────────────────────────────────────
  console.log("=".repeat(50));
  console.log("CONTRACT STATE");
  console.log("=".repeat(50));

  const name        = await token.name();
  const symbol      = await token.symbol();
  const decimals    = await token.decimals();
  const totalSupply = await token.totalSupply();
  const tokenOwner  = await token.owner();

  console.log("Name         :", name);
  console.log("Symbol       :", symbol);
  console.log("Decimals     :", decimals.toString());
  console.log("Total supply :", hre.ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("Owner        :", tokenOwner);
  console.log("");

  // ── 2. Check deployer balance ────────────────────────────────────────────
  console.log("=".repeat(50));
  console.log("BALANCES");
  console.log("=".repeat(50));

  const balance = await token.balanceOf(owner.address);
  console.log("Owner balance:", hre.ethers.formatUnits(balance, decimals), symbol);
  console.log("");

  // ── 3. Mint 500 extra tokens to yourself (owner only) ───────────────────
  console.log("=".repeat(50));
  console.log("MINT 500 MTK → owner");
  console.log("=".repeat(50));

  const mintAmount = hre.ethers.parseUnits("500", decimals);
  const mintTx = await token.mint(owner.address, mintAmount);
  console.log("Tx sent  :", mintTx.hash);
  await mintTx.wait();
  console.log("Confirmed!");

  const balanceAfterMint = await token.balanceOf(owner.address);
  console.log("New balance  :", hre.ethers.formatUnits(balanceAfterMint, decimals), symbol);
  console.log("New supply   :", hre.ethers.formatUnits(await token.totalSupply(), decimals), symbol);
  console.log("");

  // ── 4. Burn 100 tokens from your own balance ─────────────────────────────
  console.log("=".repeat(50));
  console.log("BURN 100 MTK from owner");
  console.log("=".repeat(50));

  const burnAmount = hre.ethers.parseUnits("100", decimals);
  const burnTx = await token.burn(burnAmount);
  console.log("Tx sent  :", burnTx.hash);
  await burnTx.wait();
  console.log("Confirmed!");

  const balanceAfterBurn = await token.balanceOf(owner.address);
  console.log("New balance  :", hre.ethers.formatUnits(balanceAfterBurn, decimals), symbol);
  console.log("New supply   :", hre.ethers.formatUnits(await token.totalSupply(), decimals), symbol);
  console.log("");

  console.log("Done. View on Etherscan:");
  console.log(`  https://sepolia.etherscan.io/address/${TOKEN_ADDRESS}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
