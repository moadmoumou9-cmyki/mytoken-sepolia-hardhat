// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimpleToken {
    // --- State variables (stored permanently on the blockchain) ---

    string public name;        // e.g. "My Token"
    string public symbol;      // e.g. "MTK"
    uint8 public decimals;     // almost always 18, like ETH
    uint256 public totalSupply;

    // mapping(address => amount): tracks each address's balance
    mapping(address => uint256) public balanceOf;

    // mapping(owner => mapping(spender => amount)): tracks approvals
    // allows a spender to transfer tokens on behalf of the owner
    mapping(address => mapping(address => uint256)) public allowance;

    // --- Events (emitted so wallets/apps can react to changes) ---

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // --- Constructor (runs once at deployment) ---

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        decimals = 18;

        // Mint the entire supply to the deployer
        totalSupply = _initialSupply * (10 ** decimals);
        balanceOf[msg.sender] = totalSupply;

        emit Transfer(address(0), msg.sender, totalSupply);
    }

    // --- Core functions ---

    // Send tokens from your account to another address
    function transfer(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    // Approve another address to spend tokens on your behalf
    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "Cannot approve zero address");

        allowance[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // Transfer tokens on behalf of an owner (requires prior approval)
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Allowance exceeded");

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
        return true;
    }
}
