import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function BatchesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ batch_name: "", course: "", start_time: "09:00", end_time: "11:00", trainer: "", max_students: "30" });

  const { data: batches, isLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("batches").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addBatch = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("batches").insert({
        ...form,
        max_students: parseInt(form.max_students),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setOpen(false);
      setForm({ batch_name: "", course: "", start_time: "09:00", end_time: "11:00", trainer: "", max_students: "30" });
      toast({ title: "Batch created!" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Batches</h1>
            <p className="text-sm text-muted-foreground">Manage training batches</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> New Batch</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Batch</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Batch Name *</Label><Input value={form.batch_name} onChange={(e) => setForm({...form, batch_name: e.target.value})} placeholder="e.g. Java Morning Batch" /></div>
                <div><Label>Course *</Label><Input value={form.course} onChange={(e) => setForm({...form, course: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({...form, start_time: e.target.value})} /></div>
                  <div><Label>End Time</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({...form, end_time: e.target.value})} /></div>
                </div>
                <div><Label>Trainer</Label><Input value={form.trainer} onChange={(e) => setForm({...form, trainer: e.target.value})} /></div>
                <div><Label>Max Students</Label><Input type="number" value={form.max_students} onChange={(e) => setForm({...form, max_students: e.target.value})} /></div>
                <Button onClick={() => addBatch.mutate()} disabled={!form.batch_name || !form.course} className="w-full gradient-primary text-primary-foreground">Create Batch</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Max Students</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : batches?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No batches yet</TableCell></TableRow>
                ) : batches?.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.batch_name}</TableCell>
                    <TableCell>{b.course}</TableCell>
                    <TableCell>{b.start_time} - {b.end_time}</TableCell>
                    <TableCell>{b.trainer || "—"}</TableCell>
                    <TableCell>{b.max_students}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
