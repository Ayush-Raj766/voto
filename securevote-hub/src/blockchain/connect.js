import { ethers } from "ethers";

export const connectWallet = async () => {

  const provider =
    new ethers.BrowserProvider(window.ethereum);

  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();

  return signer;
};