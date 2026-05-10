import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, CalendarCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const today = new Date().toISOString().split("T")[0];

  const { data: batches } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data } = await supabase.from("batches").select("*");
      return data || [];
    },
  });

  const { data: students } = useQuery({
    queryKey: ["batch-students", selectedBatch],
    queryFn: async () => {
      if (!selectedBatch) return [];
      const { data } = await supabase.from("students").select("*").eq("batch_id", selectedBatch).eq("status", "Active");
      return data || [];
    },
    enabled: !!selectedBatch,
  });

  const { data: todayAttendance } = useQuery({
    queryKey: ["attendance", selectedBatch, today],
    queryFn: async () => {
      if (!selectedBatch) return [];
      const { data } = await supabase.from("attendance").select("*").eq("batch_id", selectedBatch).eq("date", today);
      return data || [];
    },
    enabled: !!selectedBatch,
  });

  const markAttendance = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: string }) => {
      const existing = todayAttendance?.find(a => a.student_id === studentId);
      if (existing) {
        const { error } = await supabase.from("attendance").update({ status }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("attendance").insert({
          student_id: studentId,
          batch_id: selectedBatch,
          date: today,
          status,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Attendance updated!" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const getStatus = (studentId: string) => todayAttendance?.find(a => a.student_id === studentId)?.status;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-sm text-muted-foreground">Mark daily attendance for students</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-primary" /> Today: {new Date().toLocaleDateString()}
              </CardTitle>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="w-64"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                <SelectContent>
                  {batches?.map(b => <SelectItem key={b.id} value={b.id}>{b.batch_name} - {b.course}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedBatch ? (
              <p className="text-center py-8 text-muted-foreground">Select a batch to mark attendance</p>
            ) : students?.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No students in this batch</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students?.map((s) => {
                    const status = getStatus(s.id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                          {status ? (
                            <Badge variant="outline" className={
                              status === "Present" ? "bg-success/10 text-success border-success/20" :
                              status === "Late" ? "bg-warning/10 text-warning border-warning/20" :
                              "bg-destructive/10 text-destructive border-destructive/20"
                            }>{status}</Badge>
                          ) : <span className="text-muted-foreground text-sm">Not marked</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant={status === "Present" ? "default" : "outline"} onClick={() => markAttendance.mutate({ studentId: s.id, status: "Present" })} className={status === "Present" ? "gradient-accent text-accent-foreground" : ""}>
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant={status === "Absent" ? "default" : "outline"} onClick={() => markAttendance.mutate({ studentId: s.id, status: "Absent" })} className={status === "Absent" ? "bg-destructive text-destructive-foreground" : ""}>
                              <X className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant={status === "Late" ? "default" : "outline"} onClick={() => markAttendance.mutate({ studentId: s.id, status: "Late" })} className={status === "Late" ? "bg-warning text-warning-foreground" : ""}>
                              <Clock className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
