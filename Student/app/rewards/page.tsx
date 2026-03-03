"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function RewardsPage() {
  const router = useRouter()
  const [points, setPoints] = useState(329)

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!localStorage.getItem("userId")) {
        router.push("/")
        return
      }
      setPoints(Number.parseInt(localStorage.getItem("userPoints") || "329"))
    }
  }, [router])

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
      description: "15% discount on all canteen purchases for one week",
      points: 200,
      color: "from-[#4361ee] to-[#3a0ca3]",
      badge: "fa-crown",
    },
  ]

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      <Header activePage="rewards" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
            <i className="fas fa-gift text-[#4361ee]"></i>
            Available Rewards
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
            Possible rewards you can earn through good attendance and participation
          </p>

          {/* Points Balance */}
          <div className="inline-block bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] text-white rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fas fa-coins text-4xl"></i>
              </div>
              <div className="text-left">
                <div className="text-sm opacity-90 mb-1">Example Points Balance</div>
                <div className="text-5xl font-bold">
                  {points} <span className="text-2xl font-normal">points</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <i className="fas fa-award text-[#4361ee]"></i>
            Reward Tiers
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Rewards are earned by maintaining attendance streaks and active participation
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rewards.map((reward, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition relative"
              >
                <div
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${reward.color} flex items-center gap-1`}
                >
                  <i className={`fas ${reward.badge}`}></i>
                  {reward.tier}
                </div>

                <div
                  className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${reward.color} rounded-full flex items-center justify-center text-white text-3xl mt-4`}
                >
                  <i className={`fas ${reward.icon}`}></i>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-3">{reward.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6 min-h-[48px]">{reward.description}</p>

                <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                  <i className="fas fa-coins text-[#f8961e]"></i>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{reward.points} points</span>
                </div>


              </div>
            ))}
          </div>
        </div>

        {/* Points System */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <i className="fas fa-calculator text-[#4361ee]"></i>
            Points System
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: "fa-calendar-check",
                title: "Daily Attendance",
                desc: "+5 points per day of perfect attendance",
                example: "20 days = 100 points",
                explanation: "Students earn 5 points each day they attend school on time and stay for the full day. This encourages consistent daily attendance and punctuality. Points are calculated based on the number of school days in a month.",
              },
              {
                icon: "fa-fire",
                title: "Weekly Streak Bonus",
                desc: "+10 bonus points for each completed week",
                example: "4 weeks = 40 bonus points",
                explanation: "A weekly streak bonus is awarded when a student maintains perfect attendance for an entire week (Monday-Friday). This rewards consistency and motivates students to maintain their attendance throughout the week without any absences.",
              },
              {
                icon: "fa-trophy",
                title: "Monthly Excellence",
                desc: "+50 points for perfect monthly attendance",
                example: "Perfect month = 50 bonus points",
                explanation: "The monthly excellence award is given to students who achieve perfect attendance for the entire month. This is the highest tier of recognition, rewarding students who have demonstrated exceptional commitment to their education throughout all school days.",
              },
            ].map((item, i) => (
              <Dialog key={i}>
                <DialogTrigger asChild>
                  <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md text-center hover:-translate-y-1 transition cursor-pointer">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-full flex items-center justify-center text-white text-2xl">
                      <i className={`fas ${item.icon}`}></i>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{item.desc}</p>
                    <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-[#4361ee] rounded-full text-xs font-medium">
                      Example: {item.example}
                    </div>
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <i className="fas fa-expand mr-1"></i> Click to read more
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-full flex items-center justify-center text-white">
                        <i className={`fas ${item.icon}`}></i>
                      </div>
                      {item.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Points Awarded</span>
                      <span className="font-bold text-[#4361ee] text-xl">
                        {item.desc.split("+")[1].split(" points")[0].trim()} points
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 px-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Example</span>
                      <span className="font-bold text-gray-900 dark:text-white">{item.example}</span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <div className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md cursor-pointer hover:shadow-lg transition">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-line text-[#4361ee]"></i>
                  Monthly Points Calculation
                  <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                    <i className="fas fa-expand mr-1"></i> Click to enlarge
                  </span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">20 school days × 5 points</span>
                    <span className="font-bold text-gray-900 dark:text-white">100 points</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">4 weekly streak bonuses</span>
                    <span className="font-bold text-gray-900 dark:text-white">40 points</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">Monthly perfect attendance</span>
                    <span className="font-bold text-gray-900 dark:text-white">50 points</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t-2 border-[#4361ee]">
                    <span className="font-bold text-gray-900 dark:text-white">Total Possible Monthly Points</span>
                    <span className="text-2xl font-bold text-[#4361ee]">190 points</span>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <i className="fas fa-chart-line text-[#4361ee]"></i>
                  Monthly Points Calculation
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                    This breakdown shows how students can earn up to <strong className="text-[#4361ee]">190 points per month</strong> through consistent attendance and participation. The calculation includes daily attendance points, weekly streak bonuses, and the monthly excellence award.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">Daily Attendance</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">20 school days × 5 points/day</span>
                    </div>
                    <span className="font-bold text-[#4361ee] text-xl">100 points</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">Weekly Streak Bonus</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">4 weeks × 10 bonus points</span>
                    </div>
                    <span className="font-bold text-[#4361ee] text-xl">40 points</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-[#0f172a] rounded-lg">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">Monthly Excellence</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Perfect attendance bonus</span>
                    </div>
                    <span className="font-bold text-[#4361ee] text-xl">50 points</span>
                  </div>
                  <div className="flex items-center justify-between py-4 px-4 bg-gradient-to-r from-[#4361ee] to-[#3a0ca3] rounded-lg text-white">
                    <span className="font-bold text-lg">Total Possible Monthly Points</span>
                    <span className="text-3xl font-bold">190 points</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Important Note */}
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-6">
          <h4 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle"></i>
            Important Note
          </h4>
          <p className="text-gray-700 dark:text-gray-300">
            This page shows <strong className="text-red-600 dark:text-red-400">possible rewards only</strong>. Actual
            redemption functionality is not implemented in this demo version. In a real system, you would be able to
            redeem points for these rewards.
          </p>
        </div>
      </main>
    </div>
  )
}
