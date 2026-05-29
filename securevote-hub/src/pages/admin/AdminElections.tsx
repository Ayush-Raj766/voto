import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { contractService, Election } from "@/services/contractService"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

import { toast } from "@/hooks/use-toast"
import { PlusCircle, Play, Square, Vote } from "lucide-react"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getOrganizationsAPI } from "@/services/auth.service"


/* ================================
   Validation
================================ */

const electionSchema = z.object({
  title: z.string().min(3, "Title required"),
  description: z.string().min(3, "Description required"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  organizationName: z.string().min(2, "Organization is required")
})

type ElectionForm = z.infer<typeof electionSchema>



export default function AdminElections() {

  const [elections, setElections] = useState<Election[]>([])
  const [organizations, setOrganizations] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ElectionForm>({
    resolver: zodResolver(electionSchema)
  })


  /* ================================
     Load Elections
  ================================ */

  const loadElections = async () => {

    try {

      setPageLoading(true)

      const data = await contractService.getElections()

      setElections(data)

    } catch {

      toast({
        title: "Failed to load elections",
        variant: "destructive"
      })

    } finally {

      setPageLoading(false)

    }

  }

  useEffect(() => {
    loadElections()

    const fetchOrgs = async () => {
      try {
        const res = await getOrganizationsAPI()
        if (res.data?.success && res.data.organizations) {
          setOrganizations(res.data.organizations)
        }
      } catch (err) {
        console.error("Failed to fetch organizations", err)
      }
    }
    fetchOrgs()
  }, [])



  /* ================================
     Create Election
  ================================ */

  const [isSubmitting, setIsSubmitting] = useState(false)

  const onCreate = async (data: ElectionForm) => {

    try {

      setIsSubmitting(true)

      toast({
        title: "Confirm transaction in MetaMask",
        description: "Waiting for blockchain confirmation..."
      })

      await contractService.createElection({
        title: data.title!,
        description: data.description!,
        startDate: data.startDate!,
        endDate: data.endDate!,
        organizationName: data.organizationName!
      })

      toast({
        title: "Election created successfully"
      })

      setOpen(false)
      reset()

      await loadElections()

    } catch (err: any) {

      toast({
        title: err?.message || "Failed to create election",
        variant: "destructive"
      })

    } finally {
      setIsSubmitting(false)
    }

  }



  /* ================================
     Start / End Election
  ================================ */

  const toggleElection = async (
    id: string,
    action: "start" | "end"
  ) => {

    try {

      setLoadingId(id)

      if (action === "start") {
        await contractService.startElection(id)
      } else {
        await contractService.endElection(id)
      }

      toast({
        title: action === "start"
          ? "Election started"
          : "Election ended"
      })

      await loadElections()

    } catch (err: any) {

      toast({
        title: err?.message || "Operation failed",
        variant: "destructive"
      })

    } finally {

      setLoadingId(null)

    }

  }



  /* ================================
     Helpers
  ================================ */

  const renderStatusColor = (status: string) => {

    if (status === "active") return "text-green-400"
    if (status === "upcoming") return "text-blue-400"

    return "text-gray-400"

  }



  /* ================================
     UI
  ================================ */

  return (

    <DashboardLayout role="admin">

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Elections
          </h1>

          <p className="text-muted-foreground">
            Manage blockchain elections
          </p>
        </div>



        {/* Create Election */}

        <Dialog open={open} onOpenChange={setOpen}>

          <DialogTrigger asChild>

            <Button className="glow-primary">

              <PlusCircle className="mr-2 h-4 w-4" />

              Create Election

            </Button>

          </DialogTrigger>


          <DialogContent>

            <DialogHeader>
              <DialogTitle>Create Election</DialogTitle>
            </DialogHeader>

            {open && (
              <form
                onSubmit={handleSubmit(onCreate)}
                className="space-y-4"
              >

                <div>

                  <Label>Title</Label>

                  <Input
                    {...register("title")}
                    className="mt-1"
                  />

                  {errors.title && (
                    <p className="text-xs text-destructive">
                      {errors.title.message}
                    </p>
                  )}

                </div>


                <div>

                  <Label>Description</Label>

                  <Input
                    {...register("description")}
                    className="mt-1"
                  />

                </div>


                <div>

                  <Label>Organization</Label>

                  <Select
                    onValueChange={(value) => setValue("organizationName", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org} value={org} className="capitalize">
                          {org}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {errors.organizationName && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.organizationName.message}
                    </p>
                  )}

                </div>


                <div>

                  <Label>Start Date</Label>

                  <Input
                    type="datetime-local"
                    {...register("startDate")}
                    className="mt-1"
                  />

                </div>


                <div>

                  <Label>End Date</Label>

                  <Input
                    type="datetime-local"
                    {...register("endDate")}
                    className="mt-1"
                  />

                </div>


                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating on Blockchain..." : "Create Election"}
                </Button>

              </form>
            )}

          </DialogContent>

        </Dialog>

      </div>



      {/* Election List */}

      <div className="space-y-4">

        {pageLoading && (
          <p className="text-center text-muted-foreground">
            Loading elections...
          </p>
        )}



        {!pageLoading && elections.length === 0 && (
          <p className="text-center text-muted-foreground">
            No elections created yet
          </p>
        )}



        {elections.map(el => (

          <div
            key={el.id}
            className="glass-card p-5"
          >

            <div className="flex items-center justify-between">

              <div className="flex items-start gap-3">

                <div className="rounded-lg bg-primary/20 p-2">
                  <Vote className="h-5 w-5 text-primary" />
                </div>


                <div>

                  <h3 className="font-semibold">
                    {el.title}
                  </h3>


                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">

                    {el.organizationName && (
                      <span className="bg-primary/15 text-primary font-medium px-2 py-0.5 rounded-full capitalize text-[10px]">
                        {el.organizationName}
                      </span>
                    )}

                    <span>
                      {el.candidates.length} candidates
                    </span>

                    <span>
                      {el.totalVotes} votes
                    </span>

                    <span className={renderStatusColor(el.status)}>
                      {el.status}
                    </span>

                  </div>

                </div>

              </div>



              {/* Actions */}
              <div className="flex gap-2">
                {new Date(el.endDate).getTime() <= Date.now() || el.status === "ended" ? (
                  <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2.5 py-1 rounded-md">
                    Election Over
                  </span>
                ) : (
                  <>
                    {el.status === "upcoming" && (
                      <Button
                        size="sm"
                        disabled={loadingId === el.id}
                        onClick={() =>
                          toggleElection(el.id, "start")
                        }
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Start
                      </Button>
                    )}

                    {el.status === "active" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={loadingId === el.id}
                        onClick={() =>
                          toggleElection(el.id, "end")
                        }
                      >
                        <Square className="mr-1 h-3 w-3" />
                        End
                      </Button>
                    )}
                  </>
                )}
              </div>

            </div>

          </div>

        ))}

      </div>

    </DashboardLayout>

  )

}