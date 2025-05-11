"use client"

import { useEffect } from "react"

export function useClickOutside(isOpen: boolean, setIsOpen: (open: boolean) => void, excludeIds: string[] = []) {
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Check if click is outside excluded elements
      const isOutside = excludeIds.every((id) => {
        const element = document.getElementById(id)
        return element ? !element.contains(target) : true
      })

      if (isOutside) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, setIsOpen, excludeIds])
}
