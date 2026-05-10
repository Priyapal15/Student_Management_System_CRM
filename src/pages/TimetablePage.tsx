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
import { Plus, Wand2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const queryClient = useQueryClient();
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({ subject: "", days: "5", start_time: "09:00", end_time: "11:00" });

  const { data: batches } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data } = await supabase.from("batches").select("*");
      return data || [];
    },
  });

  const { data: entries } = useQuery({
    queryKey: ["timetable", selectedBatch],
    queryFn: async () => {
      if (!selectedBatch) return [];
      const { data } = await supabase.from("timetable_entries").select("*").eq("batch_id", selectedBatch).order("day_of_week").order("start_time");
      return data || [];
    },
    enabled: !!selectedBatch,
  });

  const generateTimetable = useMutation({
    mutationFn: async () => {
      if (!selectedBatch) throw new Error("Select a batch first");
      const days = parseInt(genForm.days);
      const newEntries = [];
      for (let d = 1; d <= Math.min(days, 6); d++) {
        newEntries.push({
          batch_id: selectedBatch,
          subject: genForm.subject,
          day_of_week: d,
          start_time: genForm.start_time,
          end_time: genForm.end_time,
        });
      }
      const { error } = await supabase.from("timetable_entries").insert(newEntries);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      setGenOpen(false);
      setGenForm({ subject: "", days: "5", start_time: "09:00", end_time: "11:00" });
      toast({ title: "Timetable generated!" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const groupedByDay = DAYS.map((name, i) => ({
    day: name,
    entries: entries?.filter(e => e.day_of_week === i) || [],
  })).filter(g => g.entries.length > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Timetable Generator</h1>
            <p className="text-sm text-muted-foreground">Auto-generate and view batch schedules</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select Batch" /></SelectTrigger>
              <SelectContent>
                {batches?.map(b => <SelectItem key={b.id} value={b.id}>{b.batch_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={genOpen} onOpenChange={setGenOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground" disabled={!selectedBatch}>
                  <Wand2 className="w-4 h-4 mr-2" /> Generate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Generate Timetable</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Subject *</Label><Input value={genForm.subject} onChange={(e) => setGenForm({...genForm, subject: e.target.value})} placeholder="e.g. Java Programming" /></div>
                  <div><Label>Number of Days (Mon-Sat)</Label><Input type="number" min="1" max="6" value={genForm.days} onChange={(e) => setGenForm({...genForm, days: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Start Time</Label><Input type="time" value={genForm.start_time} onChange={(e) => setGenForm({...genForm, start_time: e.target.value})} /></div>
                    <div><Label>End Time</Label><Input type="time" value={genForm.end_time} onChange={(e) => setGenForm({...genForm, end_time: e.target.value})} /></div>
                  </div>
                  <Button onClick={() => generateTimetable.mutate()} disabled={!genForm.subject} className="w-full gradient-primary text-primary-foreground">
                    <Wand2 className="w-4 h-4 mr-2" /> Generate Schedule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!selectedBatch ? (
          <Card className="glass-card">
            <CardContent className="py-16 text-center text-muted-foreground">
              Select a batch to view or generate timetable
            </CardContent>
          </Card>
        ) : groupedByDay.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 text-center text-muted-foreground">
              No timetable entries yet. Click "Generate" to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedByDay.map(({ day, entries }) => (
              <Card key={day} className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">{day}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {entries.map(e => (
                    <div key={e.id} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="font-medium text-sm">{e.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">{e.start_time} - {e.end_time}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
