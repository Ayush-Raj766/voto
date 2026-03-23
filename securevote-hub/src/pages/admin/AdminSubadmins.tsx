import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

import { Badge } from "@/components/ui/badge"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

import { toast } from "@/hooks/use-toast"
import API from "@/services/auth.service"

import { PlusCircle, Trash2, UserCheck } from "lucide-react"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"



/* ---------------- Validation ---------------- */

const subadminSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  walletAddress: z.string().min(10, "Wallet address required"),
  aadhaarId: z.string().min(8, "Aadhaar ID required"),
  password: z.string().min(6, "Password must be at least 6 characters")
})

type SubadminForm = z.infer<typeof subadminSchema>



interface SubAdmin {
  _id: string
  fullName: string
  email: string
  walletAddress: string
  aadhaarId: string
  createdAt: string
  isActive: boolean
}



export default function AdminSubadmins() {

  const [subadmins, setSubadmins] = useState<SubAdmin[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const [loadingPage, setLoadingPage] = useState(true)
  const [creating, setCreating] = useState(false)



  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SubadminForm>({
    resolver: zodResolver(subadminSchema)
  })



  /* ---------------- Helpers ---------------- */

  const formatWallet = (wallet: string) => {
    if (!wallet) return "-"
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
  }



  /* ---------------- Load Subadmins ---------------- */

  const fetchSubadmins = async () => {

    try {

      setLoadingPage(true)

      const res = await API.get("/users/subadmins")

      setSubadmins(res.data?.subadmins || [])

    } catch {

      toast({
        title: "Failed to load sub-admins",
        variant: "destructive"
      })

    } finally {

      setLoadingPage(false)

    }

  }

  useEffect(() => {
    fetchSubadmins()
  }, [])



  /* ---------------- Create Subadmin ---------------- */

  const handleCreate = async (data: SubadminForm) => {

    try {

      setCreating(true)

      await API.post("/users/subadmins", {
        ...data,
        walletAddress: data.walletAddress.toLowerCase()
      })

      toast({
        title: "Sub-admin created successfully"
      })

      setDialogOpen(false)

      reset()

      await fetchSubadmins()

    } catch (err: any) {

      toast({
        title:
          err?.response?.data?.message ||
          "Failed to create sub-admin",
        variant: "destructive"
      })

    } finally {

      setCreating(false)

    }

  }



  /* ---------------- Toggle Active ---------------- */

  const toggleSubadmin = async (id: string) => {

    try {

      const res = await API.patch(`/users/${id}/toggle`)

      toast({
        title: res.data?.message || "Status updated"
      })

      setSubadmins(prev =>
        prev.map(s =>
          s._id === id
            ? { ...s, isActive: !s.isActive }
            : s
        )
      )

    } catch {

      toast({
        title: "Failed to update status",
        variant: "destructive"
      })

    }

  }



  /* ---------------- Delete Subadmin ---------------- */

  const removeSubadmin = async (id: string) => {

    try {

      await API.delete(`/users/${id}`)

      toast({
        title: "Sub-admin removed"
      })

      setSubadmins(prev =>
        prev.filter(s => s._id !== id)
      )

    } catch {

      toast({
        title: "Failed to remove sub-admin",
        variant: "destructive"
      })

    }

  }



  /* ---------------- UI ---------------- */

  return (

    <DashboardLayout role="admin">

      {/* Header */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Sub-Admins
          </h1>

          <p className="text-muted-foreground">
            Manage sub-admins who verify voters and add candidates
          </p>

        </div>



        {/* Create Subadmin */}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>

          <DialogTrigger asChild>

            <Button className="glow-primary">

              <PlusCircle className="mr-2 h-4 w-4" />

              Add Sub-Admin

            </Button>

          </DialogTrigger>


          <DialogContent>

            <DialogHeader>
              <DialogTitle>Create Sub-Admin</DialogTitle>
            </DialogHeader>


            <form
              onSubmit={handleSubmit(handleCreate)}
              className="space-y-4"
            >

              <div>
                <Label>Full Name</Label>
                <Input {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-xs text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>


              <div>
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
              </div>


              <div>
                <Label>Wallet Address</Label>
                <Input {...register("walletAddress")} placeholder="0x..." />
              </div>


              <div>
                <Label>Aadhaar ID</Label>
                <Input {...register("aadhaarId")} />
              </div>


              <div>
                <Label>Password</Label>
                <Input type="password" {...register("password")} />
              </div>


              <Button
                type="submit"
                className="w-full"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Sub-Admin"}
              </Button>

            </form>

          </DialogContent>

        </Dialog>

      </div>



      {/* Permissions Card */}

      <div className="glass-card mb-6 p-4">

        <h3 className="mb-2 text-sm font-semibold text-primary">
          Sub-Admin Permissions
        </h3>

        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Verify voter registrations</li>
          <li>• Add candidates to elections</li>
          <li>• View transparency dashboard</li>
          <li className="text-destructive/80">
            • Cannot manage elections or admins
          </li>
        </ul>

      </div>



      {/* Table */}

      <div className="glass-card overflow-hidden">

        <Table>

          <TableHeader>

            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                Actions
              </TableHead>
            </TableRow>

          </TableHeader>



          <TableBody>

            {loadingPage && (

              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading sub-admins...
                </TableCell>
              </TableRow>

            )}



            {!loadingPage && subadmins.map(sub => (

              <TableRow key={sub._id}>

                <TableCell className="font-medium">
                  {sub.fullName}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {sub.email}
                </TableCell>

                <TableCell className="font-mono text-xs text-muted-foreground">
                  {formatWallet(sub.walletAddress)}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {new Date(sub.createdAt).toLocaleDateString()}
                </TableCell>

                <TableCell>

                  <Badge
                    className={
                      sub.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-destructive/20 text-destructive"
                    }
                  >
                    {sub.isActive ? "Active" : "Disabled"}
                  </Badge>

                </TableCell>



                <TableCell className="text-right">

                  <div className="flex justify-end gap-2">

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSubadmin(sub._id)}
                    >
                      <UserCheck className="mr-1 h-3 w-3" />
                      {sub.isActive ? "Disable" : "Enable"}
                    </Button>


                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeSubadmin(sub._id)}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>

                  </div>

                </TableCell>

              </TableRow>

            ))}



            {!loadingPage && subadmins.length === 0 && (

              <TableRow>

                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No sub-admins created yet
                </TableCell>

              </TableRow>

            )}

          </TableBody>

        </Table>

      </div>

    </DashboardLayout>

  )

}