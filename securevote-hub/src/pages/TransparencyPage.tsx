import { useEffect, useState } from "react";
import { contractService, Election } from "@/services/contractService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  Eye,
  CheckCircle2,
  BarChart3,
  ArrowLeft,
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
import Transactions from "./Transection";

const COLORS = [
  "hsl(263, 70%, 58%)",
  "hsl(190, 95%, 45%)",
  "hsl(142, 76%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
];
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export default function TransparencyPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadElections = async () => {
      try {
        const data = await contractService.getElections();

        const enriched = await Promise.all(
          data.map(async (election) => {
            if (!election.blockchainId) return election;

            const candidates = await Promise.all(
              election.candidates.map(async (c) => {
                const votes = await contractService.getCandidateVotes(
                  election.blockchainId!,
                  c.id
                );
                return { ...c, votes };
              })
            );

            const totalVotes = candidates.reduce(
              (sum, c) => sum + c.votes,
              0
            );

            return {
              ...election,
              candidates,
              totalVotes,
            };
          })
        );

        setElections(enriched);
      } catch (error) {
        console.error("Error loading elections:", error);
      }
    };

    loadElections();
  }, []);

  const backPath =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "subadmin"
      ? "/subadmin"
      : "/voter";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Shield className="h-6 w-6 text-primary" />

          <h1 className="text-xl font-bold">
            BlockVote <span className="text-primary">Transparency</span>
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* IMMUTABILITY BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mb-8 p-6 border-primary/20 bg-primary/5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
              <Lock className="h-7 w-7 text-primary" />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Immutable & Tamper-Proof Voting
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Votes are stored on the Ethereum blockchain. Once submitted,
                they cannot be modified or deleted. Every transaction is
                publicly verifiable.
              </p>
            </div>
          </div>
        </motion.div>

        {/* TRUST INDICATORS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Lock,
              title: "Immutable Records",
              desc: "Votes cannot be changed once recorded",
            },
            {
              icon: Eye,
              title: "Full Transparency",
              desc: "All transactions are publicly visible",
            },
            {
              icon: CheckCircle2,
              title: "One Vote Per Wallet",
              desc: "Smart contract prevents duplicate voting",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5 text-center border-border/50 hover:border-primary/50 transition"
            >
              <item.icon className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* ELECTION RESULTS */}
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
                <div className="mb-4 flex justify-between">
                  <div>
                    <h3 className="font-semibold">{election.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {election.description}
                    </p>
                  </div>

                  <Badge>{election.status}</Badge>
                </div>

                <p className="mb-3 text-sm">
                  Total votes: <strong>{election.totalVotes}</strong>
                </p>

                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground border rounded">
                    No votes yet
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* BLOCKCHAIN AUDIT */}
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Shield className="h-5 w-5 text-primary" />
          Blockchain Audit Trail
        </h2>

        <Transactions />

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