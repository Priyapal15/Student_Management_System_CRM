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
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", course_interest: "", source: "Walk-in", notes: "" });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: batches } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data } = await supabase.from("batches").select("*");
      return data || [];
    },
  });

  const addLead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setOpen(false);
      setForm({ name: "", phone: "", email: "", course_interest: "", source: "Walk-in", notes: "" });
      toast({ title: "Lead added successfully!" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const convertLead = useMutation({
    mutationFn: async ({ batchId }: { batchId?: string }) => {
      if (!selectedLead) return;
      const studentId = `STU-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("students").insert({
        student_id: studentId,
        lead_id: selectedLead.id,
        name: selectedLead.name,
        phone: selectedLead.phone,
        email: selectedLead.email,
        course: selectedLead.course_interest,
        batch_id: batchId || null,
      });
      if (error) throw error;
      await supabase.from("leads").update({ status: "Enrolled" }).eq("id", selectedLead.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setConvertOpen(false);
      toast({ title: "Lead converted to student!" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusColor = (s: string) => {
    if (s === "New") return "bg-info/10 text-info border-info/20";
    if (s === "Contacted") return "bg-warning/10 text-warning border-warning/20";
    if (s === "Enrolled") return "bg-success/10 text-success border-success/20";
    return "bg-muted text-muted-foreground";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lead Management</h1>
            <p className="text-sm text-muted-foreground">Capture and manage student inquiries</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> New Lead</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
                <div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                <div><Label>Course Interest *</Label><Input value={form.course_interest} onChange={(e) => setForm({...form, course_interest: e.target.value})} /></div>
                <div>
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={(v) => setForm({...form, source: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Walk-in", "Phone", "Website", "Referral", "Social Media", "Advertisement"].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
                <Button onClick={() => addLead.mutate()} disabled={!form.name || !form.phone || !form.course_interest} className="w-full gradient-primary text-primary-foreground">
                  Add Lead
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : leads?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No leads yet</TableCell></TableRow>
                ) : leads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>{lead.course_interest}</TableCell>
                    <TableCell>{lead.source}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColor(lead.status)}>{lead.status}</Badge></TableCell>
                    <TableCell>
                      {lead.status !== "Enrolled" && (
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedLead(lead); setConvertOpen(true); }}>
                          <ArrowRight className="w-4 h-4 mr-1" /> Enroll
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Convert to Student</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Enroll <strong>{selectedLead?.name}</strong> in <strong>{selectedLead?.course_interest}</strong></p>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Assign Batch (optional)</Label>
                <Select onValueChange={(v) => convertLead.mutate({ batchId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    {batches?.map(b => <SelectItem key={b.id} value={b.id}>{b.batch_name} - {b.course}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => convertLead.mutate({})} className="w-full gradient-primary text-primary-foreground">
                Convert without Batch
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
