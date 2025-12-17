import { forwardRef } from "react";

interface TransactionItem {
  treatment_name: string;
  price: number;
  quantity: number;
}

interface Transaction {
  id: string;
  service_date: string;
  customer_name: string;
  customer_age?: string;
  customer_address?: string;
  payment_method: string;
  total_amount: number;
  notes?: string;
  items?: TransactionItem[];
  discount_active?: boolean;
  discount_percentage?: number;
}

interface PrintReportProps {
  transactions: Transaction[];
  startDate?: string;
  endDate?: string;
  totals?: { total: number; cash: number; transfer: number };
  type: "all" | "daily" | "single";
  selectedDate?: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const PrintReport = forwardRef<HTMLDivElement, PrintReportProps>(
  ({ transactions, startDate = "", endDate = "", totals = { total: 0, cash: 0, transfer: 0 }, type, selectedDate }, ref) => {
    // Group transactions by date for daily report
    const groupedByDate = transactions.reduce((acc, tx) => {
      const date = tx.service_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);

    const calculateDayTotal = (txs: Transaction[]) => {
      return txs.reduce((sum, tx) => sum + Number(tx.total_amount), 0);
    };

    // Calculate subtotal (before transaction discount)
    const calculateSubtotal = (tx: Transaction) => {
      return tx.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || Number(tx.total_amount);
    };

    return (
      <div ref={ref} className="p-8 bg-white text-black min-h-screen print:p-4">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold">VILIA BABY SPA</h1>
          <p className="text-sm text-gray-600">Laporan Keuangan</p>
          {type === "single" && transactions.length === 1 ? (
            <p className="text-sm mt-2">
              Tanggal: {formatDate(transactions[0].service_date)}
            </p>
          ) : type === "daily" && selectedDate ? (
            <p className="text-sm mt-2">Tanggal: {formatDate(selectedDate)}</p>
          ) : (
            <p className="text-sm mt-2">
              Periode: {formatDate(startDate)} - {formatDate(endDate)}
            </p>
          )}
        </div>

        {/* Single Transaction Receipt */}
        {type === "single" && transactions.length === 1 && (
          <div className="max-w-md mx-auto">
            <div className="border border-gray-300 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">No. Transaksi:</span>
                  <span className="font-mono text-sm">{transactions[0].id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pelanggan:</span>
                  <span className="font-medium">{transactions[0].customer_name}</span>
                </div>
                {transactions[0].customer_age && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Usia:</span>
                    <span>{transactions[0].customer_age}</span>
                  </div>
                )}
                {transactions[0].customer_address && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Alamat:</span>
                    <span className="text-right max-w-[200px]">{transactions[0].customer_address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Pembayaran:</span>
                  <span>{transactions[0].payment_method === "cash" ? "Cash" : "Transfer"}</span>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="font-medium mb-2">Treatment:</p>
                  <div className="space-y-2">
                    {transactions[0].items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.treatment_name} x{item.quantity}
                        </span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Show subtotal and discount if applicable */}
                {transactions[0].discount_active && transactions[0].discount_percentage && transactions[0].discount_percentage > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal(transactions[0]))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Diskon ({transactions[0].discount_percentage}%):</span>
                      <span>-{formatCurrency(calculateSubtotal(transactions[0]) * Number(transactions[0].discount_percentage) / 100)}</span>
                    </div>
                  </div>
                )}

                {transactions[0].notes && (
                  <div className="border-t pt-4">
                    <p className="text-gray-600 text-sm">Catatan:</p>
                    <p className="text-sm">{transactions[0].notes}</p>
                  </div>
                )}

                <div className="border-t-2 border-black pt-4 mt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(Number(transactions[0].total_amount))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Report */}
        {type === "daily" && selectedDate && groupedByDate[selectedDate] && (
          <div>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">No</th>
                  <th className="border border-gray-300 p-2 text-left">Pelanggan</th>
                  <th className="border border-gray-300 p-2 text-left">Alamat</th>
                  <th className="border border-gray-300 p-2 text-left">Treatment</th>
                  <th className="border border-gray-300 p-2 text-center">Pembayaran</th>
                  <th className="border border-gray-300 p-2 text-left">Catatan</th>
                  <th className="border border-gray-300 p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {groupedByDate[selectedDate].map((tx, idx) => (
                  <tr key={tx.id}>
                    <td className="border border-gray-300 p-2">{idx + 1}</td>
                    <td className="border border-gray-300 p-2">
                      <div>
                        {tx.customer_name}
                        {tx.customer_age && <span className="text-xs text-gray-500 block">{tx.customer_age}</span>}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2 text-xs">{tx.customer_address || "-"}</td>
                    <td className="border border-gray-300 p-2">
                      {tx.items?.map((i) => i.treatment_name).join(", ")}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {tx.payment_method === "cash" ? "Cash" : "Transfer"}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs">{tx.notes || "-"}</td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatCurrency(Number(tx.total_amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={6} className="border border-gray-300 p-2 text-right">
                    Total Hari Ini:
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatCurrency(calculateDayTotal(groupedByDate[selectedDate]))}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p className="text-sm text-gray-600 mt-4">
              Jumlah Transaksi: {groupedByDate[selectedDate].length}
            </p>
          </div>
        )}

        {/* All Filtered Results */}
        {type === "all" && (
          <div>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border border-gray-300 rounded p-4 text-center">
                <p className="text-sm text-gray-600">Total Pendapatan</p>
                <p className="text-xl font-bold">{formatCurrency(totals.total)}</p>
              </div>
              <div className="border border-gray-300 rounded p-4 text-center">
                <p className="text-sm text-gray-600">Cash</p>
                <p className="text-xl font-bold">{formatCurrency(totals.cash)}</p>
              </div>
              <div className="border border-gray-300 rounded p-4 text-center">
                <p className="text-sm text-gray-600">Transfer</p>
                <p className="text-xl font-bold">{formatCurrency(totals.transfer)}</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">No</th>
                  <th className="border border-gray-300 p-2 text-left">Tanggal</th>
                  <th className="border border-gray-300 p-2 text-left">Pelanggan</th>
                  <th className="border border-gray-300 p-2 text-left">Alamat</th>
                  <th className="border border-gray-300 p-2 text-left">Treatment</th>
                  <th className="border border-gray-300 p-2 text-center">Pembayaran</th>
                  <th className="border border-gray-300 p-2 text-left">Catatan</th>
                  <th className="border border-gray-300 p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={tx.id}>
                    <td className="border border-gray-300 p-2">{idx + 1}</td>
                    <td className="border border-gray-300 p-2">
                      {new Date(tx.service_date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div>
                        {tx.customer_name}
                        {tx.customer_age && <span className="text-xs text-gray-500 block">{tx.customer_age}</span>}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2 text-xs">{tx.customer_address || "-"}</td>
                    <td className="border border-gray-300 p-2">
                      {tx.items?.map((i) => i.treatment_name).join(", ")}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {tx.payment_method === "cash" ? "Cash" : "Transfer"}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs">{tx.notes || "-"}</td>
                    <td className="border border-gray-300 p-2 text-right">
                      {formatCurrency(Number(tx.total_amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={7} className="border border-gray-300 p-2 text-right">
                    TOTAL:
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatCurrency(totals.total)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <p className="text-sm text-gray-600 mt-4">
              Jumlah Transaksi: {transactions.length}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <p>Dicetak pada: {new Date().toLocaleString("id-ID")}</p>
        </div>
      </div>
    );
  }
);

PrintReport.displayName = "PrintReport";
