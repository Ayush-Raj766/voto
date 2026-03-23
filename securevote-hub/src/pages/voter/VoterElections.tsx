import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { contractService, Election } from "@/services/contractService";
import { useWallet } from "@/hooks/useWallet";
import API from "@/services/auth.service";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

import { Vote, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

export default function VoterElections() {
  const wallet = useWallet();

  const [elections, setElections] = useState<Election[]>([]);
  const [votedElections, setVotedElections] = useState<Set<string>>(new Set());
  const [votingElection, setVotingElection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  /* ---------------- Check voter approval ---------------- */

const checkApproval = async () => {
  try {
    const { data } = await API.get("/users/me");

    setApproved(Boolean(data?.user?.isApproved));
  } catch {
    setApproved(false);

    toast({
      title: "Unable to verify voter",
      variant: "destructive",
    });
  }
};

  /* ---------------- Load elections ---------------- */

  const loadElections = async () => {
    try {
      const data = await contractService.getElections();

      // only keep active elections
      const active = data.filter((e) => e.status === "active");

      setElections(active);
    } catch {
      toast({
        title: "Failed to load elections",
        variant: "destructive",
      });
    }
  };

  /* ---------------- Initial load ---------------- */

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      await checkApproval();

      if (wallet.isConnected) {
        await loadElections();
      }

      setLoading(false);
    };

    init();
  }, [wallet.isConnected]);

  /* ---------------- Check voting status ---------------- */

  useEffect(() => {
    if (!wallet.address || elections.length === 0) return;

    const checkVotes = async () => {
      const votedSet = new Set<string>();

      for (const el of elections) {
        try {
          const voted = await contractService.hasVoted(el.id, wallet.address);

          if (voted) votedSet.add(el.id);
        } catch (err) {
          console.error(err);
        }
      }

      setVotedElections(votedSet);
    };

    checkVotes();
  }, [wallet.address, elections]);

  /* ---------------- Vote ---------------- */

  const handleVote = async (election: Election, candidateId: number) => {
    if (!wallet.isConnected) {
      toast({
        title: "Connect wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!approved) {
      toast({
        title: "Your account is not approved yet",
        variant: "destructive",
      });
      return;
    }

    try {
      setVotingElection(election.id);
      setTxHash(null);

      const hash = await contractService.vote(
        election.blockchainId!,
        candidateId
      );

      setTxHash(hash);

      await contractService.recordVote(
        election.id,
        candidateId,
        wallet.address!,
        hash
      );

      setVotedElections((prev) => {
        const updated = new Set(prev);
        updated.add(election.id);
        return updated;
      });

      toast({
        title: "Vote submitted successfully",
      });
    } catch (err: any) {
      toast({
        title: err?.message || "Vote failed",
        variant: "destructive",
      });
    } finally {
      setVotingElection(null);
    }
  };

  /* ---------------- Loading UI ---------------- */

  if (loading) {
    return (
      <DashboardLayout role="voter">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <DashboardLayout role="voter">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Elections</h1>
        <p className="text-muted-foreground">
          View candidates and cast your vote
        </p>
      </div>

      {!wallet.isConnected && (
        <div className="mb-6 glass-card flex items-center gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />

          <p className="text-sm">Connect wallet to vote</p>

          <Button size="sm" onClick={wallet.connect} className="ml-auto">
            Connect Wallet
          </Button>
        </div>
      )}

      {approved === false && (
        <div className="glass-card p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-yellow-400" />

          <p className="font-medium">Your account is waiting for approval</p>

          <p className="text-sm text-muted-foreground">
            A subadmin must verify your registration
          </p>
        </div>
      )}

      {approved &&
        elections.map((el) => (
          <div key={el.id} className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/20 p-2">
                <Vote className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">{el.title}</h2>

                <p className="text-sm text-muted-foreground">
                  {el.description}
                </p>
              </div>

              {votedElections.has(el.id) && (
                <span className="ml-auto flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  Voted
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {el.candidates.map((c) => (
                <div key={c.id} className="glass-card-hover p-5">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
                    {c.name.charAt(0)}
                  </div>

                  <h3 className="font-semibold">{c.name}</h3>

                  <p className="text-sm text-muted-foreground">{c.party}</p>

                  <Button
                    className="mt-4 w-full"
                    disabled={
                      votedElections.has(el.id) || votingElection !== null
                    }
                    onClick={() => handleVote(el, Number(c.id))}
                  >
                    {votingElection === el.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : votedElections.has(el.id) ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Voted
                      </>
                    ) : (
                      <>
                        <Vote className="mr-2 h-4 w-4" />
                        Vote
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

      {approved && elections.length === 0 && (
        <div className="glass-card py-16 text-center">
          <Vote className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />

          <p className="text-lg font-medium">No active elections</p>

          <p className="text-sm text-muted-foreground">Check back later</p>
        </div>
      )}
    </DashboardLayout>
  );
}