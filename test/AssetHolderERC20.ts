import { AssetHolderERC20 } from "../typechain-types/contracts/AssetHolderERC20";
import { PerunToken } from "../typechain-types/contracts/PerunToken";
import { expect } from "chai";
import { ethers } from "hardhat";
import { genericAssetHolderTest } from "./AssetHolder";
import {
  AssetHolderSetup,
  BalanceOfFn,
  DepositFn,
} from "./utils/AssetHolderSetup";

describe("AssetHolderERC20", function () {
  let token: PerunToken;
  let assetHolder: AssetHolderERC20;
  let setup: AssetHolderSetup;
  let adjAddress: string;

  before(async function () {
    const accounts = await ethers.getSigners();
    const addresses = await Promise.all(accounts.map((a) => a.getAddress()));
    adjAddress = await accounts[9].getAddress();

    const PerunTokenFactory = await ethers.getContractFactory("PerunToken");
    token = await PerunTokenFactory.deploy(accounts, ethers.parseEther("100"));
    await token.waitForDeployment();

    const perunTokenAddress = await token.getAddress();

    const AssetHolderERC20 =
      await ethers.getContractFactory("AssetHolderERC20");
    assetHolder = await AssetHolderERC20.deploy(adjAddress, perunTokenAddress);
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

      const assetHolderAddress = await assetHolder.getAddress();
      const approvalTransaction = await token
        .connect(sender)
        .approve(assetHolderAddress, amount, { from: fromAddress });
      await approvalTransaction.wait();

      return setup.ah.connect(sender).deposit(fid, amount, overrides);
    };

    const balanceOf: BalanceOfFn = async (who) => {
      return await token.balanceOf(who);
    };

    setup = new AssetHolderSetup(assetHolder, addresses, deposit, balanceOf);
  });

  it("should deploy the AssetHolderETH contract", async () => {
    const adjAddr = await assetHolder.adjudicator();
    expect(adjAddr).to.equal(adjAddress);
    expect(adjAddr).to.equal(setup.adj);
  });

  it("runs generic asset holder tests", async () => {
    genericAssetHolderTest("AssetHolderERC20", setup);
  });
});
