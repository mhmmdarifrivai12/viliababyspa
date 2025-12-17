import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTreatments, getDiscountedPrice } from "@/hooks/useTreatments";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Printer, Percent } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useReactToPrint } from "react-to-print";

interface TransactionData {
  id: string;
  service_date: string;
  customer_name: string;
  customer_age: string;
  customer_address: string;
  payment_method: string;
  total_amount: number;
  subtotal: number;
  discount_active: boolean;
  discount_percentage: number;
  items: { name: string; price: number; quantity: number }[];
}

function Receipt({ data }: { data: TransactionData }) {
  return (
    <div className="p-6 bg-white text-black max-w-sm mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Vilia Baby Spa</h2>
        <p className="text-sm">Struk Pembayaran</p>
      </div>
      
      <div className="border-t border-dashed border-gray-400 py-2 text-sm">
        <p>Tanggal: {new Date(data.service_date).toLocaleDateString("id-ID")}</p>
        <p>No: {data.id.slice(0, 8).toUpperCase()}</p>
      </div>
      
      <div className="border-t border-dashed border-gray-400 py-2 text-sm">
        <p>Pelanggan: {data.customer_name}</p>
        {data.customer_age && <p>Umur: {data.customer_age}</p>}
        {data.customer_address && <p>Alamat: {data.customer_address}</p>}
      </div>
      
      <div className="border-t border-dashed border-gray-400 py-2">
        <table className="w-full text-sm">
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1">{item.name}</td>
                <td className="text-right">
                  {new Intl.NumberFormat("id-ID").format(item.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="border-t border-dashed border-gray-400 py-2">
        {data.discount_active && data.discount_percentage > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>Rp {new Intl.NumberFormat("id-ID").format(data.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Diskon ({data.discount_percentage}%)</span>
              <span>- Rp {new Intl.NumberFormat("id-ID").format(data.subtotal - data.total_amount)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between font-bold mt-1">
          <span>TOTAL</span>
          <span>Rp {new Intl.NumberFormat("id-ID").format(data.total_amount)}</span>
        </div>
        <p className="text-sm mt-1">
          Pembayaran: {data.payment_method === "transfer" ? "Transfer Bank" : "Cash"}
        </p>
      </div>
      
      <div className="text-center mt-4 text-sm">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p>WA: 082210400961</p>
      </div>
    </div>
  );
}

export default function TransactionForm() {
  const { user } = useAuth();
  const { data: treatments, isLoading: loadingTreatments } = useTreatments();
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [customerName, setCustomerName] = useState("");
  const [customerAge, setCustomerAge] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [lastTransaction, setLastTransaction] = useState<TransactionData | null>(null);
  const [transactionDiscountActive, setTransactionDiscountActive] = useState(false);
  const [transactionDiscountPercentage, setTransactionDiscountPercentage] = useState("");
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  const calculateSubtotal = () => {
    if (!treatments) return 0;
    return selectedTreatments.reduce((sum, id) => {
      const treatment = treatments.find((t) => t.id === id);
      return sum + (treatment ? getDiscountedPrice(treatment) : 0);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (transactionDiscountActive && transactionDiscountPercentage) {
      const discountAmount = subtotal * (Number(transactionDiscountPercentage) / 100);
      return Math.round(subtotal - discountAmount);
    }
    return subtotal;
  };

  const handleTreatmentToggle = (treatmentId: string) => {
    setSelectedTreatments((prev) =>
      prev.includes(treatmentId)
        ? prev.filter((id) => id !== treatmentId)
        : [...prev, treatmentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast({
        title: "Error",
        description: "Nama pelanggan harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (selectedTreatments.length === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal 1 treatment",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Pilih metode pembayaran",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const subtotal = calculateSubtotal();
      const total = calculateTotal();
      const discountPct = transactionDiscountActive ? Number(transactionDiscountPercentage) || 0 : 0;
      
      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .insert({
          employee_id: user?.id,
          service_date: serviceDate,
          customer_name: customerName.trim(),
          customer_age: customerAge.trim() || null,
          customer_address: customerAddress.trim() || null,
          payment_method: paymentMethod,
          total_amount: total,
          discount_active: transactionDiscountActive,
          discount_percentage: discountPct,
        })
        .select()
        .single();

      if (txError) throw txError;

      // Create transaction items
      const items = selectedTreatments.map((id) => {
        const treatment = treatments?.find((t) => t.id === id);
        const finalPrice = treatment ? getDiscountedPrice(treatment) : 0;
        return {
          transaction_id: transaction.id,
          treatment_id: id,
          treatment_name: treatment?.name || "",
          price: finalPrice,
          quantity: 1,
        };
      });

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(items);

      if (itemsError) throw itemsError;

      // Save for receipt
      setLastTransaction({
        id: transaction.id,
        service_date: serviceDate,
        customer_name: customerName,
        customer_age: customerAge,
        customer_address: customerAddress,
        payment_method: paymentMethod,
        subtotal: subtotal,
        total_amount: total,
        discount_active: transactionDiscountActive,
        discount_percentage: discountPct,
        items: items.map((i) => ({
          name: i.treatment_name,
          price: Number(i.price),
          quantity: i.quantity,
        })),
      });

      toast({
        title: "Berhasil",
        description: "Transaksi berhasil disimpan",
      });

      // Reset form
      setCustomerName("");
      setCustomerAge("");
      setCustomerAddress("");
      setSelectedTreatments([]);
      setPaymentMethod("");
      setTransactionDiscountActive(false);
      setTransactionDiscountPercentage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Input Transaksi</h1>
        <p className="text-muted-foreground">
          Catat transaksi layanan pelanggan
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Form Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal Pelayanan</Label>
                  <Input
                    id="date"
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment">Metode Pembayaran</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="transfer">Transfer Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nama Pelanggan *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama pelanggan"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Umur Bayi/Ibu</Label>
                  <Input
                    id="age"
                    value={customerAge}
                    onChange={(e) => setCustomerAge(e.target.value)}
                    placeholder="Contoh: 3 bulan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Alamat pelanggan"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pilih Treatment *</Label>
                {loadingTreatments ? (
                  <p className="text-sm text-muted-foreground">Memuat...</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {treatments?.map((treatment) => {
                      const hasDiscount = treatment.discount_active && treatment.discount_percentage && treatment.discount_percentage > 0;
                      const finalPrice = getDiscountedPrice(treatment);
                      return (
                        <div
                          key={treatment.id}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded"
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={treatment.id}
                              checked={selectedTreatments.includes(treatment.id)}
                              onCheckedChange={() => handleTreatmentToggle(treatment.id)}
                            />
                            <label
                              htmlFor={treatment.id}
                              className="text-sm cursor-pointer flex items-center gap-2"
                            >
                              {treatment.name}
                              {hasDiscount && (
                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                  {treatment.discount_percentage}% OFF
                                </span>
                              )}
                            </label>
                          </div>
                          <div className="text-right">
                            {hasDiscount ? (
                              <>
                                <span className="text-xs line-through text-muted-foreground block">
                                  Rp {new Intl.NumberFormat("id-ID").format(treatment.price)}
                                </span>
                                <span className="text-sm font-medium text-green-600">
                                  Rp {new Intl.NumberFormat("id-ID").format(finalPrice)}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-medium">
                                Rp {new Intl.NumberFormat("id-ID").format(treatment.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                {/* Transaction Discount */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="txDiscount" className="font-medium">Diskon Transaksi</Label>
                    </div>
                    <Switch
                      id="txDiscount"
                      checked={transactionDiscountActive}
                      onCheckedChange={setTransactionDiscountActive}
                    />
                  </div>
                  {transactionDiscountActive && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={transactionDiscountPercentage}
                        onChange={(e) => setTransactionDiscountPercentage(e.target.value)}
                        placeholder="0"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="space-y-2">
                  {transactionDiscountActive && transactionDiscountPercentage && Number(transactionDiscountPercentage) > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Subtotal:</span>
                        <span>Rp {new Intl.NumberFormat("id-ID").format(calculateSubtotal())}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Diskon ({transactionDiscountPercentage}%):</span>
                        <span>- Rp {new Intl.NumberFormat("id-ID").format(calculateSubtotal() - calculateTotal())}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-bold text-primary">
                      Rp {new Intl.NumberFormat("id-ID").format(calculateTotal())}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Transaksi
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Receipt Preview */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preview Struk</span>
              {lastTransaction && (
                <Button size="sm" variant="outline" onClick={() => handlePrint()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastTransaction ? (
              <div ref={receiptRef}>
                <Receipt data={lastTransaction} />
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Struk akan muncul setelah transaksi disimpan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
