"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, CheckCircle2, Receipt, Loader2, AlertCircle } from "lucide-react";
import { getPaymentStatusClass } from "@/lib/status-colors";

interface PaymentSummary {
  totalDue: number;
  totalPaid: number;
  balance: number;
  dueThisMonth: number;
  lease: {
    startDate: string;
    endDate: string;
    unit?: { unitNumber: string; property: { name: string } };
  };
}

interface Payment {
  paymentId: number;
  amountPaid: string;
  method: string;
  transactionDate: string;
  isSuccessful: boolean;
}

const PAYMENT_METHODS = [
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer (ACH)" },
  { value: "CHECK", label: "Check" },
];

function getCardType(number: string) {
  const cleanNumber = number.replace(/\D/g, "");
  if (cleanNumber.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return "Mastercard";
  if (/^3[47]/.test(cleanNumber)) return "Amex";
  if (/^6011/.test(cleanNumber) || /^65/.test(cleanNumber) || /^64[4-9]/.test(cleanNumber) || /^622/.test(cleanNumber)) return "Discover";
  return "";
}

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtShortMonth(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CREDIT_CARD");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [checkNumber, setCheckNumber] = useState("");

  useEffect(() => {
    if (user?.userId) fetchAll();
  }, [user]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [sumRes, payRes] = await Promise.all([
        fetch(`http://localhost:3009/payment/summary?userId=${user!.userId}`),
        fetch(`http://localhost:3009/payment/my-payments?userId=${user!.userId}`),
      ]);
      let sumData = null;
      let payData = [];
      try { if (sumRes.ok) sumData = await sumRes.json(); } catch (e) {}
      try { if (payRes.ok) payData = await payRes.json(); } catch (e) {}

      setSummary(sumData);
      setPayments(Array.isArray(payData) ? payData : []);
      if (sumData?.dueThisMonth) setAmount(String(sumData.dueThisMonth));
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setPayError("Enter a valid amount."); return; }

    // Validations based on method
    if (method === "CREDIT_CARD" || method === "DEBIT_CARD") {
      if (!cardNumber || !cardExpiry || !cardCvv || !nameOnCard) {
        setPayError("Please fill out all card details.");
        return;
      }
    } else if (method === "BANK_TRANSFER") {
      if (!accountNumber || !routingNumber) {
        setPayError("Please provide account and routing numbers.");
        return;
      }
    } else if (method === "CHECK") {
      if (!accountNumber || !routingNumber || !checkNumber) {
        setPayError("Please provide account, routing, and check numbers.");
        return;
      }
    }

    setPayError("");
    setPaying(true);
    try {
      await fetch("http://localhost:3009/payment/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.userId, amount: parseFloat(amount), method }),
      });
      setDialogOpen(false);
      // Reset fields
      setCardNumber(""); setCardExpiry(""); setCardCvv(""); setNameOnCard("");
      setAccountNumber(""); setRoutingNumber(""); setCheckNumber("");
      await fetchAll();
    } catch {
      setPayError("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  const balancePct = summary ? Math.min(100, (summary.totalPaid / summary.totalDue) * 100) : 0;
  const totalHistory = payments.reduce((s, p) => s + parseFloat(p.amountPaid), 0);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="h-10 w-56 bg-muted animate-pulse rounded-xl" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </div>
        <div className="h-20 bg-muted animate-pulse rounded-2xl" />
        <div className="h-64 bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 text-center mt-12">
        <AlertCircle className="mx-auto h-10 w-10 text-yellow-500 mb-3" />
        <h2 className="text-xl font-semibold mb-2">No Active Lease</h2>
        <p className="text-muted-foreground">You need an active lease to view payment information.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your rent payments and view payment history</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} variant="outline">
          <Receipt className="h-4 w-4 mr-2" /> Make a Payment
        </Button>
      </div>

      {/* 3 stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5" style={{ animationDelay: "80ms" }}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Balance Due</p>
                <p className={`text-3xl font-bold ${summary.balance > 0 ? "text-destructive" : "text-green-500"}`}>
                  {fmt(summary.balance)}
                </p>
                {summary.lease?.unit && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {summary.lease.unit.property.name} · Unit {summary.lease.unit.unitNumber}
                  </p>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5" style={{ animationDelay: "150ms" }}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Paid (YTD)</p>
                <p className="text-3xl font-bold">{fmt(summary.totalPaid)}</p>
                <p className="text-xs text-muted-foreground mt-2">{payments.length} payment{payments.length !== 1 ? "s" : ""} recorded</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5" style={{ animationDelay: "220ms" }}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Annual Total</p>
                <p className="text-3xl font-bold">{fmt(summary.totalDue)}</p>
                <p className="text-xs text-muted-foreground mt-2">Full lease value</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress card */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl" style={{ animationDelay: "290ms" }}>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="font-semibold">Annual Payment Progress</p>
              <p className="text-sm text-muted-foreground">
                You&apos;ve paid {fmt(summary.totalPaid)} of {fmt(summary.totalDue)} for the lease term
              </p>
            </div>
            <span className="text-sm font-semibold text-primary">{balancePct.toFixed(1)}%</span>
          </div>
          <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${balancePct}%` }}
            />
          </div>
          {summary.lease && (
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{fmtShortMonth(summary.lease.startDate)}</span>
              <span>{fmtShortMonth(summary.lease.endDate)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both rounded-2xl" style={{ animationDelay: "360ms" }}>
        <CardHeader className="pb-3">
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View all your past transactions and receipts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-8">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-8">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="p-4">
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p, idx) => (
                  <TableRow key={p.paymentId} className="transition-colors">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap pl-8">
                      {fmtDate(p.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">Monthly Rent Payment</p>
                      <p className="text-xs text-muted-foreground">PAY-{String(p.paymentId).padStart(3, "0")}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.method.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getPaymentStatusClass(p.isSuccessful)} rounded-full px-2.5`}>
                        {p.isSuccessful ? <><CheckCircle2 className="h-3 w-3 mr-1" />Completed</> : "Failed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold pr-8">
                      {fmt(parseFloat(p.amountPaid))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {payments.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
              <span>Showing {payments.length} transaction{payments.length !== 1 ? "s" : ""}</span>
              <span>Total: <span className="font-semibold text-foreground">{fmt(totalHistory)}</span></span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Make a Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Make a Payment</DialogTitle>
            <DialogDescription>Payments are simulated — no real charges are made.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-5 pt-2">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-base h-11"
              />
            </div>

            {/* Payment method — card grid */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => { setMethod(m.value); setPayError(""); }}
                    className={`flex items-start justify-between p-3 rounded-lg border text-left transition-colors ${
                      method === m.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium leading-none">{m.label}</p>
                    </div>
                    <div className={`mt-0.5 h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 ${method === m.value ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Fields */}
            {(method === "CREDIT_CARD" || method === "DEBIT_CARD") && (
              <div className="space-y-4 pt-2 border-t mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <span className="text-xs font-semibold text-primary">{getCardType(cardNumber)}</span>
                  </div>
                  <Input id="cardNumber" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" value={cardCvv} onChange={e => setCardCvv(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameOnCard">Name on Card</Label>
                  <Input id="nameOnCard" placeholder="John Doe" value={nameOnCard} onChange={e => setNameOnCard(e.target.value)} />
                </div>
              </div>
            )}

            {(method === "BANK_TRANSFER" || method === "CHECK") && (
              <div className="space-y-4 pt-2 border-t mt-4">
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input id="routingNumber" placeholder="000000000" value={routingNumber} onChange={e => setRoutingNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input id="accountNumber" placeholder="000000000000" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                </div>
                {method === "CHECK" && (
                  <div className="space-y-2">
                    <Label htmlFor="checkNumber">Check Number</Label>
                    <Input id="checkNumber" placeholder="1001" value={checkNumber} onChange={e => setCheckNumber(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {payError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {payError}
              </p>
            )}

            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="agree" checked={agreed} onCheckedChange={v => setAgreed(!!v)} />
                <Label htmlFor="agree" className="text-sm font-normal cursor-pointer">
                  I agree to the terms and conditions
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="emailOptIn" checked={emailOptIn} onCheckedChange={v => setEmailOptIn(!!v)} />
                <Label htmlFor="emailOptIn" className="text-sm font-normal cursor-pointer">
                  Allow us to send you payment confirmations
                </Label>
              </div>
            </div>

            <Separator />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={paying}>
                {paying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : `Pay ${amount ? fmt(parseFloat(amount)) : ""}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
