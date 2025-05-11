import type React from "react"
import { Suspense } from "react"
import DashboardLayoutWrapper from "./layout-wrapper"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayoutWrapper>
      <Suspense>{children}</Suspense>
    </DashboardLayoutWrapper>
  )
}
