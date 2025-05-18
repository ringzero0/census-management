"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, UsersRound, Map, ScrollText } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WidgetData {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}

export function DashboardWidgets() {
  const { censusData, executives } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const totalEntriesToday = censusData.filter(entry => entry.submissionDate.startsWith(today)).length;
  const totalExecutivesActive = executives.length;

  const entriesByRegion = censusData.reduce((acc, entry) => {
    acc[entry.territory] = (acc[entry.territory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const regionChartData = Object.entries(entriesByRegion).map(([name, value]) => ({ name, entries: value }));

  const recentActivities = censusData
    .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
    .slice(0, 5)
    .map(entry => ({
      text: `New entry by ${entry.submittedBy} for ${entry.familyHeadName} in ${entry.territory}`,
      time: new Date(entry.submissionDate).toLocaleTimeString(),
    }));

  const widgets: WidgetData[] = [
    { title: "Census Entries Today", value: totalEntriesToday, icon: CheckSquare, description: "Entries submitted today" },
    { title: "Active Executives", value: totalExecutivesActive, icon: UsersRound, description: "Total registered executives" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {widgets.map((widget) => (
        <Card key={widget.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            <widget.icon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{widget.value}</div>
            {widget.description && <p className="text-xs text-muted-foreground">{widget.description}</p>}
          </CardContent>
        </Card>
      ))}
      <Card className="md:col-span-2 lg:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <Map className="h-5 w-5 mr-2 text-muted-foreground" /> Entries by Region
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] p-2">
          {regionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionChartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                <Tooltip />
                <Legend wrapperStyle={{fontSize: "12px"}} />
                <Bar dataKey="entries" fill="var(--color-primary)" barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center pt-8">No regional data available yet.</p>
          )}
        </CardContent>
      </Card>
       <Card className="md:col-span-2 lg:col-span-3 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <ScrollText className="h-5 w-5 mr-2 text-muted-foreground" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <ul className="space-y-2">
              {recentActivities.map((activity, index) => (
                <li key={index} className="text-xs text-muted-foreground border-b pb-1 last:border-b-0">
                  <span className="font-medium text-foreground">{activity.text}</span> - <span className="italic">{activity.time}</span>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-sm text-muted-foreground">No recent activities.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
