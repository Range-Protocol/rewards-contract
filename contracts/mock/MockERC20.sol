// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.16;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20, ERC20Detailed {
    constructor(
        string memory _name,
        string memory _symbol
    ) public ERC20Detailed (
        _name,
        _symbol,
        18
    ) {}

    function mint() external {
        _mint(msg.sender, 10_000_000 * 10 ** uint256(decimals()));
    }
}
