import { expect } from "chai";
import { AssetHolderETH } from "../typechain-types/contracts/AssetHolderETH"; // Adjust path as necessary
import { ethers } from "hardhat";

describe("AssetHolderETH", function () {
  let assetHolderETH: AssetHolderETH;
  let accounts: { address: string }[];
  let adjAddress: string; // Example variable for the adjudicator address

  before(async () => {
    accounts = await ethers.getSigners();
    adjAddress = accounts[1].address; // Assuming the adjudicator address is set to the second account for this example
  });

  // Helper function for deposit
  async function deposit(
    fid: string,
    amount: ethers.BigNumber,
    from: ethers.Signer,
  ) {
    const tx = await assetHolderETH
      .connect(from)
      .deposit(fid, amount, { value: amount });
    return tx.wait();
  }

  // Helper function for balanceOf
  async function balanceOf(who: string) {
    return ethers.utils.formatEther(await ethers.provider.getBalance(who));
  }

  // Deploy the contract
  beforeEach(async () => {
    const AssetHolderETH = await ethers.getContractFactory("AssetHolderETH");
    assetHolderETH = await AssetHolderETH.deploy(adjAddress);
    await assetHolderETH.waitForDeployment();
  });

  it("should deploy the AssetHolderETH contract", async () => {
    const adjAddr = await assetHolderETH.adjudicator();
    expect(adjAddr).to.equal(adjAddress);
  });

  // Placeholder for genericAssetHolderTest equivalent - Implement similar test logic
  describe("Generic Asset Holder Tests", function () {
    // Here you could implement tests specific to asset holder functionality
    it("should handle deposits correctly", async () => {
      const depositAmount = ethers.parseEther("1.0"); // 1 ETH
      const fid = "0x123";
      await deposit(fid, depositAmount, accounts[0]);

      const balance = await balanceOf(assetHolderETH.address);
      expect(balance).to.equal("1.0"); // Checking if 1 ether is deposited
    });
  });
});
