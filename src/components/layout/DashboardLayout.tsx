import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LayoutDashboard, 
  Scissors, 
  FileText, 
  Settings,
  PlusCircle,
  History,
  LogOut,
  Menu,
  X,
  Users,
  MessageSquare
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const { user, loading, hasRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = hasRole("admin");
  const isEmployee = hasRole("employee");

  // If user has no roles, show message
  if (!isAdmin && !isEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground mb-4">
            Akun Anda belum memiliki role. Silakan hubungi admin untuk mendapatkan akses.
          </p>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    );
  }

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/users", label: "Manajemen User", icon: Users },
    { href: "/dashboard/treatments", label: "Kelola Treatment", icon: Scissors },
    { href: "/dashboard/testimonials", label: "Testimoni", icon: MessageSquare },
    { href: "/dashboard/reports", label: "Laporan Keuangan", icon: FileText },
    { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
  ];

  const employeeLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/transaction", label: "Input Transaksi", icon: PlusCircle },
    { href: "/dashboard/history", label: "Riwayat", icon: History },
  ];

  const navLinks = isAdmin ? adminLinks : employeeLinks;

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden h-10 w-10 bg-background shadow-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-3 lg:p-4 border-b border-sidebar-border">
            <Link to="/" className="font-heading text-base lg:text-lg font-bold text-gradient">
              Vilia Baby Spa
            </Link>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">
              {isAdmin ? "Admin" : "Karyawan"}
            </p>
          </div>

          <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 lg:px-4 lg:py-3 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <link.icon className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                <span className="truncate">{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-3 lg:p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground text-sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-w-0">
        <div className="p-4 pt-16 lg:pt-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
