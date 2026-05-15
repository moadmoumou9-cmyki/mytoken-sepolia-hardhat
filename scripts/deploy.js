const hre = require("hardhat");

async function main() {
  const unlockTime = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
  const lockedAmount = hre.ethers.parseEther("0.001");

  const lock = await hre.ethers.deployContract("Lock", [unlockTime], {
    value: lockedAmount,
  });

  await lock.waitForDeployment();

  console.log(`Lock deployed to: ${await lock.getAddress()}`);
  console.log(`Unlock time: ${new Date(unlockTime * 1000).toISOString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
