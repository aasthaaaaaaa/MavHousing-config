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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Birds View Interactive Graph</h2>
            </div>

            {loading ? (
                <div>Loading layout data...</div>
            ) : (
                <BirdsViewGraph data={data} />
            )}
        </div>
    )
}
