import { useState, useCallback, useEffect } from "react";
import { BrowserProvider } from "ethers";

const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111

interface WalletState {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string | null>;
  switchNetwork: () => Promise<void>;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      setIsCorrectNetwork(chainId === SEPOLIA_CHAIN_ID);
    } catch {
      setIsCorrectNetwork(false);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    checkNetwork();
    const handleChainChanged = () => checkNetwork();
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
      } else {
        setAddress(accounts[0]);
      }
    };
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [checkNetwork]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install MetaMask.");
      return null;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const addr = accounts[0];
      setAddress(addr);
      await checkNetwork();
      setIsConnecting(false);
      return addr;
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      setIsConnecting(false);
      return null;
    }
  }, [checkNetwork]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  const signMessage = useCallback(async (message: string) => {
    if (!window.ethereum || !address) return null;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return await signer.signMessage(message);
    } catch (err: any) {
      setError(err.message || "Failed to sign message");
      return null;
    }
  }, [address]);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: "Sepolia Testnet",
            nativeCurrency: { name: "SepoliaETH", symbol: "SEP", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }],
        });
      }
    }
  }, []);

  return {
    address,
    isConnecting,
    isConnected: !!address,
    isCorrectNetwork,
    error,
    connect,
    disconnect,
    signMessage,
    switchNetwork,
  };
}
