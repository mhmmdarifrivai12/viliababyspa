import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import TransactionForm from "./pages/dashboard/TransactionForm";
import TransactionHistory from "./pages/dashboard/TransactionHistory";
import TreatmentManagement from "./pages/dashboard/TreatmentManagement";
import FinancialReports from "./pages/dashboard/FinancialReports";
import SiteSettings from "./pages/dashboard/SiteSettings";
import UserManagement from "./pages/dashboard/UserManagement";
import TestimonialManagement from "./pages/dashboard/TestimonialManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/layanan" element={<Services />} />
              <Route path="/kontak" element={<Contact />} />
            </Route>
            
            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="transaction" element={<TransactionForm />} />
              <Route path="history" element={<TransactionHistory />} />
              <Route path="treatments" element={<TreatmentManagement />} />
              <Route path="testimonials" element={<TestimonialManagement />} />
              <Route path="reports" element={<FinancialReports />} />
              <Route path="settings" element={<SiteSettings />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
