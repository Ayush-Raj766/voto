import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NetworkWarning } from "@/components/NetworkWarning";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminElections from "@/pages/admin/AdminElections";
import AdminCandidates from "@/pages/admin/AdminCandidates";
import AdminVoters from "@/pages/admin/AdminVoters";
import AdminSubadmins from "@/pages/admin/AdminSubadmins";
import AdminResults from "@/pages/admin/AdminResults";
import SubadminDashboard from "@/pages/subadmin/SubadminDashboard";
import SubadminVoters from "@/pages/subadmin/SubadminVoters";
import SubadminCandidates from "@/pages/subadmin/SubadminCandidates";
import VoterDashboard from "@/pages/voter/VoterDashboard";
import VoterElections from "@/pages/voter/VoterElections";
import VoterHistory from "@/pages/voter/VoterHistory";
import VoterResults from "@/pages/voter/VoterResults";
import TransparencyPage from "@/pages/TransparencyPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NetworkWarning />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/auth/login" replace />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/elections" element={<ProtectedRoute role="admin"><AdminElections /></ProtectedRoute>} />
            <Route path="/admin/candidates" element={<ProtectedRoute role="admin"><AdminCandidates /></ProtectedRoute>} />
            <Route path="/admin/voters" element={<ProtectedRoute role="admin"><AdminVoters /></ProtectedRoute>} />
            <Route path="/admin/subadmins" element={<ProtectedRoute role="admin"><AdminSubadmins /></ProtectedRoute>} />
            <Route path="/admin/results" element={<ProtectedRoute role="admin"><AdminResults /></ProtectedRoute>} />

            {/* Sub-admin routes */}
            <Route path="/subadmin" element={<ProtectedRoute role="subadmin"><SubadminDashboard /></ProtectedRoute>} />
            <Route path="/subadmin/voters" element={<ProtectedRoute role="subadmin"><SubadminVoters /></ProtectedRoute>} />
            <Route path="/subadmin/candidates" element={<ProtectedRoute role="subadmin"><SubadminCandidates /></ProtectedRoute>} />

            {/* Voter routes */}
            <Route path="/voter" element={<ProtectedRoute role="voter"><VoterDashboard /></ProtectedRoute>} />
            <Route path="/voter/elections" element={<ProtectedRoute role="voter"><VoterElections /></ProtectedRoute>} />
            <Route path="/voter/history" element={<ProtectedRoute role="voter"><VoterHistory /></ProtectedRoute>} />
            <Route path="/voter/results" element={<ProtectedRoute role="voter"><VoterResults /></ProtectedRoute>} />

            {/* Transparency page - accessible to all authenticated users */}
            <Route path="/transparency" element={<ProtectedRoute role={["admin", "subadmin", "voter"]}><TransparencyPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;