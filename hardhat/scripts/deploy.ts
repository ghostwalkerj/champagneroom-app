import { ethers } from "hardhat";
import { writeFileSync } from "fs";

async function main() {
  const PCallEscrow = await ethers.getContractFactory("pCallEscrow");
  const pCallEscrow = await PCallEscrow.deploy(10);

  await pCallEscrow.deployed();

  console.log("pCallEscrow deployed to:", pCallEscrow.address);

  writeFileSync(
    "./config.ts",
    `export const pCallEscrowAddress = "${pCallEscrow.address}";
    export const pCallEscrowOwner = "${pCallEscrow.deployTransaction.from}";

  `
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
