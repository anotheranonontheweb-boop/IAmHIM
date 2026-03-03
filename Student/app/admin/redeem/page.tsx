"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Redemption {
  id: number
  user_id: number
  reward_id: number
  reward_name: string
  points_cost: number
  status: string
  created_at: string
  processed_at: string | null
  user?: {
    name: string
    email: string
    grade: string
    avatar: string
  }
  stats?: {
    points: number
  }
}

export default function AdminRedeemPage() {
  const router = useRouter()
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)

  useEffect(() => {
    const userRole = localStorage.getItem("userRole")
    if (!userRole || (userRole !== "admin" && userRole !== "teacher")) {
      router.push("/")
    }
    fetchRedemptions()
  }, [router])

  const fetchRedemptions = async () => {
    try {
      const res = await fetch("/api/admin/redeem")
      const data = await res.json()
      setRedemptions(data.redemptions || [])
    } catch (err) {
      console.error("Failed to fetch redemptions:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    if (!confirm("Approve this redemption? Points will be deducted from the student.")) return
    
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/redeem?id=${id}&action=approve`, { method: "PUT" })
      const data = await res.json()
      
      if (data.success) {
        alert("Redemption approved!")
        fetchRedemptions()
      } else {
        alert(data.error || "Failed to approve")
      }
    } catch (err) {
      alert("Failed to approve")
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: number) => {
    if (!confirm("Reject this redemption request?")) return
    
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/redeem?id=${id}&action=reject`, { method: "PUT" })
      const data = await res.json()
      
      if (data.success) {
        alert("Redemption rejected!")
        fetchRedemptions()
      } else {
        alert(data.error || "Failed to reject")
      }
    } catch (err) {
      alert("Failed to reject")
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4361ee] mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#121826]">
      <header className="bg-white dark:bg-[#1e293b] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/admin")} className="text-[#4361ee] hover:opacity-80">
                <i className="fas fa-arrow-left text-xl"></i>
              </button>
              <i className="fas fa-gift text-2xl text-[#4361ee]"></i>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reward Redemptions</h1>
            </div>
            <button onClick={() => {
              localStorage.clear()
              router.push("/")
            }} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
              <i className="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push("/admin")} className="text-[#4361ee] hover:opacity-80">
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              <i className="fas fa-gift text-[#4361ee] mr-2"></i>
              Pending Reward Redemptions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and approve student reward redemption requests
            </p>
          </div>
        </div>

        {redemptions.length === 0 ? (
          <div className="bg-white dark:bg-[#1e293b] rounded-xl p-12 shadow-md text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-gift text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Pending Redemptions
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              There are no pending reward redemption requests at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {redemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="bg-white dark:bg-[#1e293b] rounded-xl p-6 shadow-md"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] rounded-full flex items-center justify-center text-white font-bold">
                      {redemption.user?.avatar || "👤"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {redemption.user?.name || `Student #${redemption.user_id}`}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {redemption.user?.email || ""} • {redemption.user?.grade || ""}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Current Points: {redemption.stats?.points || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Reward</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{redemption.reward_name}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cost</p>
                      <p className="font-semibold text-yellow-600">{redemption.points_cost} pts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Requested</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(redemption.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(redemption.id)}
                      disabled={processing === redemption.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <i className="fas fa-check mr-1"></i>
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(redemption.id)}
                      disabled={processing === redemption.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      <i className="fas fa-times mr-1"></i>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
