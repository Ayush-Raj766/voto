import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { contractService, Election } from "@/services/contractService"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import { toast } from "@/hooks/use-toast"
import { PlusCircle, Users } from "lucide-react"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"



/* ---------------- Validation ---------------- */

const candidateSchema = z.object({
  name: z.string().min(2, "Name required"),
  party: z.string().min(2, "Party required"),
  imageUrl: z.string().optional(),
  walletAddress: z.string().min(10, "Wallet address required")
})

type CandidateForm = z.infer<typeof candidateSchema>



export default function AdminCandidates() {

  const [elections, setElections] = useState<Election[]>([])
  const [selectedElection, setSelectedElection] = useState<string>("")
  const [open, setOpen] = useState(false)

  const [loadingPage, setLoadingPage] = useState(true)
  const [submitting, setSubmitting] = useState(false)



  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema)
  })



  /* ---------------- Load Elections ---------------- */

  const loadElections = async () => {

    try {

      setLoadingPage(true)

      const els = await contractService.getElections()

      setElections(els)

      if (!selectedElection && els.length > 0) {
        setSelectedElection(els[0].id)
      }

    } catch {

      toast({
        title: "Failed to load elections",
        variant: "destructive"
      })

    } finally {

      setLoadingPage(false)

    }

  }



  useEffect(() => {
    loadElections()
  }, [])



  const currentElection =
    elections.find(e => e.id === selectedElection)



  /* ---------------- Add Candidate ---------------- */

  const onAdd = async (data: CandidateForm) => {

    if (!selectedElection) {
      toast({
        title: "Select an election first",
        variant: "destructive"
      })
      return
    }

    try {

      toast({
        title: "Confirm transaction in MetaMask",
        description: "Waiting for blockchain confirmation..."
      })

      await contractService.addCandidate(
        selectedElection,
        {
          name: data.name,
          party: data.party,
          imageUrl: data.imageUrl || "",
          walletAddress: data.walletAddress.toLowerCase()
        }
      )

      toast({
        title: "Candidate added successfully"
      })

      setOpen(false)
      reset()

      await loadElections()

    } catch (err: any) {

      toast({
        title: err?.message || "Blockchain transaction failed",
        variant: "destructive"
      })

    } finally {

      setSubmitting(false)

    }

  }



  /* ---------------- UI ---------------- */

  return (

    <DashboardLayout role="admin">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Candidates
          </h1>

          <p className="text-muted-foreground">
            Manage election candidates
          </p>

        </div>



        {/* Add Candidate */}

        <Dialog open={open} onOpenChange={setOpen}>

          <DialogTrigger asChild>

            <Button className="glow-primary">

              <PlusCircle className="mr-2 h-4 w-4" />

              Add Candidate

            </Button>

          </DialogTrigger>


          <DialogContent>

            <DialogHeader>
              <DialogTitle>Add Candidate</DialogTitle>
            </DialogHeader>


            <form
              onSubmit={handleSubmit(onAdd)}
              className="space-y-4"
            >

              <div>
                <Label>Name</Label>
                <Input {...register("name")} className="mt-1" />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>


              <div>
                <Label>Party</Label>
                <Input {...register("party")} className="mt-1" />
              </div>


              <div>
                <Label>Image URL</Label>
                <Input {...register("imageUrl")} className="mt-1" />
              </div>


              <div>
                <Label>Wallet Address</Label>
                <Input {...register("walletAddress")} className="mt-1" />
              </div>


              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Adding on Blockchain..." : "Add Candidate"}
              </Button>

            </form>

          </DialogContent>

        </Dialog>

      </div>



      {/* Election Selector */}

      <div className="mb-6">

        <Select
          value={selectedElection}
          onValueChange={setSelectedElection}
        >

          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select election" />
          </SelectTrigger>

          <SelectContent>

            {elections.map(e => (

              <SelectItem key={e.id} value={e.id}>
                {e.title}
              </SelectItem>

            ))}

          </SelectContent>

        </Select>

      </div>



      {/* Candidates Table */}

      <div className="glass-card overflow-hidden">

        <Table>

          <TableHeader>

            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Party</TableHead>
              <TableHead className="text-right">
                Votes
              </TableHead>
            </TableRow>

          </TableHeader>


          <TableBody>

            {loadingPage && (

              <TableRow>

                <TableCell colSpan={3} className="text-center py-8">
                  Loading candidates...
                </TableCell>

              </TableRow>

            )}



            {!loadingPage &&
              currentElection?.candidates.map(c => (

                <TableRow key={c.id}>

                  <TableCell className="font-medium">
                    {c.name}
                  </TableCell>

                  <TableCell>
                    {c.party}
                  </TableCell>

                  <TableCell className="text-right font-semibold">
                    {c.votes}
                  </TableCell>

                </TableRow>

              ))}



            {!loadingPage &&
              (!currentElection ||
                currentElection.candidates.length === 0) && (

                <TableRow>

                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-muted-foreground"
                  >

                    <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />

                    No candidates yet

                  </TableCell>

                </TableRow>

              )}

          </TableBody>

        </Table>

      </div>

    </DashboardLayout>

  )

}