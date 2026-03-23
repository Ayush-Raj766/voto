import { NavLink as RouterNavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Vote, Users, Trophy, PlusCircle, History, BarChart3,
  LogOut, ChevronLeft, ChevronRight, Shield, UserCheck, Eye
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Elections", to: "/admin/elections", icon: Vote },
  { label: "Candidates", to: "/admin/candidates", icon: Users },
  { label: "Voters", to: "/admin/voters", icon: Users },
  { label: "Sub-Admins", to: "/admin/subadmins", icon: UserCheck },
  { label: "Results", to: "/admin/results", icon: BarChart3 },
  { label: "Transparency", to: "/transparency", icon: Eye },
];

const subadminNav: NavItem[] = [
  { label: "Dashboard", to: "/subadmin", icon: LayoutDashboard },
  { label: "Candidates", to: "/subadmin/candidates", icon: Users },
  { label: "Voters", to: "/subadmin/voters", icon: UserCheck },
  { label: "Transparency", to: "/transparency", icon: Eye },
];

const voterNav: NavItem[] = [
  { label: "Dashboard", to: "/voter", icon: LayoutDashboard },
  { label: "Elections", to: "/voter/elections", icon: Vote },
  { label: "History", to: "/voter/history", icon: History },
  { label: "Results", to: "/voter/results", icon: Trophy },
  { label: "Transparency", to: "/transparency", icon: Eye },
];

export function DashboardLayout({ children, role }: { children: React.ReactNode; role: UserRole }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const items = role === "admin" ? adminNav : role === "subadmin" ? subadminNav : voterNav;

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <Shield className="h-6 w-6 shrink-0 text-primary" />
          {!collapsed && <span className="font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>BlockVote</span>}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <RouterNavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </RouterNavLink>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          {!collapsed && user && (
            <div className="mb-2 rounded-lg bg-sidebar-accent px-3 py-2">
              <p className="truncate text-xs font-medium">{user.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              <p className="mt-0.5 truncate text-xs font-medium text-primary capitalize">{user.role}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 text-muted-foreground">
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6">
          {children}
        </div>
      </main>
    </div>
  );
}