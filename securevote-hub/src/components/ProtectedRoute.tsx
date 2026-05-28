import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/context/AuthContext";

interface Props {
  children: React.ReactNode;
  role?: UserRole | UserRole[];
}

export function ProtectedRoute({ children, role }: Props) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const allowedRoles = role ? (Array.isArray(role) ? role : [role]) : [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const home = user.role === "admin" ? "/admin" : user.role === "subadmin" ? "/subadmin" : "/voter";
    return <Navigate to={home} replace />;
  }

  if (user.role === "voter" && user.isVerifiedOnChain !== true) {
    const allowedUnapprovedPaths = ["/voter", "/voter/elections", "/transparency"];
    if (!allowedUnapprovedPaths.includes(location.pathname)) {
      return <Navigate to="/voter" replace />;
    }
  }

  if (user.role === "subadmin" && user.isActiveOnChain !== true) {
    const allowedUnapprovedPaths = ["/subadmin", "/transparency"];
    if (!allowedUnapprovedPaths.includes(location.pathname)) {
      return <Navigate to="/subadmin" replace />;
    }
  }

  return <>{children}</>;
}