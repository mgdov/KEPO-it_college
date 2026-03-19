"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sidebar, type NavItem } from "./sidebar"
import { Topbar } from "./topbar"

interface ShellProps {
  children: React.ReactNode
  navItems: NavItem[]
  role: "student" | "teacher" | "admin"
  title: string
  userName?: string
}

export function DashboardShell({ children, navItems, role, title, userName }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 md:relative md:flex md:z-auto transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <Sidebar items={navItems} role={role} userName={userName} />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          title={title}
          userName={userName}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
