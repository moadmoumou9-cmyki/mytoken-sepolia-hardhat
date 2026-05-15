// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ERC20      → gives us the full standard token implementation
// ERC20Burnable → adds burn() and burnFrom() on top of ERC20
// Ownable    → tracks an owner address and provides the onlyOwner modifier
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// "is ERC20, ERC20Burnable, Ownable" = inheritance
// MyToken automatically has EVERY function those three contracts define
// We only need to write what's NEW or DIFFERENT
contract MyToken is ERC20, ERC20Burnable, Ownable {

    // ERC20's constructor needs (name, symbol)
    // Ownable's constructor needs the initial owner address
    // We pass both by calling them inside our constructor's header
    constructor(address initialOwner)
        ERC20("My Token", "MTK")
        Ownable(initialOwner)
    {
        // Mint 1,000,000 tokens to the deployer at launch
        // _mint() is an internal OZ function — it handles balances + totalSupply + event
        // 1_000_000 * 10**decimals() = 1,000,000 * 10^18 raw units
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    // onlyOwner is a modifier from Ownable
    // It adds: require(msg.sender == owner(), "Ownable: caller is not the owner")
    // Only the owner can create new tokens — useful for controlled supply
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // burn() and burnFrom() are already provided by ERC20Burnable
    // Any holder can burn their own tokens:  token.burn(amount)
    // With approval:                         token.burnFrom(from, amount)
    // No extra code needed here
}
