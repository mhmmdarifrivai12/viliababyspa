import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteAlertDialog } from "@/components/ui/delete-alert-dialog";
import { FileText, Filter, ChevronDown, Calendar, Receipt, Trash2, Eye } from "lucide-react";
import { PrintReport } from "@/components/reports/PrintReport";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function FinancialReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  
  // PDF Export states
  const [printType, setPrintType] = useState<"all" | "daily" | "single">("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [isTransactionPickerOpen, setIsTransactionPickerOpen] = useState(false);
  const [shouldPrint, setShouldPrint] = useState(false);
  
  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  
  // Preview states
  const [previewTransaction, setPreviewTransaction] = useState<any>(null);
  const [shouldPrintPreview, setShouldPrintPreview] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const previewPrintRef = useRef<HTMLDivElement>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["financial-report", startDate, endDate, paymentFilter],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select(`
          *,
          items:transaction_items(treatment_name, price, quantity)
        `)
        .gte("service_date", startDate)
        .lte("service_date", endDate)
        .order("service_date", { ascending: false });

      if (paymentFilter !== "all") {
        query = query.eq("payment_method", paymentFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
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
      queryClient.invalidateQueries({ queryKey: ["financial-report"] });
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

  const totals = transactions?.reduce(
    (acc, tx) => {
      const amount = Number(tx.total_amount);
      acc.total += amount;
      if (tx.payment_method === "cash") {
        acc.cash += amount;
      } else {
        acc.transfer += amount;
      }
      return acc;
    },
    { total: 0, cash: 0, transfer: 0 }
  ) || { total: 0, cash: 0, transfer: 0 };

  // Get unique dates from transactions
  const uniqueDates = [...new Set(transactions?.map(tx => tx.service_date) || [])].sort().reverse();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Laporan_${printType === "single" ? "Transaksi" : printType === "daily" ? selectedDate : `${startDate}_${endDate}`}`,
  });

  const handlePreviewPrint = useReactToPrint({
    contentRef: previewPrintRef,
    documentTitle: "Struk_Transaksi",
  });

  // Trigger print when state is ready
  useEffect(() => {
    if (shouldPrint) {
      const timer = setTimeout(() => {
        handlePrint();
        setShouldPrint(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [shouldPrint, handlePrint]);

  // Trigger preview print when ready
  useEffect(() => {
    if (shouldPrintPreview && previewTransaction) {
      const timer = setTimeout(() => {
        handlePreviewPrint();
        setShouldPrintPreview(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [shouldPrintPreview, previewTransaction, handlePreviewPrint]);

  const handleExportAll = useCallback(() => {
    setPrintType("all");
    setSelectedDate("");
    setSelectedTransaction(null);
    setShouldPrint(true);
  }, []);

  const handleExportDaily = useCallback((date: string) => {
    setPrintType("daily");
    setSelectedDate(date);
    setSelectedTransaction(null);
    setIsDayPickerOpen(false);
    setShouldPrint(true);
  }, []);

  const handleExportSingle = useCallback((tx: any) => {
    setPrintType("single");
    setSelectedTransaction(tx);
    setSelectedDate("");
    setIsTransactionPickerOpen(false);
    setShouldPrint(true);
  }, []);

  const getPrintTransactions = useCallback(() => {
    if (printType === "single" && selectedTransaction) {
      return [selectedTransaction];
    }
    if (printType === "daily" && selectedDate) {
      return transactions?.filter(tx => tx.service_date === selectedDate) || [];
    }
    return transactions || [];
  }, [printType, selectedTransaction, selectedDate, transactions]);

  const handleDeleteClick = (tx: any) => {
    setTransactionToDelete(tx);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      deleteMutation.mutate(transactionToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Laporan Keuangan</h1>
        <p className="text-muted-foreground">
          Lihat dan export laporan transaksi dalam format PDF
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={!transactions || transactions.length === 0}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  <DropdownMenuItem onClick={handleExportAll}>
                    <FileText className="h-4 w-4 mr-2" />
                    Semua Hasil Filter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDayPickerOpen(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Per Hari
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsTransactionPickerOpen(true)}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Per Transaksi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Pendapatan</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totals.total)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Cash</p>
            <p className="text-2xl font-bold">
              {formatCurrency(totals.cash)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Transfer</p>
            <p className="text-2xl font-bold">
              {formatCurrency(totals.transfer)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>
            Detail Transaksi ({transactions?.length || 0} transaksi)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead>Pembayaran</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {new Date(tx.service_date).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.customer_name}</p>
                          {tx.customer_address && (
                            <p className="text-xs text-muted-foreground">
                              {tx.customer_address}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tx.items?.map((item: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {item.treatment_name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.payment_method === "cash" ? "default" : "secondary"}>
                          {tx.payment_method === "cash" ? "Cash" : "Transfer"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(tx.total_amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewTransaction(tx)}
                            title="Preview Struk"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExportSingle(tx)}
                            title="Export PDF"
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteClick(tx)}
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Tidak ada transaksi dalam periode ini</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Picker Dialog */}
      <Dialog open={isDayPickerOpen} onOpenChange={setIsDayPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Tanggal</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {uniqueDates.length > 0 ? (
              uniqueDates.map((date) => {
                const dayTxs = transactions?.filter(tx => tx.service_date === date) || [];
                const dayTotal = dayTxs.reduce((sum, tx) => sum + Number(tx.total_amount), 0);
                return (
                  <Button
                    key={date}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => handleExportDaily(date)}
                  >
                    <span>{new Date(date).toLocaleDateString("id-ID", { 
                      weekday: "long", 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}</span>
                    <span className="text-muted-foreground">
                      {dayTxs.length} transaksi • {formatCurrency(dayTotal)}
                    </span>
                  </Button>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-4">Tidak ada tanggal tersedia</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Picker Dialog */}
      <Dialog open={isTransactionPickerOpen} onOpenChange={setIsTransactionPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pilih Transaksi</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {transactions && transactions.length > 0 ? (
              transactions.map((tx) => (
                <Button
                  key={tx.id}
                  variant="outline"
                  className="w-full justify-between text-left h-auto py-3"
                  onClick={() => handleExportSingle(tx)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{tx.customer_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(tx.service_date).toLocaleDateString("id-ID")} • {tx.items?.map((i: any) => i.treatment_name).join(", ")}
                    </span>
                  </div>
                  <span className="font-medium">{formatCurrency(Number(tx.total_amount))}</span>
                </Button>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">Tidak ada transaksi tersedia</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Dialog */}
      <Dialog open={!!previewTransaction} onOpenChange={(open) => !open && setPreviewTransaction(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Preview Struk</DialogTitle>
          </DialogHeader>
          
          {previewTransaction && (
            <>
              <div ref={previewPrintRef}>
                <PrintReport
                  type="single"
                  transactions={[previewTransaction]}
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setShouldPrintPreview(true)} size="sm">
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

      {/* Hidden Print Component */}
      <div className="hidden">
        <PrintReport
          ref={printRef}
          transactions={getPrintTransactions()}
          startDate={startDate}
          endDate={endDate}
          totals={totals}
          type={printType}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}
