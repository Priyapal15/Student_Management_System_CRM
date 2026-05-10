import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function StudentsPage() {
  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*, batches(batch_name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Enrolled Students</h1>
          <p className="text-sm text-muted-foreground">Manage all registered students</p>
        </div>

        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : students?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No students yet. Convert leads to enroll students.</TableCell></TableRow>
                ) : students?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.student_id}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell>{s.course}</TableCell>
                    <TableCell>{(s.batches as any)?.batch_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={s.status === "Active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(s.enrollment_date).toLocaleDateString()}</TableCell>
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
