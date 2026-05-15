const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const INITIAL_SUPPLY = 1_000_000n; // 1 million tokens (before decimals)

async function deployTokenFixture() {
  const [owner, alice, bob] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("SimpleToken");
  const token = await Token.deploy("My Token", "MTK", INITIAL_SUPPLY);

  const decimals = await token.decimals();
  const totalSupply = INITIAL_SUPPLY * (10n ** BigInt(decimals));

  return { token, owner, alice, bob, totalSupply };
}

describe("SimpleToken", function () {

  describe("Deployment", function () {
    it("Should set the correct name, symbol and decimals", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal("My Token");
      expect(await token.symbol()).to.equal("MTK");
      expect(await token.decimals()).to.equal(18);
    });

    it("Should mint the entire supply to the deployer", async function () {
      const { token, owner, totalSupply } = await loadFixture(deployTokenFixture);
      expect(await token.totalSupply()).to.equal(totalSupply);
      expect(await token.balanceOf(owner.address)).to.equal(totalSupply);
    });

    it("Should emit a Transfer event from address(0) on deployment", async function () {
      const [owner] = await ethers.getSigners();
      const Token = await ethers.getContractFactory("SimpleToken");
      const token = await Token.deploy("My Token", "MTK", INITIAL_SUPPLY);
      await token.waitForDeployment();
      const deployTx = token.deploymentTransaction();
      await expect(deployTx).to.emit(token, "Transfer");
    });
  });

  describe("transfer()", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token, owner, alice, totalSupply } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", 18);

      await token.transfer(alice.address, amount);

      expect(await token.balanceOf(owner.address)).to.equal(totalSupply - amount);
      expect(await token.balanceOf(alice.address)).to.equal(amount);
    });

    it("Should emit a Transfer event", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("50", 18);

      await expect(token.transfer(alice.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, alice.address, amount);
    });

    it("Should revert if sender has insufficient balance", async function () {
      const { token, alice, bob } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("1", 18);

      // alice has no tokens — this should fail
      await expect(token.connect(alice).transfer(bob.address, amount))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should revert when transferring to the zero address", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      await expect(token.transfer(ethers.ZeroAddress, 1n))
        .to.be.revertedWith("Cannot transfer to zero address");
    });
  });

  describe("approve() and allowance", function () {
    it("Should set allowance correctly", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("200", 18);

      await token.approve(alice.address, amount);

      expect(await token.allowance(owner.address, alice.address)).to.equal(amount);
    });

    it("Should emit an Approval event", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("200", 18);

      await expect(token.approve(alice.address, amount))
        .to.emit(token, "Approval")
        .withArgs(owner.address, alice.address, amount);
    });

    it("Should revert when approving the zero address", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      await expect(token.approve(ethers.ZeroAddress, 1n))
        .to.be.revertedWith("Cannot approve zero address");
    });
  });

  describe("transferFrom()", function () {
    it("Should transfer tokens on behalf of another account", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("300", 18);

      // owner approves alice to spend 300 MTK
      await token.approve(alice.address, amount);

      // alice transfers 300 MTK from owner to bob
      await token.connect(alice).transferFrom(owner.address, bob.address, amount);

      expect(await token.balanceOf(bob.address)).to.equal(amount);
      expect(await token.allowance(owner.address, alice.address)).to.equal(0n);
    });

    it("Should revert if allowance is exceeded", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployTokenFixture);
      const approved = ethers.parseUnits("100", 18);
      const attempting = ethers.parseUnits("101", 18);

      await token.approve(alice.address, approved);

      await expect(token.connect(alice).transferFrom(owner.address, bob.address, attempting))
        .to.be.revertedWith("Allowance exceeded");
    });

    it("Should revert if owner has insufficient balance", async function () {
      const { token, alice, bob } = await loadFixture(deployTokenFixture);

      // approve alice to spend from bob, but bob has nothing
      await token.connect(bob).approve(alice.address, ethers.parseUnits("100", 18));

      await expect(
        token.connect(alice).transferFrom(bob.address, alice.address, ethers.parseUnits("100", 18))
      ).to.be.revertedWith("Insufficient balance");
    });
  });
});
