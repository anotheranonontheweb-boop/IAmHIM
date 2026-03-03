"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "@/lib/theme-context"

interface HeaderProps {
  activePage: "home" | "profile" | "leaderboard" | "rewards"
}

export default function Header({ activePage }: HeaderProps) {
  const router = useRouter()
  const { isDarkMode, toggleTheme, isInitialized } = useTheme()

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userId")
      localStorage.removeItem("username")
      localStorage.removeItem("userFullName")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userPoints")
    }
    router.push("/")
  }

  const navLinks = [
    { href: "/student", icon: "fa-home", label: "Home", page: "home" },
    { href: "/student/profile", icon: "fa-user", label: "Profile", page: "profile" },
    { href: "/leaderboard", icon: "fa-trophy", label: "Leaderboard", page: "leaderboard" },
    { href: "/student/rewards", icon: "fa-gift", label: "Rewards", page: "rewards" },
  ]

  return (
    <header className="bg-white dark:bg-[#1e293b] shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/student" className="flex items-center gap-3 text-[#4361ee] hover:opacity-80 transition">
            <i className="fas fa-graduation-cap text-3xl"></i>
            <h1 className="text-2xl font-bold">EduTrack Pro</h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.page}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activePage === link.page
                    ? "bg-[#4361ee] text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f172a]"
                }`}
              >
                <i className={`fas ${link.icon}`}></i>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#f8961e] to-[#ff9500] text-white rounded-full text-sm font-medium">
              <i className="fas fa-database"></i>
              Database
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0f172a] transition"
              title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              disabled={!isInitialized}
            >
              {isDarkMode ? (
                <i className="fas fa-sun text-yellow-500"></i>
              ) : (
                <i className="fas fa-moon text-gray-600"></i>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2 pb-3 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.page}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activePage === link.page
                  ? "bg-[#4361ee] text-white"
                  : "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#0f172a]"
              }`}
            >
              <i className={`fas ${link.icon}`}></i>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
