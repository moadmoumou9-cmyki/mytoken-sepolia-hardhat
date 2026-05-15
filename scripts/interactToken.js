const hre = require("hardhat");

// Helper: format a raw token amount (with 18 decimals) into a readable string
function fmt(amount) {
  return hre.ethers.formatUnits(amount, 18) + " MTK";
}

async function main() {
  // ── 1. Get test accounts ─────────────────────────────────────────────────
  // Hardhat gives us 20 funded accounts by default (each has 10,000 ETH)
  const [owner, alice, bob] = await hre.ethers.getSigners();

  console.log("=".repeat(55));
  console.log("ACCOUNTS");
  console.log("=".repeat(55));
  console.log("Owner :", owner.address);
  console.log("Alice :", alice.address);
  console.log("Bob   :", bob.address);

  // ── 2. Deploy the contract ───────────────────────────────────────────────
  console.log("\n" + "=".repeat(55));
  console.log("DEPLOYING SimpleToken");
  console.log("=".repeat(55));

  const Token = await hre.ethers.getContractFactory("SimpleToken");
  const token = await Token.deploy("My Token", "MTK", 1_000_000); // 1 million tokens
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("Contract deployed at:", tokenAddress);

  // ── 3. Check initial state ───────────────────────────────────────────────
  console.log("\n" + "=".repeat(55));
  console.log("INITIAL BALANCES");
  console.log("=".repeat(55));

  console.log("Owner :", fmt(await token.balanceOf(owner.address)));
  console.log("Alice :", fmt(await token.balanceOf(alice.address)));
  console.log("Bob   :", fmt(await token.balanceOf(bob.address)));
  console.log("Total supply:", fmt(await token.totalSupply()));

  // ── 4. Transfer from owner to alice ─────────────────────────────────────
  console.log("\n" + "=".repeat(55));
  console.log("TRANSFER: owner → alice (1,000 MTK)");
  console.log("=".repeat(55));

  const amount1 = hre.ethers.parseUnits("1000", 18);
  const tx1 = await token.transfer(alice.address, amount1);
  await tx1.wait(); // wait for the transaction to be mined

  console.log("Transaction hash:", tx1.hash);
  console.log("Owner :", fmt(await token.balanceOf(owner.address)));
  console.log("Alice :", fmt(await token.balanceOf(alice.address)));

  // ── 5. Transfer from alice to bob ────────────────────────────────────────
  console.log("\n" + "=".repeat(55));
  console.log("TRANSFER: alice → bob (250 MTK)");
  console.log("=".repeat(55));

  const amount2 = hre.ethers.parseUnits("250", 18);
  const tx2 = await token.connect(alice).transfer(bob.address, amount2);
  await tx2.wait();

  console.log("Transaction hash:", tx2.hash);
  console.log("Alice :", fmt(await token.balanceOf(alice.address)));
  console.log("Bob   :", fmt(await token.balanceOf(bob.address)));

  // ── 6. Approve + transferFrom ────────────────────────────────────────────
  // This simulates how a DEX works: owner approves bob to spend 500 MTK,
  // then bob calls transferFrom to move those tokens to himself.
  console.log("\n" + "=".repeat(55));
  console.log("APPROVE + TRANSFERFROM");
  console.log("=".repeat(55));

  const approveAmount = hre.ethers.parseUnits("500", 18);

  // Step A: owner approves bob to spend 500 MTK
  const txApprove = await token.approve(bob.address, approveAmount);
  await txApprove.wait();
  console.log("Owner approved bob to spend:", fmt(approveAmount));
  console.log(
    "Allowance (owner → bob):",
    fmt(await token.allowance(owner.address, bob.address))
  );

  // Step B: bob uses his allowance to move 500 MTK from owner to himself
  const txFrom = await token
    .connect(bob)
    .transferFrom(owner.address, bob.address, approveAmount);
  await txFrom.wait();
  console.log("Bob called transferFrom — moved 500 MTK from owner to himself");

  // ── 7. Final balances ────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(55));
  console.log("FINAL BALANCES");
  console.log("=".repeat(55));

  console.log("Owner :", fmt(await token.balanceOf(owner.address)));
  console.log("Alice :", fmt(await token.balanceOf(alice.address)));
  console.log("Bob   :", fmt(await token.balanceOf(bob.address)));
  console.log(
    "Remaining allowance (owner → bob):",
    fmt(await token.allowance(owner.address, bob.address))
  );

  // ── 8. Try a failing transaction ─────────────────────────────────────────
  console.log("\n" + "=".repeat(55));
  console.log("EXPECTED FAILURE: alice tries to send more than she has");
  console.log("=".repeat(55));

  try {
    await token.connect(alice).transfer(bob.address, hre.ethers.parseUnits("9999", 18));
  } catch (err) {
    console.log("Transaction reverted with:", err.message.split("\n")[0]);
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
