"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
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

const PIE_COLORS = ["#10b981", "#cbd5e1"];

const chartConfig = {
    occupiedBeds: { label: "Occupied", color: "#10b981" },
    vacantBeds: { label: "Vacant", color: "#cbd5e1" },
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
        return (
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="h-12 w-64 bg-muted animate-pulse rounded-xl" />
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
                    ))}
                </div>
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                    <div className="h-72 bg-muted animate-pulse rounded-2xl" />
                    <div className="lg:col-span-2 h-72 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: "120ms" }} />
                </div>
                <div className="h-80 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: "200ms" }} />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Failed to load occupancy data.
            </div>
        );
    }

    const pieData = [
        { name: "Occupied", value: stats.overview.occupiedBeds },
        { name: "Vacant", value: stats.overview.vacantBeds },
    ];

    const occupancyPct = stats.overview.totalCapacity > 0
        ? Math.round((stats.overview.occupiedBeds / stats.overview.totalCapacity) * 100)
        : 0;

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
                <h1 className="text-2xl font-bold tracking-tight">Occupancy Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Real-time building capacities and vacancy rates.</p>
            </div>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Total Capacity",
                        value: stats.overview.totalCapacity,
                        sub: "beds across all properties",
                        icon: Building2,
                        iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
                        iconColor: "text-blue-500",
                    },
                    {
                        label: "Occupied Beds",
                        value: stats.overview.occupiedBeds,
                        sub: `${occupancyPct}% occupancy`,
                        icon: Users,
                        iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
                        iconColor: "text-emerald-500",
                        accent: "text-emerald-600 dark:text-emerald-400",
                    },
                    {
                        label: "Vacant Beds",
                        value: stats.overview.vacantBeds,
                        sub: "available now",
                        icon: Bed,
                        iconBg: "bg-slate-300/30 dark:bg-slate-500/20",
                        iconColor: "text-slate-400 dark:text-slate-500",
                    },
                    {
                        label: "Vacancy Rate",
                        value: `${stats.overview.vacancyRate}%`,
                        sub: "system-wide",
                        icon: Activity,
                        iconBg: "bg-slate-300/30 dark:bg-slate-500/20",
                        iconColor: "text-slate-400 dark:text-slate-500",
                    },
                ].map(({ label, value, sub, icon: Icon, iconBg, iconColor, accent }, idx) => (
                    <Card
                        key={label}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5"
                        style={{ animationDelay: `${80 + idx * 70}ms` }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                            <div className={`h-8 w-8 rounded-xl ${iconBg} flex items-center justify-center`}>
                                <Icon className={`h-4 w-4 ${iconColor}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className={`text-3xl font-bold tracking-tight ${accent ?? ""}`}>{value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts row */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                {/* Donut — occupancy split */}
                <Card
                    className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both rounded-2xl transition-all hover:shadow-md"
                    style={{ animationDelay: "360ms" }}
                >
                    <CardHeader>
                        <CardTitle className="text-base">System Overview</CardTitle>
                        <CardDescription>{stats.overview.totalCapacity} total beds</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4 pt-2">
                        <ChartContainer config={chartConfig} className="w-[160px] h-[160px]">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={32}
                                    outerRadius={68}
                                    paddingAngle={3}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                                    ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                        </ChartContainer>
                        <div className="flex items-center justify-center gap-6 text-sm">
                            {[
                                { color: "bg-[#10b981]", label: "Occupied", val: stats.overview.occupiedBeds },
                                { color: "bg-[#cbd5e1]", label: "Vacant", val: stats.overview.vacantBeds },
                            ].map(({ color, label, val }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="font-semibold">{val}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Bar — vacancy rates per property */}
                <Card
                    className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both rounded-2xl transition-all hover:shadow-md"
                    style={{ animationDelay: "430ms" }}
                >
                    <CardHeader>
                        <CardTitle className="text-base">Vacancy Rates by Property</CardTitle>
                        <CardDescription>Percentage of vacant beds per location</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-52 w-full">
                            <BarChart data={stats.properties} margin={{ left: -20, right: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                <XAxis dataKey="propertyName" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis unit="%" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="vacancyRate" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="Vacancy %" />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Stacked bar — capacity breakdown */}
            <Card
                className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both rounded-2xl transition-all hover:shadow-md"
                style={{ animationDelay: "520ms" }}
            >
                <CardHeader>
                    <CardTitle className="text-base">Capacity Breakdown by Property</CardTitle>
                    <CardDescription>Occupied vs vacant beds for each location</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-72 w-full">
                        <BarChart data={stats.properties} margin={{ left: -20, right: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                            <XAxis dataKey="propertyName" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="occupiedBeds" stackId="a" fill="#10b981" name="Occupied" />
                            <Bar dataKey="vacantBeds" stackId="a" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="Vacant" />
                        </BarChart>
                    </ChartContainer>
                    <div className="flex items-center justify-center gap-6 text-sm pt-2">
                        {[
                            { color: "bg-emerald-500", label: "Occupied" },
                            { color: "bg-slate-300 dark:bg-slate-600", label: "Vacant" },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                                <span className="text-muted-foreground">{label}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
