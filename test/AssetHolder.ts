import { expect } from "chai";
import { ethers } from "hardhat";
import { fundingID, sign } from "./utils/lib";
import { Authorization } from "./Channel";
import { AssetHolderSetup } from "./utils/AssetHolderSetup";

// Helper functions
const ether = (n: number) => ethers.parseEther(n.toString());
const wei2eth = (wei: bigint) => ethers.formatEther(wei);

// Begin test suite
export function genericAssetHolderTest(
  testSuiteName: string,
  setup: AssetHolderSetup,
) {
  const finalBalance = [ether(20), ether(10)];

  async function assertHoldings(fid: string, amount: bigint) {
    const c = await setup.ah.holdings(fid);

    expect(amount).to.equal(
      c,
      `Expected holdings to be ${wei2eth(amount)} but found ${wei2eth(c)}`,
    );
  }

  async function testDeposit(idx: number, amount: bigint, cid: string) {
    const fid = fundingID(cid, setup.parts[idx]);
    const oldBal = await setup.ah.holdings(fid);

    await expect(setup.deposit(fid, amount, { from: setup.recv[idx] }))
      .to.emit(setup.ah, "Deposited")
      .withArgs(fid, amount);

    await assertHoldings(fid, oldBal + amount);
  }

  async function testWithdraw(idx: number, amount: bigint, cid: string) {
    const fid = fundingID(cid, setup.parts[idx]);
    let balanceBefore = await setup.balanceOf(setup.recv[idx]);
    let authorization = new Authorization(
      cid,
      setup.parts[idx],
      setup.recv[idx],
      amount,
    );
    let signature = await sign(authorization.encode(), setup.parts[idx]);
    const signer = await ethers.getSigner(setup.txSender);
    await expect(
      setup.ah.connect(signer).withdraw(authorization, signature, {
        from: setup.txSender,
      }),
    )
      .to.emit(setup.ah, "Withdrawn")
      .withArgs(fid, amount, setup.recv[idx]);

    let balanceAfter = await setup.balanceOf(setup.recv[idx]);
    expect(balanceAfter).to.equal(balanceBefore + amount);
  }

  describe(`${testSuiteName} generic asset holder tests`, async function () {
    describe("Funding...", function () {
      it("A deposits eth", async function () {
        await testDeposit(setup.A, ether(9), setup.channelID);
      });

      it("B deposits eth", async function () {
        await testDeposit(setup.B, ether(20), setup.channelID);
      });

      it("wrong msg.value", async function () {
        let id = fundingID(setup.channelID, setup.parts[setup.A]);
        await expect(
          setup.ah.deposit(id, ether(2), {
            value: ether(1),
          }),
        ).to.be.reverted;
        await assertHoldings(id, ether(9));
      });

      it("A deposits eth", async function () {
        await testDeposit(setup.A, ether(1), setup.channelID);
      });
    });

    describe("Invalid withdraw", () => {
      it("unsettled channel should fail", async () => {
        expect(finalBalance.length).to.equal(setup.parts.length);
        expect(await setup.ah.settled(setup.channelID)).to.be.false;

        let authorization = new Authorization(
          setup.channelID,
          setup.parts[setup.A],
          setup.recv[setup.A],
          finalBalance[setup.A].toString(),
        );
        let signature = await sign(
          authorization.encode(),
          setup.parts[setup.A],
        );
        const signer = await ethers.getSigner(setup.txSender);
        await expect(
          setup.ah
            .connect(signer)
            .withdraw(authorization, signature, { from: setup.txSender }),
        ).to.be.reverted;
      });
    });

    describe("Setting outcome", () => {
      it("wrong parts length", async () => {
        const wrongParts = [setup.parts[setup.A]];
        const signer = await ethers.getSigner(setup.adj);
        await expect(
          setup.ah
            .connect(signer)
            .setOutcome(setup.channelID, wrongParts, finalBalance, {
              from: setup.adj,
            }),
        ).to.be.reverted;
      });

      it("wrong balances length", async () => {
        const wrongBals = [ether(1)];
        const signer = await ethers.getSigner(setup.adj);
        await expect(
          setup.ah
            .connect(signer)
            .setOutcome(setup.channelID, setup.parts, wrongBals, {
              from: setup.adj,
            }),
        ).to.be.reverted;
      });

      it("wrong sender", async () => {
        const signer = await ethers.getSigner(setup.txSender);
        await expect(
          setup.ah
            .connect(signer)
            .setOutcome(setup.channelID, setup.parts, finalBalance, {
              from: setup.txSender,
            }),
        ).to.be.revertedWith("can only be called by the adjudicator");
      });

      it("correct sender", async () => {
        const signer = await ethers.getSigner(setup.adj);
        await expect(
          setup.ah
            .connect(signer)
            .setOutcome(setup.channelID, setup.parts, finalBalance, {
              from: setup.adj,
            }),
        )
          .to.emit(setup.ah, "OutcomeSet")
          .withArgs(setup.channelID);

        expect(await setup.ah.connect(signer).settled(setup.channelID)).to.be
          .true;

        for (var i = 0; i < setup.parts.length; i++) {
          let id = fundingID(setup.channelID, setup.parts[i]);
          await assertHoldings(id, finalBalance[i]);
        }
      });

      it("correct sender (twice)", async () => {
        const signer = await ethers.getSigner(setup.adj);
        await expect(
          setup.ah
            .connect(signer)
            .setOutcome(setup.channelID, setup.parts, finalBalance, {
              from: setup.adj,
            }),
        ).to.be.revertedWith("trying to set already settled channel");
      });
    });

    describe("Invalid withdrawals", () => {
      it("withdraw with invalid signature", async () => {
        let authorization = new Authorization(
          setup.channelID,
          setup.parts[setup.A],
          setup.parts[setup.B],
          finalBalance[setup.A].toString(),
        );
        let signature = await sign(
          authorization.encode(),
          setup.parts[setup.B],
        );
        const signer = await ethers.getSigner(setup.txSender);
        await expect(
          setup.ah
            .connect(signer)
            .withdraw(authorization, signature, { from: setup.txSender }),
        ).to.be.reverted;
      });

      it("invalid balance", async () => {
        let authorization = new Authorization(
          setup.channelID,
          setup.parts[setup.A],
          setup.parts[setup.B],
          ether(30).toString(),
        );
        let signature = await sign(
          authorization.encode(),
          setup.parts[setup.A],
        );
        const signer = await ethers.getSigner(setup.txSender);
        await expect(
          setup.ah
            .connect(signer)
            .withdraw(authorization, signature, { from: setup.txSender }),
        ).to.be.reverted;
      });
    });

    describe("Withdraw", () => {
      it("A withdraws with valid allowance", async () => {
        await testWithdraw(setup.A, finalBalance[setup.A], setup.channelID);
      });

      it("B withdraws with valid allowance", async () => {
        await testWithdraw(setup.B, finalBalance[setup.B], setup.channelID);
      });

      it("A fails to overdraw with valid allowance", async () => {
        let authorization = new Authorization(
          setup.channelID,
          setup.parts[setup.A],
          setup.recv[setup.A],
          finalBalance[setup.A].toString(),
        );
        let signature = await sign(
          authorization.encode(),
          setup.parts[setup.A],
        );
        const signer = await ethers.getSigner(setup.txSender);
        await expect(
          setup.ah
            .connect(signer)
            .withdraw(authorization, signature, { from: setup.txSender }),
        ).to.be.reverted;
      });
    });

    describe("Test underfunded channel", () => {
      let channelID: string;

      it("initialize", () => {
        channelID = setup.unfundedChannelID;
      });

      it("A deposits eth", async () => {
        await testDeposit(setup.A, ether(1), channelID);
      });

      it("set outcome of the asset holder with deposit refusal", async () => {
        expect(await setup.ah.settled(channelID)).to.be.false;

        const signer = await ethers.getSigner(setup.adj);
        await expect(
          setup.ah
            .connect(signer)
            .setOutcome(channelID, setup.parts, finalBalance, {
              from: setup.adj,
            }),
        )
          .to.emit(setup.ah, "OutcomeSet")
          .withArgs(channelID);

        expect(await setup.ah.settled(channelID)).to.be.true;

        let id = fundingID(channelID, setup.parts[setup.A]);
        await assertHoldings(id, ether(1));
      });

      it("A fails to withdraw 2 eth after B's deposit refusal", async () => {
        let authorization = new Authorization(
          channelID,
          setup.parts[setup.A],
          setup.recv[setup.A],
          ether(2).toString(),
        );
        let signature = await sign(
          authorization.encode(),
          setup.parts[setup.A],
        );
        const signer = await ethers.getSigner(setup.txSender);
        await expect(
          setup.ah
            .connect(signer)
            .withdraw(authorization, signature, { from: setup.txSender }),
        ).to.be.reverted;
      });

      it("A withdraws 1 ETH", async () => {
        await testWithdraw(setup.A, ether(1), channelID);
      });
    });
  });
}
