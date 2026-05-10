import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { UserPlus, GraduationCap, CalendarCheck, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(220, 90%, 56%)", "hsl(160, 70%, 42%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

export default function DashboardPage() {
  const { data: leads } = useQuery({
    queryKey: ["leads-count"],
    queryFn: async () => {
      const { count } = await supabase.from("leads").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: students } = useQuery({
    queryKey: ["students-count"],
    queryFn: async () => {
      const { count } = await supabase.from("students").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: todayAttendance } = useQuery({
    queryKey: ["today-attendance"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "Present");
      return count || 0;
    },
  });

  const { data: totalPayments } = useQuery({
    queryKey: ["total-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("amount");
      return data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    },
  });

  const { data: leadsBySource } = useQuery({
    queryKey: ["leads-by-source"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("source");
      const counts: Record<string, number> = {};
      data?.forEach((l) => { counts[l.source] = (counts[l.source] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: recentLeads } = useQuery({
    queryKey: ["recent-leads"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const monthlyData = [
    { month: "Jan", leads: 12, enrolled: 8 },
    { month: "Feb", leads: 19, enrolled: 14 },
    { month: "Mar", leads: 15, enrolled: 10 },
    { month: "Apr", leads: 22, enrolled: 17 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back! Here's your overview.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Leads" value={leads ?? 0} icon={UserPlus} gradient="gradient-primary" change="+12% this month" />
          <StatCard title="Students" value={students ?? 0} icon={GraduationCap} gradient="gradient-accent" change="+5 this week" />
          <StatCard title="Present Today" value={todayAttendance ?? 0} icon={CalendarCheck} gradient="gradient-warm" />
          <StatCard title="Revenue" value={`₹${(totalPayments ?? 0).toLocaleString()}`} icon={DollarSign} gradient="gradient-primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Monthly Overview</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="leads" fill="hsl(220, 90%, 56%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="enrolled" fill="hsl(160, 70%, 42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Leads by Source</CardTitle></CardHeader>
            <CardContent>
              {leadsBySource && leadsBySource.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={leadsBySource} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {leadsBySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No leads yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Recent Leads</CardTitle></CardHeader>
          <CardContent>
            {recentLeads && recentLeads.length > 0 ? (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.course_interest} · {lead.source}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${lead.status === 'New' ? 'bg-info/10 text-info' : lead.status === 'Contacted' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No leads yet. Start by adding your first lead!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
