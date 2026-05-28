import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import API from "@/services/auth.service"

import { Check, X, Search } from "lucide-react"



interface Voter {
  _id: string
  fullName: string
  email: string
  walletAddress: string
  aadhaarId: string
  isApproved: boolean
  approvalStatus: "pending" | "approved" | "rejected"
  isVerifiedOnChain?: boolean
}



export default function AdminVoters() {

  const [voters, setVoters] = useState<Voter[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  /* ---------------- FETCH VOTERS ---------------- */

  const fetchVoters = async () => {

    try {

      setLoading(true)

      const res = await API.get("/users/voters")

      setVoters(res.data?.voters || [])

    } catch {

      toast({
        title: "Unable to load voters",
        variant: "destructive"
      })

    } finally {
      setLoading(false)
    }

  }



  useEffect(() => {
    fetchVoters()
  }, [])

  /* ---------------- SEARCH VOTERS ---------------- */

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchVoters();
      return;
    }

    try {
      setLoading(true);
      const res = await API.get(`/users/voters/search?wallet=${searchQuery.trim()}`);
      setVoters(res.data?.voters || []);
    } catch {
      toast({
        title: "Search failed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- APPROVE / REJECT ---------------- */

  const updateVoterStatus = async (
    voterId: string,
    approved: boolean
  ) => {

    try {

      setProcessingId(voterId)

      await API.post(`/users/${voterId}/approve`, { approved })

      setVoters(prev =>
        prev.map(v =>
          v._id === voterId
            ? { ...v, isApproved: approved, approvalStatus: approved ? "approved" : "rejected" }
            : v
        )
      )

      toast({
        title: approved
          ? "Voter approved"
          : "Voter rejected"
      })

    } catch {

      toast({
        title: "Failed to update voter",
        variant: "destructive"
      })

    } finally {

      setProcessingId(null)

    }

  }



  /* ---------------- HELPERS ---------------- */

  const formatWallet = (wallet: string) => {
    if (!wallet) return "-"
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
  }



  const renderStatus = (status: "pending" | "approved" | "rejected" | string) => {
    if (status === "approved") {
      return (
        <Badge className="bg-green-500/20 text-green-400">
          Approved
        </Badge>
      )
    }

    if (status === "rejected") {
      return (
        <Badge variant="destructive">
          Rejected
        </Badge>
      )
    }

    return (
      <Badge className="bg-yellow-500/20 text-yellow-400">
        Pending Approval
      </Badge>
    )
  }



  /* ---------------- UI ---------------- */

  return (

    <DashboardLayout role="admin">

      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Registered Voters
        </h1>

        <p className="text-muted-foreground">
          Approve or reject voter registrations
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2 max-w-md">
        <Input 
          placeholder="Search by wallet address..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-secondary/50"
        />
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>

      <div className="glass-card overflow-hidden">

        <Table>

          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Aadhaar ID</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Blockchain</TableHead>
              <TableHead className="text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>



          <TableBody>

            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading voters...
                </TableCell>
              </TableRow>
            )}



            {!loading && voters.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No voters registered yet
                </TableCell>
              </TableRow>
            )}



            {voters.map(voter => (

              <TableRow key={voter._id}>

                <TableCell className="font-medium">
                  {voter.fullName}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {voter.email}
                </TableCell>

                <TableCell className="font-mono text-xs">
                  {voter.aadhaarId}
                </TableCell>

                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatWallet(voter.walletAddress)}
                </TableCell>



                <TableCell>
                  {renderStatus(voter.approvalStatus || (voter.isApproved ? "approved" : "pending"))}
                </TableCell>

                <TableCell>
                  {voter.isVerifiedOnChain ? (
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap">
                      Verified on Blockchain
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 whitespace-nowrap">
                      Pending Approval
                    </Badge>
                  )}
                </TableCell>



                <TableCell className="text-right">

                    <div className="flex justify-end gap-2">
                      {voter.approvalStatus !== "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === voter._id}
                          onClick={() =>
                            updateVoterStatus(voter._id, true)
                          }
                          className="h-7 border-green-500/30 text-green-400 hover:bg-green-500/10"
                          title="Approve Voter"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}

                      {voter.approvalStatus !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === voter._id}
                          onClick={() =>
                            updateVoterStatus(voter._id, false)
                          }
                          className="h-7 border-destructive/30 text-destructive hover:bg-destructive/10"
                          title="Reject Voter"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </div>

    </DashboardLayout>

  )

}