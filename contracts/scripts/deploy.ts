import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

/**
 * Deployment script for CarbonCreditToken
 *
 * Post-deployment steps:
 *  1. Grants ADMIN_ROLE to the backend wallet
 *  2. Grants VALIDATOR_ROLE to the backend wallet (so backend can call approveProject)
 *  3. Grants FIELD_OFFICER_ROLE to the backend wallet (so backend can call anchorSubmission)
 *  4. Exports ABI + contract address to backend/src/config/contract-config.json
 *     so BlockchainService can load them without hard-coding.
 */
async function main() {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Blue Carbon Credit Token — Deployment");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const [deployer] = await ethers.getSigners();
    console.log(`\n  Deployer:  ${deployer.address}`);
    console.log(
        `  Balance:   ${ethers.formatEther(
            await ethers.provider.getBalance(deployer.address)
        )} ETH`
    );

    // ── Deploy ──────────────────────────────────────────────
    console.log("\n  Deploying CarbonCreditToken...");
    const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
    const token = await CarbonCreditToken.deploy();
    await token.waitForDeployment();

    const contractAddress = await token.getAddress();
    console.log(`  ✅ Deployed at: ${contractAddress}`);

    // ── Role constants ──────────────────────────────────────
    const ADMIN_ROLE: string = await (token as any).ADMIN_ROLE();
    const VALIDATOR_ROLE: string = await (token as any).VALIDATOR_ROLE();
    const FIELD_OFFICER_ROLE: string = await (token as any).FIELD_OFFICER_ROLE();

    // ── Grant roles to the backend wallet ───────────────────
    // BACKEND_WALLET is the address derived from PRIVATE_KEY used by blockchain.service.ts.
    // It needs ALL roles because the backend signs every lifecycle transaction with one key.
    const backendWallet = process.env.BACKEND_WALLET || process.env.ADMIN_ADDRESS;

    if (!backendWallet) {
        console.warn(
            "  ⚠️  BACKEND_WALLET env var not set — skipping role grants.\n" +
            "     Set BACKEND_WALLET=<address derived from PRIVATE_KEY> and re-run."
        );
    } else if (backendWallet.toLowerCase() !== deployer.address.toLowerCase()) {
        // Grant ADMIN_ROLE (covers mintCredits, registerProject, anchorSubmission, approveProject)
        let tx = await (token as any).grantRole(ADMIN_ROLE, backendWallet);
        await tx.wait();
        console.log(`  ✅ ADMIN_ROLE        → ${backendWallet}`);

        // Grant VALIDATOR_ROLE (future: validator signs own transactions)
        tx = await (token as any).grantRole(VALIDATOR_ROLE, backendWallet);
        await tx.wait();
        console.log(`  ✅ VALIDATOR_ROLE    → ${backendWallet}`);

        // Grant FIELD_OFFICER_ROLE (future: field officer signs own transactions)
        tx = await (token as any).grantRole(FIELD_OFFICER_ROLE, backendWallet);
        await tx.wait();
        console.log(`  ✅ FIELD_OFFICER_ROLE→ ${backendWallet}`);
    } else {
        // Deployer IS the backend wallet — already has all roles via constructor
        console.log("  ℹ️  Deployer == backend wallet → roles already granted via constructor");
    }

    // ── Export ABI + address ────────────────────────────────
    // Read the compiled artifact to extract the ABI
    const artifactPath = path.join(
        __dirname,
        "..",
        "artifacts",
        "contracts",
        "CarbonCreditToken.sol",
        "CarbonCreditToken.json"
    );

    if (!fs.existsSync(artifactPath)) {
        console.error(
            "  ❌ Artifact not found at:", artifactPath,
            "\n     Run `npx hardhat compile` before deploying."
        );
        process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const contractConfig = {
        address: contractAddress,
        network: (await ethers.provider.getNetwork()).name,
        chainId: Number((await ethers.provider.getNetwork()).chainId),
        deployedAt: new Date().toISOString(),
        abi: artifact.abi,
    };

    // Write to backend config directory (relative to scripts/ folder)
    const outputPath = path.join(
        __dirname,
        "..",           // contracts/
        "..",           // project root
        "backend",
        "src",
        "config",
        "contract-config.json"
    );

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(contractConfig, null, 2), "utf8");
    console.log(`\n  ✅ contract-config.json written to:\n     ${outputPath}`);

    // ── Summary ─────────────────────────────────────────────
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Deployment Summary");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Contract:  ${contractAddress}`);
    console.log(`  Token:     Blue Carbon Credit (BCC)`);
    console.log(`  Network:   ${(await ethers.provider.getNetwork()).name}`);
    console.log(`  Chain ID:  ${(await ethers.provider.getNetwork()).chainId}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log("\n  📋 Next steps:");
    console.log(`     1. Copy CONTRACT_ADDRESS=${contractAddress} to backend/.env`);
    console.log(`     2. Ensure PRIVATE_KEY matches the deployer / backendWallet`);
    console.log(`     3. To verify on Etherscan:`);
    console.log(`        npx hardhat verify --network sepolia ${contractAddress}`);
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
