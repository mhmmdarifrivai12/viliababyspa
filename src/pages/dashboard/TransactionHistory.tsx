import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteAlertDialog } from "@/components/ui/delete-alert-dialog";
import { Eye, Trash2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { PrintReport } from "@/components/reports/PrintReport";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function TransactionHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [shouldPrint, setShouldPrint] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Struk Transaksi",
  });

  // Trigger print when state is ready
  useEffect(() => {
    if (shouldPrint && selectedTx) {
      const timer = setTimeout(() => {
        handlePrint();
        setShouldPrint(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [shouldPrint, selectedTx, handlePrint]);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["my-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          items:transaction_items(*)
        `)
        .eq("employee_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete transaction items first
      const { error: itemsError } = await supabase
        .from("transaction_items")
        .delete()
        .eq("transaction_id", id);
      if (itemsError) throw itemsError;

      // Then delete transaction
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
      toast({
        title: "Berhasil",
        description: "Transaksi berhasil dihapus",
      });
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (tx: any) => {
    setTransactionToDelete(tx);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      deleteMutation.mutate(transactionToDelete.id);
    }
  };

  const handleViewAndPrint = useCallback((tx: any) => {
    setSelectedTx(tx);
  }, []);

  const handlePrintFromDialog = useCallback(() => {
    setShouldPrint(true);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-heading font-bold">Riwayat Transaksi</h1>
        <p className="text-sm text-muted-foreground">
          Daftar transaksi yang Anda input
        </p>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Tanggal</TableHead>
                    <TableHead className="text-xs md:text-sm">Pelanggan</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs md:text-sm">Treatment</TableHead>
                    <TableHead className="text-xs md:text-sm">Pembayaran</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Total</TableHead>
                    <TableHead className="text-xs md:text-sm w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs md:text-sm py-2 md:py-4">
                        {new Date(tx.service_date).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="py-2 md:py-4">
                        <div>
                          <p className="font-medium text-xs md:text-sm">{tx.customer_name}</p>
                          {tx.customer_age && (
                            <p className="text-[10px] md:text-xs text-muted-foreground">
                              {tx.customer_age}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-2 md:py-4">
                        <div className="flex flex-wrap gap-1">
                          {tx.items?.slice(0, 2).map((item: any) => (
                            <Badge key={item.id} variant="secondary" className="text-[10px] md:text-xs">
                              {item.treatment_name}
                            </Badge>
                          ))}
                          {tx.items && tx.items.length > 2 && (
                            <Badge variant="outline" className="text-[10px] md:text-xs">
                              +{tx.items.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 md:py-4">
                        <Badge 
                          variant={tx.payment_method === "cash" ? "default" : "secondary"}
                          className="text-[10px] md:text-xs"
                        >
                          {tx.payment_method === "cash" ? "Cash" : "Transfer"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs md:text-sm py-2 md:py-4">
                        {formatCurrency(Number(tx.total_amount))}
                      </TableCell>
                      <TableCell className="py-2 md:py-4">
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => handleViewAndPrint(tx)}
                          >
                            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 md:h-8 md:w-8 text-destructive"
                            onClick={() => handleDeleteClick(tx)}
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 md:py-12 text-muted-foreground">
              <p className="text-sm">Belum ada transaksi</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Preview Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Preview Struk</DialogTitle>
          </DialogHeader>
          
          {selectedTx && (
            <>
              <div ref={printRef}>
                <PrintReport
                  type="single"
                  transactions={[selectedTx]}
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handlePrintFromDialog} size="sm">
                  Cetak Struk
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Transaksi"
        description={`Apakah Anda yakin ingin menghapus transaksi "${transactionToDelete?.customer_name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
