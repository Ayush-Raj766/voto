import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { contractService, Election } from "@/services/contractService";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/context/AuthContext";
import { Vote, Clock, CheckCircle, BarChart3, AlertTriangle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function VoterDashboard() {
  const [elections, setElections] = useState<Election[]>([]);
  const wallet = useWallet();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.isVerifiedOnChain) {
      contractService.getElections()
        .then(setElections)
        .catch((err) => console.log("Failed to fetch elections in dashboard:", err));
    }
  }, [user?.isVerifiedOnChain]);

  const capitalize = (str?: string) => {
    if (!str) return "";
    return str
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const active = elections.filter((e) => e.status === "active").length;
  const ended = elections.filter((e) => e.status === "ended").length;

  return (
    <DashboardLayout role="voter">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Voter Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Your decentralized voting portal</p>
        </div>
        <div className="flex gap-2">
          {user?.isVerifiedOnChain ? (
            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 text-xs">
              Verified on Blockchain
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 text-xs">
              Pending Approval
            </Badge>
          )}
        </div>
      </div>

      {/* Approval Status Banner */}
      {user?.isVerifiedOnChain === false && (
        <div className="mb-6 glass-card border-l-4 p-5 flex items-start gap-4" style={{ borderLeftColor: user.approvalStatus === "rejected" ? "hsl(var(--destructive))" : "hsl(var(--warning))" }}>
          {user.approvalStatus === "rejected" ? (
            <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-yellow-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="font-semibold text-lg">
              {user.approvalStatus === "rejected" ? "Approval Rejected" : "Approval Pending"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.approvalStatus === "rejected"
                ? `Hey ${capitalize(user.fullName)}, your request for voting approval has been rejected. Please contact Admin or Sub-Admin.`
                : `Hey ${capitalize(user.fullName)}, you are not approved for voting yet. Please wait for Admin or Sub-Admin approval.`}
            </p>
          </div>
        </div>
      )}

      {/* Wallet status */}
      {!wallet.isConnected && (
        <div className="mb-6 glass-card flex items-center gap-3 p-4 border-l-4" style={{ borderLeftColor: "hsl(var(--warning))" }}>
          <p className="text-sm">Connect your MetaMask wallet to participate in elections.</p>
          <button onClick={wallet.connect} className="ml-auto shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Connect Wallet
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Elections", value: active, icon: Vote, color: "text-primary" },
          { label: "Total Elections", value: elections.length, icon: BarChart3, color: "text-accent" },
          { label: "Completed", value: ended, icon: CheckCircle, color: "hsl(var(--success))" },
          { label: "Upcoming", value: elections.filter((e) => e.status === "upcoming").length, icon: Clock, color: "hsl(var(--warning))" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="glass-card-hover p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-3xl font-bold">{s.value}</p>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active elections list */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Active Elections</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {elections.filter((e) => e.status === "active").map((el) => (
            <div key={el.id} className="glass-card-hover p-5">
              <h3 className="font-semibold">{el.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{el.description}</p>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>{el.candidates.length} candidates</span>
                <span>{el.totalVotes} votes cast</span>
              </div>
            </div>
          ))}
          {elections.filter((e) => e.status === "active").length === 0 && (
            <p className="text-muted-foreground">No active elections at the moment.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
