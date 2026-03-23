import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import API from "@/services/auth.service";

interface VoteRecord {
  electionId: string;
  electionTitle: string;
  date: string;
  status: "upcoming" | "active" | "ended";
}

export default function VoterHistory() {
  const [history, setHistory] = useState<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/users/me/history")
      .then((res) => setHistory(res.data.history ?? []))
      .catch(() => {/* fail silently — history might be empty */ })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="voter">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Voting History</h1>
        <p className="text-muted-foreground">Your past votes recorded on the blockchain</p>
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Election</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((h) => (
              <TableRow key={h.electionId}>
                <TableCell className="font-medium">{h.electionTitle}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(h.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      h.status === "ended"
                        ? "bg-gray-500/20 text-gray-400"
                        : h.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400"
                    }
                  >
                    {h.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {!loading && history.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                  <History className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  No voting history yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
