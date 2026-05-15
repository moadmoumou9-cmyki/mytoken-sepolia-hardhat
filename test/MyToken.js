const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const INITIAL_SUPPLY = ethers.parseUnits("1000000", 18); // 1 million MTK

async function deployTokenFixture() {
  const [owner, alice, bob] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("MyToken");
  // Pass owner.address as the initialOwner (Ownable requires this in OZ v5)
  const token = await Token.deploy(owner.address);

  return { token, owner, alice, bob };
}

describe("MyToken", function () {

  // ── Deployment ─────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("Should have the correct name and symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal("My Token");
      expect(await token.symbol()).to.equal("MTK");
    });

    it("Should have 18 decimals", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.decimals()).to.equal(18);
    });

    it("Should mint the initial supply to the owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should set the correct owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      // owner() is provided by Ownable
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  // ── Inherited ERC20 behaviour ──────────────────────────────────────────
  // These functions come from OZ — we test them to confirm inheritance works
  describe("ERC20 (inherited)", function () {
    it("Should transfer tokens correctly", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("500", 18);
      await token.transfer(alice.address, amount);
      expect(await token.balanceOf(alice.address)).to.equal(amount);
    });

    it("Should approve and transferFrom correctly", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("200", 18);
      await token.approve(alice.address, amount);
      await token.connect(alice).transferFrom(owner.address, bob.address, amount);
      expect(await token.balanceOf(bob.address)).to.equal(amount);
    });

    it("Should revert transfer if balance is insufficient", async function () {
      const { token, alice, bob } = await loadFixture(deployTokenFixture);
      // OZ error format in v5 uses custom errors, not require strings
      await expect(
        token.connect(alice).transfer(bob.address, ethers.parseUnits("1", 18))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should revert transferFrom if allowance is insufficient", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployTokenFixture);
      await expect(
        token.connect(alice).transferFrom(owner.address, bob.address, ethers.parseUnits("1", 18))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });

  // ── mint() — new function, restricted to owner ─────────────────────────
  describe("mint()", function () {
    it("Should let the owner mint new tokens", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseUnits("5000", 18);

      await token.mint(alice.address, mintAmount);

      expect(await token.balanceOf(alice.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY + mintAmount);
    });

    it("Should revert if a non-owner tries to mint", async function () {
      const { token, alice, bob } = await loadFixture(deployTokenFixture);
      await expect(
        token.connect(alice).mint(bob.address, ethers.parseUnits("1", 18))
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  // ── burn() — from ERC20Burnable ────────────────────────────────────────
  describe("burn()", function () {
    it("Should let any holder burn their own tokens", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const burnAmount = ethers.parseUnits("10000", 18);

      await token.burn(burnAmount);

      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - burnAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - burnAmount);
    });

    it("Should revert if trying to burn more than balance", async function () {
      const { token, alice } = await loadFixture(deployTokenFixture);
      await expect(
        token.connect(alice).burn(ethers.parseUnits("1", 18))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should let a spender burn via burnFrom after approval", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const burnAmount = ethers.parseUnits("1000", 18);

      await token.approve(alice.address, burnAmount);
      await token.connect(alice).burnFrom(owner.address, burnAmount);

      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - burnAmount);
      expect(await token.allowance(owner.address, alice.address)).to.equal(0n);
    });
  });

  // ── Ownable — transferOwnership ────────────────────────────────────────
  describe("Ownable", function () {
    it("Should let the owner transfer ownership", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);

      await token.transferOwnership(alice.address);

      expect(await token.owner()).to.equal(alice.address);
    });

    it("Should block the old owner from minting after transfer", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);

      await token.transferOwnership(alice.address);

      await expect(
        token.connect(owner).mint(owner.address, ethers.parseUnits("1", 18))
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });
});
