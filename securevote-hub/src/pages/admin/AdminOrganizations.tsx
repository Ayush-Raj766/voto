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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { getOrganizationsAPI, createOrganizationAPI } from "@/services/auth.service"
import { PlusCircle, Building, Calendar } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

/* ---------------- Validation ---------------- */

const organizationSchema = z.object({
  name: z.string()
    .min(2, "Organization name must be at least 2 characters")
    .max(50, "Organization name must be under 50 characters")
    .regex(/^[a-zA-Z0-9\s-_]+$/, "Name can only contain letters, numbers, spaces, hyphens, and underscores")
})

type OrganizationForm = z.infer<typeof organizationSchema>

interface Organization {
  _id: string
  name: string
  createdBy: string
  createdAt: string
}

export default function AdminOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)
  const [creating, setCreating] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema)
  })

  /* ---------------- Load Organizations ---------------- */

  const fetchOrganizations = async () => {
    try {
      setLoadingPage(true)
      const res = await getOrganizationsAPI(true)
      setOrganizations(res.data?.organizations || [])
    } catch {
      toast({
        title: "Failed to load organizations",
        variant: "destructive"
      })
    } finally {
      setLoadingPage(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  /* ---------------- Create Organization ---------------- */

  const handleCreate = async (data: OrganizationForm) => {
    try {
      setCreating(true)
      await createOrganizationAPI(data.name)
      toast({
        title: "Organization created successfully"
      })
      setDialogOpen(false)
      reset()
      await fetchOrganizations()
    } catch (err: any) {
      toast({
        title: err?.response?.data?.message || "Failed to create organization",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage organization list for voters and sub-admins
          </p>
        </div>

        {/* Create Organization Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="glow-primary">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Organization
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
              <div>
                <Label>Organization Name</Label>
                <Input {...register("name")} placeholder="e.g. Google, Microsoft" className="mt-1" />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Organization"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Description Card */}
      <div className="glass-card mb-6 p-4">
        <h3 className="mb-2 text-sm font-semibold text-primary">
          About Organizations
        </h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Users select their organization during registration</li>
          <li>• Sub-admins and Voters can only see elections from their own organization</li>
          <li>• Elections created by Admin are assigned to a specific organization</li>
          <li>• The default organization is <span className="font-semibold text-primary">"global"</span></li>
        </ul>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization Name</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loadingPage && (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8">
                  Loading organizations...
                </TableCell>
              </TableRow>
            )}

            {!loadingPage && organizations.map((org) => (
              <TableRow key={org._id}>
                <TableCell className="font-semibold capitalize flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  {org.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(org.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </TableCell>
              </TableRow>
            ))}

            {!loadingPage && organizations.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  )
}
