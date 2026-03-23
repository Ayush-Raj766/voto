import axios from "axios";

const ETHERSCAN_API_KEY =
  import.meta.env.VITE_ETHERSCAN_API_KEY || "YourApiKeyToken";

const SEPOLIA_API_URL = "https://api-sepolia.etherscan.io/api";

export interface EtherscanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

export const etherscanService = {
  // 🔥 Fetch BOTH normal + internal transactions
  async getFullAudit(address: string): Promise<EtherscanTransaction[]> {
    try {
      const [normalRes, internalRes] = await Promise.all([
        axios.get(SEPOLIA_API_URL, {
          params: {
            module: "account",
            action: "txlist",
            address,
            startblock: 0,
            endblock: 99999999,
            sort: "desc",
            apikey: ETHERSCAN_API_KEY,
          },
        }),
        axios.get(SEPOLIA_API_URL, {
          params: {
            module: "account",
            action: "txlistinternal",
            address,
            startblock: 0,
            endblock: 99999999,
            sort: "desc",
            apikey: ETHERSCAN_API_KEY,
          },
        }),
      ]);

      const normalTx = Array.isArray(normalRes.data.result) ? normalRes.data.result : [];
      const internalTx = Array.isArray(internalRes.data.result) ? internalRes.data.result : [];

      if (normalRes.data.status === "0" && normalRes.data.message !== "No transactions found") {
        console.warn("Etherscan API Normal TX Warning:", normalRes.data.result);
      }
      if (internalRes.data.status === "0" && internalRes.data.message !== "No transactions found") {
        console.warn("Etherscan API Internal TX Warning:", internalRes.data.result);
      }

      // Merge + sort like etherscan
      const merged = [...normalTx, ...internalTx].sort(
        (a, b) => Number(b.timeStamp) - Number(a.timeStamp)
      );

      return merged.slice(0, 20);
    } catch (error) {
      console.error("Etherscan fetch error:", error);
      return [];
    }
  },

  // ✅ Better action name formatting
  formatActionName(methodId: string, functionName: string): string {
    if (functionName && functionName !== "") {
      return functionName.split("(")[0];
    }

    if (methodId && methodId !== "0x") {
      return "Contract Call";
    }

    return "Transfer";
  },

  formatTimestamp(timestamp: string): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  },
};