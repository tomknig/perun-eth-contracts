// Copyright 2020 - See NOTICE file for copyright holders.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { ethers as hre } from "hardhat";
import * as ethers from "ethers";

/*
const sign = async (message: string, signerAddress: string) => {
  const signer = await ethers.getSigner(signerAddress);
  return signer.signMessage(ethers.toBeArray(message));
};
 */
export async function sign(data: string, signerAddress: string) {
  const signer = await hre.getSigner(signerAddress);
  const message = ethers.keccak256(data);
  const sig = await signer.signMessage(ethers.toBeArray(message));

  // Update v value (add 27), if not done by web3.
  let v = parseInt(sig.slice(130, 132), 16);
  if (v < 27) {
    v += 27;
  }
  return sig.slice(0, 130) + v.toString(16);
}
/*
export function ether(x: number): BN {
  return web3.utils.toWei(web3.utils.toBN(x), "ether");
}

export function wei2eth(x: BN): BN {
  return web3.utils.toBN(web3.utils.fromWei(x.toString(), "ether"));
}
*/

export function hash(data: ethers.BytesLike): string {
  return ethers.keccak256(data);
}

export function randomHex(size: number = 32): string {
  return hash(ethers.randomBytes(size));
}

export function fundingID(channelID: string, participant: string): string {
  const abiCoder = new ethers.AbiCoder();
  return hash(
    abiCoder.encode(
      ["bytes32", "address"],
      [ethers.zeroPadBytes(channelID, 32), participant],
    ),
  );
}

// describe test suite followed by blockchain revert
export function describeWithBlockRevert(name: string, tests: any) {
  describe(name, () => {
    let snapshotId: number;

    before(async () => {
      snapshotId = await hre.provider.send("evm_snapshot");
    });

    after(async () => {
      await hre.provider.send("evm_revert", [snapshotId]);
    });

    tests();
  });
}

/*
export async function asyncWeb3Send(
  method: string,
  params: any[],
  id?: number,
): Promise<any> {
  let req: any = { jsonrpc: "2.0", method: method, params: params };
  if (id != undefined) req.id = id;

  return promisify((callback) => {
    (web3.currentProvider as any).send(req, callback);
  })();
}

export async function currentTimestamp(): Promise<number> {
  let blocknumber = await web3.eth.getBlockNumber();
  let block = await web3.eth.getBlock(blocknumber);
  return block.timestamp as number;
}

export async function getChainID(): Promise<number> {
  return await web3.eth.getChainId();
}

export function sleep(milliseconds: any) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export async function advanceBlockTime(time: number): Promise<any> {
  await asyncWeb3Send('evm_increaseTime', [time]);
  return asyncWeb3Send('evm_mine', []);
}

// it test followed by blockchain revert
export function itWithBlockRevert(name: string, test: any) {
  it(name, async () => {
    let snapshot_id = (await asyncWeb3Send('evm_snapshot', [])).result;
    await test();
    await asyncWeb3Send('evm_revert', [snapshot_id]);
  });
}
*/
