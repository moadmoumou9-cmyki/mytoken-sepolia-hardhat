const hre = require("hardhat");

async function main() {
  // The deployer is the first account in config.networks[network].accounts
  const [deployer] = await hre.ethers.getSigners();

  console.log("Network  :", hre.network.name);
  console.log("Deployer :", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance  :", hre.ethers.formatEther(balance), "ETH");
  console.log("");

  // Deploy — pass deployer.address as the initialOwner required by Ownable
  console.log("Deploying MyToken...");
  const Token = await hre.ethers.getContractFactory("MyToken");
  const token = await Token.deploy(deployer.address);

  // On a real network, waitForDeployment() waits for the tx to be mined
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("MyToken deployed to:", tokenAddress);
  console.log("");

  // Read back some state to confirm everything is correct
  console.log("Name        :", await token.name());
  console.log("Symbol      :", await token.symbol());
  console.log("Total supply:", hre.ethers.formatUnits(await token.totalSupply(), 18), "MTK");
  console.log("Owner       :", await token.owner());
  console.log("");

  // Print the Etherscan verification command so you can run it right after
  console.log("To verify on Etherscan, run:");
  console.log(
    `  npx hardhat verify --network ${hre.network.name} ${tokenAddress} "${deployer.address}"`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
