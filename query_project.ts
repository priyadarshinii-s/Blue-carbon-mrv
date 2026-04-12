import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const projectId = "NCCR-2026-4160";
  const config = JSON.parse(fs.readFileSync("../backend/src/config/contract-config.json", "utf8"));
  const contract = await ethers.getContractAt("CarbonCreditToken", config.address);
  
  console.log(`Searching events for: ${projectId}...`);
  const filter = contract.filters.ProjectStatusUpdated(ethers.id(projectId));
  const logs = await contract.queryFilter(filter, 0, "latest");
  
  console.log(`Found ${logs.length} status updates.`);
  logs.forEach((log: any) => {
    console.log("-----------------------------------------");
    console.log(`Tx: ${log.transactionHash}`);
    console.log(`Status: ${log.args.previousStatus} -> ${log.args.newStatus}`);
  });
}

main().catch(console.error);
