import { useEffect, useState } from "react";
import { contractService, Election } from "@/services/contractService";
import {
  etherscanService,
  EtherscanTransaction,
} from "@/services/etherscanService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  Eye,
  ExternalLink,
  CheckCircle2,
  BarChart3,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "hsl(263, 70%, 58%)",
  "hsl(190, 95%, 45%)",
  "hsl(142, 76%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
];

export default function TransparencyPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [transactions, setTransactions] = useState<EtherscanTransaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

  useEffect(() => {
    const loadData = async () => {
      try {
        const els = await contractService.getElections();

        const updatedElections = await Promise.all(
          els.map(async (election) => {
            if (!election.blockchainId) return election;

            const updatedCandidates = await Promise.all(
              election.candidates.map(async (c) => {
                const votes = await contractService.getCandidateVotes(
                  election.blockchainId!,
                  c.id
                );

                return { ...c, votes };
              })
            );

            const totalVotes = updatedCandidates.reduce(
              (sum, c) => sum + c.votes,
              0
            );

            return {
              ...election,
              candidates: updatedCandidates,
              totalVotes,
            };
          })
        );

        setElections(updatedElections);

        // 🔥 IMPORTANT CHANGE HERE
        if (CONTRACT_ADDRESS) {
          console.log("Fetching tx for:", CONTRACT_ADDRESS);
          const tx = await etherscanService.getFullAudit(CONTRACT_ADDRESS);

          if (tx && tx.length > 0) {
            setTransactions(tx);
          } else {
            console.warn("No transactions returned from Etherscan for:", CONTRACT_ADDRESS);
          }
        }
      } catch (err) {
        console.error("Failed to load transparency data", err);
      } finally {
        setLoadingTxs(false);
      }
    };

    loadData();
  }, [CONTRACT_ADDRESS]);
  const backPath =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "subadmin"
        ? "/subadmin"
        : "/voter";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backPath)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Shield className="h-6 w-6 text-primary" />
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            BlockVote <span className="gradient-text">Transparency</span>
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Immutability banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mb-8 p-6 border-primary/20 bg-primary/5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Immutable & Tamper-Proof Voting
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Every vote is recorded on the Ethereum blockchain (Sepolia
                testnet). Once cast, votes are{" "}
                <strong className="text-foreground">
                  cryptographically sealed
                </strong>{" "}
                and cannot be altered, deleted, or tampered with by anyone —
                including administrators. Each transaction is publicly
                verifiable on-chain.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Lock,
              title: "Immutable Records",
              desc: "Votes stored on-chain cannot be modified or deleted",
            },
            {
              icon: Eye,
              title: "Full Transparency",
              desc: "All transactions are publicly verifiable",
            },
            {
              icon: CheckCircle2,
              title: "One Vote Per Wallet",
              desc: "Smart contract prevents double voting",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="glass-card p-5 text-center border-border/50 hover:border-primary/50 transition-colors"
            >
              <item.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Live election results */}
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <BarChart3 className="h-5 w-5 text-primary" />
          Live Election Results
        </h2>
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {elections.map((election) => {
            const chartData = election.candidates.map((c) => ({
              name: c.name,
              votes: c.votes,
            }));
            return (
              <motion.div
                key={election.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{election.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {election.description}
                    </p>
                  </div>
                  <Badge
                    className={
                      election.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : election.status === "upcoming"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-muted text-muted-foreground"
                    }
                  >
                    {election.status}
                  </Badge>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Total votes:{" "}
                  <strong className="text-foreground">
                    {election.totalVotes}
                  </strong>
                </p>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(230, 25%, 12%)",
                          border: "1px solid hsl(230, 20%, 22%)",
                          borderRadius: "8px",
                          color: "hsl(210, 40%, 96%)",
                        }}
                      />
                      <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg">
                    No votes cast yet
                  </div>
                )}
              </motion.div>
            );
          })}
          {elections.length === 0 && (
            <div className="lg:col-span-2 text-center py-12 glass-card">
              <p className="text-muted-foreground italic">
                No active or past elections found.
              </p>
            </div>
          )}
        </div>

        {/* Blockchain audit trail */}
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Shield className="h-5 w-5 text-primary" />
          Blockchain Audit Trail
        </h2>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Action
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Tx Hash
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    From
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Block
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingTxs ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-muted-foreground">
                          Fetching latest transactions from Sepolia...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((tx, i) => {
                    const actionName = etherscanService.formatActionName(
                      tx.methodId,
                      tx.functionName,
                    );
                    return (
                      <motion.tr
                        key={tx.hash}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={
                              actionName === "Vote Cast"
                                ? "border-green-500/30 text-green-400 bg-green-500/5"
                                : actionName.includes("Election")
                                  ? "border-primary/30 text-primary bg-primary/5"
                                  : "border-accent/30 text-accent bg-accent/5"
                            }
                          >
                            {actionName}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                          >
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          #{tx.blockNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {etherscanService.formatTimestamp(tx.timeStamp)}
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-muted-foreground italic"
                    >
                      No blockchain transactions found for this contract.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center pb-8">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            All data is fetched in real-time from the Ethereum Sepolia
            blockchain via Etherscan API. The voting process is fully
            decentralized and tamper-proof. Verify the smart contract at{" "}
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono"
            >
              {CONTRACT_ADDRESS} ↗
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
