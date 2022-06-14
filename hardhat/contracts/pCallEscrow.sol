//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/escrow/Escrow.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract pCallEscrow is Escrow {
    uint256 internal markup = 0;

    constructor(uint256 _markup) {
        console.log("Deploying a pCallEscrow with a markup of: ", _markup);
        markup = _markup;
    }

    function setMarkup(uint256 _markup) public onlyOwner {
        markup = _markup;
    }

    function getMarkup() public view onlyOwner returns (uint256) {
        return markup;
    }
}
