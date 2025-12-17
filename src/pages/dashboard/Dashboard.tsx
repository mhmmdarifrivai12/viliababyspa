import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  Users,
  Calendar
} from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", user?.id, isAdmin],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split("T")[0];

      let query = supabase.from("transactions").select("*");
      
      if (!isAdmin) {
        query = query.eq("employee_id", user?.id);
      }

      const { data: transactions, error } = await query;
      if (error) throw error;

      const todayTransactions = transactions?.filter(
        (t) => t.service_date === today
      ) || [];
      const monthTransactions = transactions?.filter(
        (t) => t.service_date >= startOfMonth
      ) || [];

      return {
        totalTransactions: transactions?.length || 0,
        todayTransactions: todayTransactions.length,
        todayRevenue: todayTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0),
        monthRevenue: monthTransactions.reduce((sum, t) => sum + Number(t.total_amount), 0),
      };
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Ringkasan bisnis Vilia Baby Spa" : "Ringkasan aktivitas Anda"}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pendapatan Hari Ini
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(stats?.todayRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.todayTransactions || 0} transaksi
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pendapatan Bulan Ini
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.monthRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total bulan berjalan
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transaksi
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalTransactions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Semua transaksi" : "Transaksi Anda"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tanggal
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date().toLocaleDateString("id-ID", { 
                  day: "numeric",
                  month: "short"
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("id-ID", { 
                  weekday: "long"
                })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
