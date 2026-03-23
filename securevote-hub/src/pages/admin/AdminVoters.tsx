import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"

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

import { Check, X } from "lucide-react"



interface Voter {
  _id: string
  fullName: string
  email: string
  walletAddress: string
  aadhaarId: string
  isApproved: boolean | null
}



export default function AdminVoters() {

  const [voters, setVoters] = useState<Voter[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)



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
            ? { ...v, isApproved: approved }
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



  const renderStatus = (status: boolean | null) => {

    if (status === true) {
      return (
        <Badge className="bg-green-500/20 text-green-400">
          Approved
        </Badge>
      )
    }

    if (status === false) {
      return (
        <Badge variant="destructive">
          Rejected
        </Badge>
      )
    }

    return (
      <Badge variant="secondary">
        Pending
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



      <div className="glass-card overflow-hidden">

        <Table>

          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Aadhaar ID</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>



          <TableBody>

            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading voters...
                </TableCell>
              </TableRow>
            )}



            {!loading && voters.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
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
                  {renderStatus(voter.isApproved)}
                </TableCell>



                <TableCell className="text-right">

                  {voter.isApproved === null && (

                    <div className="flex justify-end gap-2">

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === voter._id}
                        onClick={() =>
                          updateVoterStatus(voter._id, true)
                        }
                        className="h-7 border-green-500/30 text-green-400 hover:bg-green-500/10"
                      >
                        <Check className="h-3 w-3" />
                      </Button>



                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === voter._id}
                        onClick={() =>
                          updateVoterStatus(voter._id, false)
                        }
                        className="h-7 border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3" />
                      </Button>

                    </div>

                  )}

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </div>

    </DashboardLayout>

  )

}