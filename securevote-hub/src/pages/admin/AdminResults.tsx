import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { contractService, Election } from "@/services/contractService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trophy } from "lucide-react";

const COLORS = ["hsl(263, 70%, 58%)", "hsl(190, 95%, 45%)", "hsl(142, 76%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)"];

export default function AdminResults() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");

  useEffect(() => {
    contractService.getElections().then((els) => {
      setElections(els);
      if (els.length > 0) setSelectedElection(els[0].id);
    });
  }, []);

  const currentElection = elections.find((e) => e.id === selectedElection);
  const chartData = currentElection?.candidates.map((c) => ({ name: c.name, votes: c.votes, party: c.party })) || [];
  const winner = currentElection?.candidates.reduce((max, c) => (c.votes > max.votes ? c : max), currentElection.candidates[0] || { name: "", votes: 0 });

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Election Results</h1>
        <p className="text-muted-foreground">Real-time vote counts from the blockchain</p>
      </div>

      <div className="mb-6">
        <Select value={selectedElection} onValueChange={setSelectedElection}>
          <SelectTrigger className="w-64 bg-secondary/50"><SelectValue placeholder="Select election" /></SelectTrigger>
          <SelectContent>
            {elections.map((e) => (<SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {winner && winner.votes > 0 && (
        <div className="mb-6 glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-500/20 p-3">
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leading Candidate</p>
              <p className="text-xl font-bold">{winner.name}</p>
              <p className="text-sm text-muted-foreground">{winner.votes} votes</p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <h3 className="mb-4 font-semibold">Vote Distribution</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 20%, 18%)" />
              <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(230, 25%, 12%)", border: "1px solid hsl(230, 20%, 22%)", borderRadius: "8px" }}
                labelStyle={{ color: "hsl(210, 40%, 96%)" }}
              />
              <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-12 text-center text-muted-foreground">No vote data available</p>
        )}
      </div>
    </DashboardLayout>
  );
}
