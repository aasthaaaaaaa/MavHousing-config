"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Banknote, Building2, Receipt, DollarSign } from "lucide-react";

interface Payment {
  paymentId: number;
  amountPaid: string;
  method: string;
  transactionDate: string;
  isSuccessful: boolean;
  lease: {
    user: { netId: string; fName: string; lName: string };
    unit?: { unitNumber: string; property: { name: string } };
  };
}

const METHOD_ICONS: Record<string, React.ReactNode> = {
  CREDIT_CARD: <CreditCard className="h-4 w-4 inline mr-1" />,
  DEBIT_CARD: <CreditCard className="h-4 w-4 inline mr-1" />,
  BANK_TRANSFER: <Building2 className="h-4 w-4 inline mr-1" />,
  CHECK: <Receipt className="h-4 w-4 inline mr-1" />,
  CASH: <Banknote className="h-4 w-4 inline mr-1" />,
};

const ALL_METHODS = ["CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "CHECK", "CASH"];

function formatMoney(val: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(parseFloat(val));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function StaffPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMethod, setFilterMethod] = useState("ALL");

  useEffect(() => { fetchPayments(); }, []);

  async function fetchPayments() {
    try {
      const res = await fetch("http://localhost:3009/payment/all");
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  const filtered = payments.filter(p => filterMethod === "ALL" || p.method === filterMethod);

  const totalRevenue = filtered
    .filter(p => p.isSuccessful)
    .reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);

  const stats = {
    total: filtered.length,
    successful: filtered.filter(p => p.isSuccessful).length,
    revenue: totalRevenue,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" /> Payment Records
        </h1>
        <p className="text-muted-foreground">All tenant payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Transactions", value: stats.total, color: "text-blue-600" },
          { label: "Successful", value: stats.successful, color: "text-green-600" },
          { label: "Total Revenue", value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(stats.revenue), color: "text-primary" },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <CardContent className="pt-4 pb-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterMethod} onValueChange={setFilterMethod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Methods</SelectItem>
            {ALL_METHODS.map(m => (
              <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading payments...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No payments found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property / Unit</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.paymentId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.lease.user.fName} {p.lease.user.lName}</p>
                        <p className="text-xs text-muted-foreground">{p.lease.user.netId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.lease.unit
                        ? `${p.lease.unit.property.name} / Unit ${p.lease.unit.unitNumber}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center text-sm">
                        {METHOD_ICONS[p.method]}
                        {p.method.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(p.transactionDate)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatMoney(p.amountPaid)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isSuccessful ? "outline" : "destructive"}>
                        {p.isSuccessful ? "✓ Success" : "✕ Failed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
