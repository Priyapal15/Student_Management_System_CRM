import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, DollarSign, Receipt } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function FeesPage() {
  const queryClient = useQueryClient();
  const [feeOpen, setFeeOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [feeForm, setFeeForm] = useState({ course: "", total_fee: "", discount_percent: "0", installments: "1" });
  const [payForm, setPayForm] = useState({ student_id: "", amount: "", payment_method: "Cash", notes: "" });

  const { data: feeStructures } = useQuery({
    queryKey: ["fee-structures"],
    queryFn: async () => {
      const { data } = await supabase.from("fee_structures").select("*").order("course");
      return data || [];
    },
  });

  const { data: students } = useQuery({
    queryKey: ["students-for-fees"],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*").eq("status", "Active");
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("*, students(name, student_id)").order("payment_date", { ascending: false });
      return data || [];
    },
  });

  const addFeeStructure = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fee_structures").insert({
        course: feeForm.course,
        total_fee: parseFloat(feeForm.total_fee),
        discount_percent: parseFloat(feeForm.discount_percent),
        installments: parseInt(feeForm.installments),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
      setFeeOpen(false);
      setFeeForm({ course: "", total_fee: "", discount_percent: "0", installments: "1" });
      toast({ title: "Fee structure added!" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addPayment = useMutation({
    mutationFn: async () => {
      const receipt = `REC-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("payments").insert({
        student_id: payForm.student_id,
        amount: parseFloat(payForm.amount),
        payment_method: payForm.payment_method,
        receipt_number: receipt,
        notes: payForm.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setPayOpen(false);
      setPayForm({ student_id: "", amount: "", payment_method: "Cash", notes: "" });
      toast({ title: "Payment recorded!" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fees & Payments</h1>
            <p className="text-sm text-muted-foreground">Manage fee structures and track payments</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={feeOpen} onOpenChange={setFeeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Fee Structure</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Fee Structure</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Course *</Label><Input value={feeForm.course} onChange={(e) => setFeeForm({...feeForm, course: e.target.value})} /></div>
                  <div><Label>Total Fee (₹) *</Label><Input type="number" value={feeForm.total_fee} onChange={(e) => setFeeForm({...feeForm, total_fee: e.target.value})} /></div>
                  <div><Label>Discount %</Label><Input type="number" value={feeForm.discount_percent} onChange={(e) => setFeeForm({...feeForm, discount_percent: e.target.value})} /></div>
                  <div><Label>Installments</Label><Input type="number" value={feeForm.installments} onChange={(e) => setFeeForm({...feeForm, installments: e.target.value})} /></div>
                  <Button onClick={() => addFeeStructure.mutate()} disabled={!feeForm.course || !feeForm.total_fee} className="w-full gradient-primary text-primary-foreground">Save</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={payOpen} onOpenChange={setPayOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground"><DollarSign className="w-4 h-4 mr-2" /> Record Payment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Student *</Label>
                    <Select value={payForm.student_id} onValueChange={(v) => setPayForm({...payForm, student_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent>
                        {students?.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.student_id})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Amount (₹) *</Label><Input type="number" value={payForm.amount} onChange={(e) => setPayForm({...payForm, amount: e.target.value})} /></div>
                  <div>
                    <Label>Method</Label>
                    <Select value={payForm.payment_method} onValueChange={(v) => setPayForm({...payForm, payment_method: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Cash", "UPI", "Bank Transfer", "Card", "Cheque"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Notes</Label><Input value={payForm.notes} onChange={(e) => setPayForm({...payForm, notes: e.target.value})} /></div>
                  <Button onClick={() => addPayment.mutate()} disabled={!payForm.student_id || !payForm.amount} className="w-full gradient-primary text-primary-foreground">Record Payment</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="payments">
          <TabsList>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card className="glass-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments recorded</TableCell></TableRow>
                    ) : payments?.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.receipt_number}</TableCell>
                        <TableCell className="font-medium">{(p.students as any)?.name}</TableCell>
                        <TableCell className="font-semibold text-success">₹{Number(p.amount).toLocaleString()}</TableCell>
                        <TableCell>{p.payment_method}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structures">
            <Card className="glass-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Total Fee</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Installments</TableHead>
                      <TableHead>Net Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructures?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No fee structures defined</TableCell></TableRow>
                    ) : feeStructures?.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.course}</TableCell>
                        <TableCell>₹{Number(f.total_fee).toLocaleString()}</TableCell>
                        <TableCell>{f.discount_percent || 0}%</TableCell>
                        <TableCell>{f.installments}</TableCell>
                        <TableCell className="font-semibold">₹{(Number(f.total_fee) * (1 - (f.discount_percent || 0) / 100)).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
