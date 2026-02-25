"use client"

import { PillNavbar } from "@/components/pill-navbar"
import BlazeChat from "@/components/blaze-chat"
import { useAuth } from "@/context/AuthContext"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const isStudent = user?.role?.toLowerCase() === "student"

  return (
    <div className="min-h-screen bg-background">
      <PillNavbar role="admin" />
      <main className="max-w-[1400px] mx-auto p-6">
        {children}
      </main>
      {isStudent && <BlazeChat />}
    </div>
  )
}
