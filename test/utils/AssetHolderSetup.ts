import { TransactionResponse } from "ethers";
import { randomHex } from "./lib";
import { AssetHolderETH } from "../../typechain-types";
import { PayableOverrides } from "../../typechain-types/common";

type AssetHolder = AssetHolderETH;

export type DepositFn = (
  fid: string,
  amount: bigint,
  overrides: PayableOverrides,
) => Promise<TransactionResponse>;

export type BalanceOfFn = (who: string) => Promise<bigint>;

// AssetHolderSetup is the setup for `genericAssetHolderTest`.
export class AssetHolderSetup {
  channelID: string;
  unfundedChannelID: string;
  txSender: string;
  adj: string;
  recv: string[];
  parts: string[];
  A = 0;
  B = 1;
  accounts: string[];
  ah: AssetHolder;
  deposit: DepositFn;
  balanceOf: BalanceOfFn;
  /**
   * Index of the Adjudicator address in the `accounts` array.
   */

  constructor(
    ah: any,
    accounts: string[],
    deposit: DepositFn,
    balanceOf: BalanceOfFn,
  ) {
    this.channelID = randomHex(32);
    this.unfundedChannelID = randomHex(32);
    this.txSender = accounts[5];
    this.adj = accounts[9];
    this.parts = [accounts[1], accounts[2]];
    this.recv = [accounts[3], accounts[4]];
    this.accounts = accounts;
    this.ah = ah;
    this.deposit = deposit;
    this.balanceOf = balanceOf;
  }
}
