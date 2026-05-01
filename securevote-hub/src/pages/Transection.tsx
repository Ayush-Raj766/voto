import { useEffect, useState } from "react";
import { ethers } from "ethers";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import abi from "../abi/Voting.json";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const RPC_URL = import.meta.env.VITE_RPC_URL;
const API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;

const Transactions = () => {
  const [txData, setTxData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTx() {
      try {
        const res = await fetch(
          `https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${API_KEY}`
        );

        const data = await res.json();

        if (data.status !== "1" || !Array.isArray(data.result)) {
          console.error("Etherscan API error:", data.message, data.result);
          setTxData([]);
          return;
        }

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const iface = new ethers.Interface(abi.abi);

        const formatted = data.result.map((tx: any) => {
          let method = "Transfer";

          try {
            const decoded = iface.parseTransaction({
              data: tx.input,
            });
            method = decoded?.name || "Unknown";
          } catch {}

          return {
            hash: tx.hash,
            method,
            block: tx.blockNumber,
            from: tx.from,
            to: tx.to,
            time: new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
            gas: ethers.formatEther(
              BigInt(tx.gasUsed) * BigInt(tx.gasPrice)
            ),
          };
        });

        setTxData(formatted);
      } catch (err) {
        console.error("Error fetching tx:", err);
      }
    }

    fetchTx();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Blockchain Audit Trail</h1>

      <Card>
        <CardHeader>
          <CardTitle>Contract Transactions</CardTitle>
        </CardHeader>

        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tx Hash</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Gas Fee</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {txData.map((tx) => (
                <TableRow key={tx.hash}>
                  <TableCell className="font-mono text-xs text-blue-500">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {tx.hash.slice(0, 12)}...
                    </a>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">
                      {formatMethod(tx.method)}
                    </Badge>
                  </TableCell>

                  <TableCell>{tx.block}</TableCell>

                  <TableCell className="font-mono text-xs">
                    {short(tx.from)}
                  </TableCell>

                  <TableCell className="font-mono text-xs">
                    {short(tx.to)}
                  </TableCell>

                  <TableCell className="text-xs">{tx.time}</TableCell>

                  <TableCell className="text-xs">
                    {tx.gas} ETH
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// helpers
function short(addr: string) {
  if (!addr) return "-";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function formatMethod(method: string) {
  const map: any = {
    addSubAdmin: "Add Sub Admin",
    removeSubAdmin: "Remove Sub Admin",
    registerVoter: "Voter Registration",
    verifyVoter: "Voter Verification",
    createElection: "Create Election",
    addCandidate: "Add Candidate",
    startElection: "Start Election",
    endElection: "End Election",
    vote: "Vote Cast",
    Unknown: "Login Failed",
  };

  return map[method] || method;
}

export default Transactions;