"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, Building2, Bed, Activity } from "lucide-react";

interface OccupancyStats {
    overview: {
        totalCapacity: number;
        occupiedBeds: number;
        vacantBeds: number;
        vacancyRate: number;
    };
    properties: {
        propertyId: number;
        propertyName: string;
        propertyType: string;
        totalCapacity: number;
        occupiedBeds: number;
        vacantBeds: number;
        vacancyRate: number;
    }[];
}

const PIE_COLORS = ["#3b82f6", "#ef4444"]; // Blue for occupied, Red for vacant

const chartConfig = {
    occupiedBeds: { label: "Occupied Beds", color: "hsl(var(--chart-1))" },
    vacantBeds: { label: "Vacant Beds", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export default function OccupancyDashboard() {
    const [stats, setStats] = useState<OccupancyStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            const response = await authApi.get('/housing/occupancy-stats');
            setStats(response.data);
        } catch (error) {
            console.error("Failed to fetch occupancy stats:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading occupancy data...</div>;
    }

    if (!stats) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">Failed to load occupancy data.</div>;
    }

    const pieData = [
        { name: "Occupied", value: stats.overview.occupiedBeds },
        { name: "Vacant", value: stats.overview.vacantBeds },
    ];

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Occupancy Dashboard</h1>
                <p className="text-muted-foreground">Real-time building capacities and vacancy rates.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total Capacity", value: stats.overview.totalCapacity, icon: Building2 },
                    { label: "Occupied Beds", value: stats.overview.occupiedBeds, icon: Users },
                    { label: "Vacant Beds", value: stats.overview.vacantBeds, icon: Bed },
                    { label: "System Vacancy Rate", value: `${stats.overview.vacancyRate}%`, icon: Activity, accent: stats.overview.vacancyRate > 20 ? "text-red-500" : "text-emerald-500" },
                ].map(({ label, value, icon: Icon, accent }) => (
                    <Card key={label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className={`text-2xl font-bold ${accent ?? ""}`}>{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* System Overview Pie Chart */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>System Overview</CardTitle>
                        <CardDescription>Total Portfolio Capacity vs Usage</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center pb-0">
                        <ChartContainer config={chartConfig} className="w-[300px] h-[300px]">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Vacancy Rates Bar Chart */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Property Vacancy Rates</CardTitle>
                        <CardDescription>Percentage of vacant beds per property</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ChartContainer config={chartConfig} className="w-full h-[300px]">
                            <BarChart data={stats.properties} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="propertyName" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis unit="%" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Bar dataKey="vacancyRate" fill="#ef4444" radius={[4, 4, 0, 0]} name="Vacancy Rate %" />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Capacity Breakdown Stacked Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Capacity Breakdown by Property</CardTitle>
                    <CardDescription>Occupied vs Vacant beds for each location</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="w-full h-[400px]">
                        <BarChart data={stats.properties} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="propertyName" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend verticalAlign="top" height={36} />
                            <Bar dataKey="occupiedBeds" stackId="a" fill="#3b82f6" name="Occupied Beds" />
                            <Bar dataKey="vacantBeds" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Vacant Beds" />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
