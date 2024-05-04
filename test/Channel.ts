import * as ethers from "ethers";

export class Authorization {
  channelID: ethers.BytesLike;
  participant: ethers.AddressLike;
  receiver: ethers.AddressLike;
  amount: ethers.BigNumberish;

  constructor(
    _channelID: ethers.BytesLike,
    _participant: ethers.AddressLike,
    _receiver: ethers.AddressLike,
    _amount: ethers.BigNumberish,
  ) {
    this.channelID = _channelID;
    this.participant = _participant;
    this.receiver = _receiver;
    this.amount = _amount;
  }

  serialize() {
    return {
      channelID: this.channelID,
      participant: this.participant,
      receiver: this.receiver,
      amount: this.amount,
    };
  }

  encode() {
    const abiCoder = new ethers.AbiCoder();
    return abiCoder.encode(
      ["bytes32", "address", "address", "uint256"],
      [
        ethers.zeroPadBytes(this.channelID, 32),
        this.participant,
        this.receiver,
        this.amount,
      ],
    );
  }
}
