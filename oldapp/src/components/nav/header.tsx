"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Bell, BookOpen, LogOut, Settings, Users } from "lucide-react"
import { Button } from "../ui/button"

export function AppHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="bg-background">
      <div className="flex items-center">
        {/* Left section - Search bar */}
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-xs border border-input  pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-semibold text-muted-foreground bg-muted">
              K
            </kbd>
          </div>
        </div>

        {/* Right section - Icons and profile */}
        <div className="flex items-center gap-2 ml-4">
          {/* Notification Bell */}
          <Button variant="ghost" size="icon" className="h-9 w-9 p-5 relative">
            <Bell className="h-5 w-5" />

          </Button>
          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="h-7 w-7 rounded-full bg-secondary hover:opacity-80 transition-opacity flex items-center justify-center text-white font-semibold text-sm"
              aria-label="User profile"
            >
              I
            </button>
            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-card shadow-lg z-50">
                {/* User Info */}
                <div className="border-b border-border px-4 py-3">
                  <p className="font-semibold text-foreground">_itsy4sh</p>
                  <p className="text-sm text-muted-foreground">yash.amberkar005@gmail.com</p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors">
                    Dashboard
                  </button>
                  <button className="flex items-center justify-between w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors">
                    Account Settings
                    <Settings className="h-4 w-4" />
                  </button>
                  <button className="flex items-center justify-between w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors">
                    Manage Officials
                    <Users className="h-4 w-4" />
                  </button>
                  <button className="flex items-center justify-between w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors">
                    Command Menu
                    <kbd className="text-xs text-muted-foreground">Ctrl K</kbd>
                  </button>
                </div>

                {/* Theme and Home */}
                <div className="border-t border-b border-border py-2">
                  <button className="flex items-center justify-between w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors">
                    <span>Theme</span>
                    <div className="flex gap-1">
                      <button className="p-1 hover:bg-accent rounded">
                        <div className="h-3 w-3 rounded-full bg-yellow-400" />
                      </button>
                      <button className="p-1 hover:bg-accent rounded">
                        <div className="h-3 w-3 rounded-full bg-slate-800" />
                      </button>
                      <button className="p-1 hover:bg-accent rounded">
                        <div className="h-3 w-3 rounded-full bg-slate-600" />
                      </button>
                    </div>
                  </button>
                  <button className="flex items-center justify-between w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors">
                    Home Page
                    <span className="text-yellow-500">⚠</span>
                  </button>
                </div>
                {/* Logout */}
                <div className="border-t border-border py-2">
                  <button className="flex items-center justify-between w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors">
                    <span>Log Out</span>
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
