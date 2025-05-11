"use client"

import type React from "react"

import DashboardLayout from "./layout"

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
