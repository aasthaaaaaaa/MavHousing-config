"use client"

import { useEffect, useState } from "react"
import { authApi } from "@/lib/api"
import { BirdsViewGraph } from "@/components/birds-view-graph"

export default function BirdsViewPage() {
    const [data, setData] = useState<{ properties: any[] }>({ properties: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                const response = await authApi.get('/housing/hierarchy')
                setData({ properties: response.data })
            } catch (error) {
                console.error("Failed to fetch housing hierarchy", error)
            } finally {
                setLoading(false)
            }
        }

        fetchHierarchy()
    }, [])

    return (
        <div className="flex-1 space-y-6 p-6">
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
                <h1 className="text-2xl font-bold tracking-tight">Birds View Interactive Graph</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Visual overview of the housing hierarchy.</p>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both" style={{ animationDelay: "80ms" }}>
                {loading ? (
                    <div className="grid gap-4 grid-cols-3 lg:grid-cols-5">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" style={{ animationDelay: `${i * 50}ms` }} />
                        ))}
                    </div>
                ) : (
                    <BirdsViewGraph data={data} />
                )}
            </div>
        </div>
    )
}
