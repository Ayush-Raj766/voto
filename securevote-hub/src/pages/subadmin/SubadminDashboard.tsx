import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { contractService, Election } from "@/services/contractService"
import {
  Users,
  UserCheck,
  Vote,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight
} from "lucide-react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import API from "@/services/auth.service"

interface Voter {
  isApproved: boolean | null
}

interface VoterCounts {
  pending: number
  approved: number
  rejected: number
}

export default function SubadminDashboard() {

  const [elections, setElections] = useState<Election[]>([])
  const [voterCounts, setVoterCounts] = useState<VoterCounts>({
    pending: 0,
    approved: 0,
    rejected: 0
  })


  /* ---------------- FETCH DATA ---------------- */

  const fetchElections = async () => {
    try {
      const data = await contractService.getElections()
      setElections(data)
    } catch {
      console.error("Failed to load elections")
    }
  }

  const fetchVoters = async () => {
    try {

      const res = await API.get("/users/voters")
      const voters: Voter[] = res.data?.voters || []

      setVoterCounts({
        pending: voters.filter(v => v.isApproved === null).length,
        approved: voters.filter(v => v.isApproved === true).length,
        rejected: voters.filter(v => v.isApproved === false).length
      })

    } catch {
      console.error("Failed to load voters")
    }
  }


  useEffect(() => {
    fetchElections()
    fetchVoters()
  }, [])



  /* ---------------- CALCULATIONS ---------------- */

  const activeElections = elections.filter(e => e.status === "active").length

  const totalCandidates = elections.reduce(
    (sum, e) => sum + (e.candidates?.length || 0),
    0
  )


  /* ---------------- STATS ---------------- */

  const stats = [
    {
      label: "Active Elections",
      value: activeElections,
      icon: Vote,
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      label: "Pending Voters",
      value: voterCounts.pending,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10"
    },
    {
      label: "Approved Voters",
      value: voterCounts.approved,
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-400/10"
    },
    {
      label: "Rejected Voters",
      value: voterCounts.rejected,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10"
    },
    {
      label: "Total Candidates",
      value: totalCandidates,
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10"
    }
  ]


  /* ---------------- QUICK ACTIONS ---------------- */

  const quickActions = [
    {
      title: "Verify Voters",
      description: "Review and approve voter registrations",
      href: "/subadmin/voters",
      icon: UserCheck,
      badge: voterCounts.pending > 0
        ? `${voterCounts.pending} pending`
        : null
    },
    {
      title: "Manage Candidates",
      description: "Add candidates to elections",
      href: "/subadmin/candidates",
      icon: Users,
      badge: null
    }
  ]


  return (

    <DashboardLayout role="subadmin">

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Sub-Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Verify voters and manage candidates
        </p>
      </div>


      {/* ---------------- STATS GRID ---------------- */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

        {stats.map((stat, index) => (

          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
          >

            <div className="glass-card-hover p-5 h-full">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-3xl font-bold">
                    {stat.value}
                  </p>
                </div>

                <div className={`rounded-lg ${stat.bg} p-3`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>

              </div>

            </div>

          </motion.div>

        ))}

      </div>


      {/* ---------------- QUICK ACTIONS ---------------- */}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">

        {quickActions.map((action, index) => (

          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >

            <Link to={action.href}>

              <div className="glass-card-hover group flex items-center justify-between p-5 cursor-pointer">

                <div className="flex items-center gap-4">

                  <div className="rounded-lg bg-primary/10 p-3">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>

                  <div>

                    <div className="flex items-center gap-2">

                      <p className="font-semibold">
                        {action.title}
                      </p>

                      {action.badge && (
                        <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
                          {action.badge}
                        </span>
                      )}

                    </div>

                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>

                  </div>

                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />

              </div>

            </Link>

          </motion.div>

        ))}

      </div>

    </DashboardLayout>

  )

}