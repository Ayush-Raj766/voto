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

import { toast } from "@/hooks/use-toast"
import { PlusCircle, Users } from "lucide-react"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"



/* ---------------- Validation ---------------- */

const candidateSchema = z.object({
  name: z.string().min(2, "Candidate name required"),
  party: z.string().min(2, "Party name required"),
  imageUrl: z.string().optional(),
  walletAddress: z.string().min(10, "Wallet address required")
})

type CandidateForm = z.infer<typeof candidateSchema>



export default function SubadminCandidates() {

  const [elections, setElections] = useState<Election[]>([])
  const [selectedElection, setSelectedElection] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)

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

      const data = await contractService.getElections()

      setElections(data)

      if (!selectedElection && data.length > 0) {
        setSelectedElection(String(data[0].id))
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



  /* ---------------- Current Election ---------------- */

  const currentElection =
    elections.find(e => String(e.id) === selectedElection)



  /* ---------------- Add Candidate ---------------- */

  const handleAddCandidate = async (data: CandidateForm) => {

    if (!selectedElection) {

      toast({
        title: "Select an election first",
        variant: "destructive"
      })

      return

    }

    try {

      setSubmitting(true)

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

      setDialogOpen(false)
      reset()

      await loadElections()

    } catch (err: any) {

      toast({
        title: err?.message || "Failed to add candidate",
        variant: "destructive"
      })

    } finally {

      setSubmitting(false)

    }

  }



  /* ---------------- UI ---------------- */

  return (

    <DashboardLayout role="subadmin">

      {/* Header */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Manage Candidates
          </h1>

          <p className="text-muted-foreground">
            Add candidates to elections
          </p>

        </div>



        {/* Add Candidate */}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>

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
              onSubmit={handleSubmit(handleAddCandidate)}
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
                <Label>Image URL (optional)</Label>
                <Input {...register("imageUrl")} className="mt-1" />
              </div>


              <div>
                <Label>Wallet Address</Label>
                <Input
                  {...register("walletAddress")}
                  placeholder="0x..."
                  className="mt-1"
                />
                {errors.walletAddress && (
                  <p className="text-xs text-destructive">
                    {errors.walletAddress.message}
                  </p>
                )}
              </div>


              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Candidate"}
              </Button>

            </form>

          </DialogContent>

        </Dialog>

      </div>



      {/* Election Selector */}

      <div className="mb-6">

        <Label>Select Election</Label>

        <Select
          value={selectedElection}
          onValueChange={setSelectedElection}
        >

          <SelectTrigger className="mt-1 w-full max-w-sm">
            <SelectValue placeholder="Choose election" />
          </SelectTrigger>

          <SelectContent>

            {elections.map(e => (
              <SelectItem key={e.id} value={String(e.id)}>
                {e.title}
              </SelectItem>
            ))}

          </SelectContent>

        </Select>

      </div>



      {/* Candidate List */}

      {loadingPage && (
        <p className="text-center text-muted-foreground">
          Loading elections...
        </p>
      )}



      {!loadingPage && currentElection && (

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {(currentElection.candidates || []).map(candidate => (

            <div
              key={candidate.id}
              className="glass-card p-4"
            >

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>

                <div>

                  <p className="font-semibold">
                    {candidate.name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {candidate.party}
                  </p>

                </div>

              </div>

              <p className="mt-2 font-mono text-xs text-muted-foreground break-all">
                {candidate.walletAddress}
              </p>

            </div>

          ))}



          {(currentElection.candidates?.length || 0) === 0 && (

            <p className="col-span-full py-8 text-center text-muted-foreground">
              No candidates added yet
            </p>

          )}

        </div>

      )}

    </DashboardLayout>

  )

}