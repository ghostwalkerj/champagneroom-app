//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract pCall is Ownable {
    enum MarkupType {
        PERCENTAGE,
        FIXED
    }
    uint256 internal markupAmount = 0;
    MarkupType internal markupType = MarkupType.PERCENTAGE;
    address internal escrowContract;

    constructor(
        MarkupType _markupType,
        uint256 _markupAmount,
        address _escrowContract
    ) {
        console.log("Deploying a pcall with: ", _markupAmount);
        markupType = _markupType;
        markupAmount = _markupAmount;
        escrowContract = _escrowContract;
    }

    function setMarkup(MarkupType _markupType, uint256 _markupAmount)
        public
        onlyOwner
    {
        markupType = _markupType;
        markupAmount = _markupAmount;
    }

    function setEscrowContract(address _escrowContract) public onlyOwner {
        escrowContract = _escrowContract;
    }

    function getMarkup() public view onlyOwner returns (MarkupType, uint256) {
        return (markupType, markupAmount);
    }
}
