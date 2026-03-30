import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Blue Carbon Credit Token — Deployment");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const [deployer] = await ethers.getSigners();
    console.log(`\n  Deployer:  ${deployer.address}`);
    console.log(`  Balance:   ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

    // Deploy the contract
    console.log("\n  Deploying CarbonCreditToken...");
    const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
    const token = await CarbonCreditToken.deploy();
    await token.waitForDeployment();

    const contractAddress = await token.getAddress();
    console.log(`  ✅ Deployed at: ${contractAddress}`);

    // Grant ADMIN_ROLE to a separate admin address if provided
    const adminAddress = process.env.ADMIN_ADDRESS;
    if (adminAddress && adminAddress !== deployer.address) {
        const ADMIN_ROLE = await token.ADMIN_ROLE();
        const tx = await token.grantRole(ADMIN_ROLE, adminAddress);
        await tx.wait();
        console.log(`  ✅ ADMIN_ROLE granted to: ${adminAddress}`);
    }

    // Log deployment summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Deployment Summary");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Contract:  ${contractAddress}`);
    console.log(`  Token:     Blue Carbon Credit (BCC)`);
    console.log(`  Network:   ${(await ethers.provider.getNetwork()).name}`);
    console.log(`  Chain ID:  ${(await ethers.provider.getNetwork()).chainId}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Etherscan verification instructions
    console.log("\n  📋 To verify on Etherscan:");
    console.log(`  npx hardhat verify --network sepolia ${contractAddress}`);
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
