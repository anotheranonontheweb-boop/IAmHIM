"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function StudentRewardsPage() {
  const router = useRouter()
  const [points, setPoints] = useState(0)
  const [userName, setUserName] = useState("Student")

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const userRole = localStorage.getItem("userRole")
        const userId = localStorage.getItem("userId")

        if (!userId || userRole !== "student") {
          router.push("/")
          return false
        }
        setUserName(localStorage.getItem("username") || "Student")
        setPoints(Number.parseInt(localStorage.getItem("userPoints") || "0"))
        return true
      }
      return false
    }
    checkAuth()
  }, [router])

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  const rewards = [
    {
      tier: "Basic",
      icon: "fa-print",
      title: "Free Printing",
      description: "25 pages of free printing at school computer lab",
      points: 100,
      color: "from-[#4cc9f0] to-[#00b4d8]",
      badge: "fa-seedling",
    },
    {
      tier: "Popular",
      icon: "fa-tshirt",
      title: "Wash Day Pass",
      description: "One-time free laundry service at school facilities",
      points: 150,
      color: "from-[#f8961e] to-[#ff9500]",
      badge: "fa-star",
    },
    {
      tier: "Premium",
      icon: "fa-utensils",
      title: "Canteen Discount",
      description: "20% off on your next canteen purchase",
      points: 200,
      color: "from-[#f72585] to-[#b5179e]",
      badge: "fa-crown",
    },
    {
      tier: "Basic",
      icon: "fa-book",
      title: "Library Pass",
      description: "Extended library borrowing privileges for 1 week",
      points: 75,
      color: "from-[#22c55e] to-[#16a34a]",
      badge: "fa-seedling",
    },
    {
      tier: "Premium",
      icon: "fa-laptop",
      title: "Lab Access",
      description: "After-hours computer lab access for projects",
      points: 250,
      color: "from-[#7c3aed] to-[#5b21b6]",
      badge: "fa-crown",
    },
    {
      tier: "Popular",
      icon: "fa-ticket",
      title: "Event VIP",
      description: "Priority seating at school events",
      points: 180,
      color: "from-[#ec4899] to-[#db2777]",
      badge: "fa-star",
    },
  ]

  const tiers = ["All", "Basic", "Popular", "Premium"]
  const [activeTier, setActiveTier] = useState("All")

  const filteredRewards = activeTier === "All" 
    ? rewards 
    : rewards.filter(r => r.tier === activeTier)

  const handleRedeem = async (reward: typeof rewards[0]) => {
    const userId = localStorage.getItem("userId")
    
    if (!userId) {
      alert("Please log in to redeem rewards")
      return
    }
    
    if (points >= reward.points) {
      try {
        const res = await fetch("/api/admin/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: parseInt(userId),
            rewardId: 1,
            rewardName: reward.title,
            pointsCost: reward.points
          })
        })
        const data = await res.json()
        
        if (data.success) {
          // Add activity for pending redemption request
          await fetch("/api/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: parseInt(userId),
              type: 'reward_pending',
              description: `Request for: ${reward.title}`,
              points_earned: 0
            })
          })
          alert("Redemption request submitted! Please wait for admin approval.")
        } else {
          alert(data.error || "Failed to submit redemption request")
        }
      } catch (err) {
        alert("Failed to submit redemption request")
      }
    } else {
      alert(`Not enough points! You need ${reward.points - points} more points.`)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1e293b] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center gap-3 text-[#4361ee] cursor-pointer"
              onClick={() => router.push("/student")}
            >
              <i className="fas fa-arrow-left text-xl"></i>
              <i className="fas fa-gift text-2xl"></i>
              <h1 className="text-xl font-bold">Rewards</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, <span className="font-semibold text-gray-900 dark:text-white">{userName}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Points Balance */}
        <div className="bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] rounded-2xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Rewards Store 🎁</h1>
              <p className="text-white/90">Redeem your points for exclusive rewards</p>
            </div>
            <div className="text-center bg-white/20 rounded-xl px-8 py-4">
              <div className="text-4xl font-bold">{points}</div>
              <div className="text-sm opacity-90">Available Points 💰</div>
            </div>
          </div>
        </div>

        {/* Tier Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`px-6 py-2 rounded-full font-medium transition ${
                activeTier === tier
                  ? "bg-[#4361ee] text-white"
                  : "bg-white dark:bg-[#1e293b] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#0f172a]"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward, index) => (
            <div
              key={index}
              className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${reward.color} rounded-xl flex items-center justify-center`}>
                  <i className={`fas ${reward.icon} text-white text-2xl`}></i>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  reward.tier === "Basic" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  reward.tier === "Popular" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                }`}>
                  {reward.tier}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {reward.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {reward.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fas fa-coins text-yellow-500"></i>
                  <span className="font-bold text-gray-900 dark:text-white">{reward.points} pts</span>
                </div>
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={points < reward.points}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    points >= reward.points
                      ? "bg-[#4361ee] text-white hover:bg-[#3651e0]"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Redeem
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* How Points Work */}
        <div className="mt-12 bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <i className="fas fa-info-circle text-[#4361ee]"></i>
            How Points Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-qrcode text-green-600 dark:text-green-400"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Scan for Attendance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Earn 10 points per attendance scan</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check-circle text-blue-600 dark:text-blue-400"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Build Your Streak</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bonus points for daily attendance</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-trophy text-purple-600 dark:text-purple-400"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Climb the Ranks</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Top students earn bonus rewards</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
