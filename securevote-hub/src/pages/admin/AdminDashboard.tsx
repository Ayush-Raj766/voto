import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { contractService, Election } from "@/services/contractService";
import { Card, CardContent } from "@/components/ui/card";
import { Vote, Users, BarChart3, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [elections, setElections] = useState<Election[]>([]);

  useEffect(() => {
    contractService.getElections().then(setElections);
  }, []);

  const stats = [
    { label: "Total Elections", value: elections.length, icon: Vote, color: "text-primary" },
    { label: "Active Elections", value: elections.filter((e) => e.status === "active").length, icon: BarChart3, color: "text-accent" },
    { label: "Total Candidates", value: elections.reduce((s, e) => s + e.candidates.length, 0), icon: Users, color: "hsl(var(--success))" },
    { label: "Total Votes Cast", value: elections.reduce((s, e) => s + e.totalVotes, 0), icon: Trophy, color: "hsl(var(--warning))" },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Manage elections, candidates, and voters</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
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

      {/* Recent elections */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Recent Elections</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {elections.map((election) => (
            <div key={election.id} className="glass-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{election.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{election.description}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  election.status === "active" ? "bg-green-500/20 text-green-400" :
                  election.status === "upcoming" ? "bg-blue-500/20 text-blue-400" :
                  "bg-gray-500/20 text-gray-400"
                }`}>
                  {election.status}
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <span>{election.candidates.length} candidates</span>
                <span>{election.totalVotes} votes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
