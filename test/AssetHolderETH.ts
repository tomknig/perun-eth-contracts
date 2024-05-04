import { expect } from "chai";
import { ethers } from "hardhat";
import { AssetHolderETH } from "../typechain-types/contracts/AssetHolderETH";
import { genericAssetHolderTest } from "./AssetHolder";
import {
  AssetHolderSetup,
  BalanceOfFn,
  DepositFn,
} from "./utils/AssetHolderSetup";

describe("AssetHolderETH", async () => {
  let assetHolder: AssetHolderETH;
  let setup: AssetHolderSetup;
  let adjAddress: string;

  before(async function () {
    const accounts = await ethers.getSigners();
    const addresses = await Promise.all(accounts.map((a) => a.getAddress()));
    adjAddress = await accounts[9].getAddress();

    const AssetHolderETH = await ethers.getContractFactory("AssetHolderETH");
    assetHolder = await AssetHolderETH.deploy(adjAddress);
    await assetHolder.waitForDeployment();

    const deposit: DepositFn = async (fid, amount, overrides) => {
      let fromAddress: string;

      if (typeof overrides.from === "string") {
        fromAddress = overrides.from;
      } else if (overrides.from instanceof Promise) {
        fromAddress = await overrides.from;
        fromAddress = await overrides.from;
      } else if (overrides.from) {
        fromAddress = await overrides.from.getAddress();
      } else {
        return Promise.reject("No from address provided");
      }

      const sender = await ethers.getSigner(fromAddress);
      return setup.ah
        .connect(sender)
        .deposit(fid, amount, { value: amount, ...overrides });
    };

    const balanceOf: BalanceOfFn = async (who) => {
      return await ethers.provider.getBalance(who);
    };

    setup = new AssetHolderSetup(assetHolder, addresses, deposit, balanceOf);
  });

  it("should deploy the AssetHolderETH contract", async () => {
    const adjAddr = await assetHolder.adjudicator();
    expect(adjAddr).to.equal(adjAddress);
    expect(adjAddr).to.equal(setup.adj);
  });

  it("runs generic asset holder tests", async () => {
    genericAssetHolderTest("AssetHolderETH", setup);
  });
});
