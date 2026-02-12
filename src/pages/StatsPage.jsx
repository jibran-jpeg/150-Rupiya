import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { TrendingUp, Wallet, Calendar, ArrowLeft, PieChart, DollarSign } from 'lucide-react'
import Navigation from '../components/Navigation'
import toast from 'react-hot-toast'

const StatsPage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState(null)
    const [currentUser, setCurrentUser] = useState(null)
    const [userName, setUserName] = useState('')

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Pehle login karo bhai!')
                navigate('/')
                return
            }
            setCurrentUser(user)

            // Get user's profile name
            const { data: profileData } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', user.id)
                .single()

            if (profileData) {
                setUserName(profileData.name)
            }

            await fetchUserStats(user.id)
        }
        getUser()
    }, [])

    const fetchUserStats = async (userId) => {
        setLoading(true)
        try {
            // Get all groups where user is a member
            const { data: memberData } = await supabase
                .from('members')
                .select('id, name, group_id, groups(*)')
                .eq('profile_id', userId)

            if (!memberData || memberData.length === 0) {
                setLoading(false)
                return
            }

            // Get all expenses across all groups where this user paid
            const memberIds = memberData.map(m => m.id)
            const { data: expensesData } = await supabase
                .from('expenses')
                .select('*')
                .in('paid_by', memberIds)
                .order('created_at', { ascending: false })

            // Get ALL members from all groups this user is in (for balance calculation)
            const groupIds = memberData.map(m => m.group_id)
            const { data: allGroupMembers } = await supabase
                .from('members')
                .select('*')
                .in('group_id', groupIds)

            // Get ALL expenses from all groups (for balance calculation)
            const { data: allGroupExpenses } = await supabase
                .from('expenses')
                .select('*')
                .in('group_id', groupIds)

            if (expensesData) {
                calculateUserStats(expensesData, memberData, allGroupMembers, allGroupExpenses, userId)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
            toast.error('Stats nahi mil rahe!')
        } finally {
            setLoading(false)
        }
    }

    const calculateUserStats = (expenses, memberData, allGroupMembers, allGroupExpenses, userId) => {
        // Total amount paid by user (only positive expenses, not settlements)
        const totalPaid = expenses
            .filter(e => e.amount > 0)
            .reduce((sum, e) => sum + Number(e.amount), 0)

        // Total transactions
        const totalTransactions = expenses.filter(e => e.amount > 0).length

        // Total settlements received/made
        const settlements = expenses.filter(e => e.amount < 0 || e.description.includes('Settlement') || e.description.includes('Received'))
        const settlementsCount = settlements.length

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentExpenses = expenses.filter(e => new Date(e.created_at) >= sevenDaysAgo && e.amount > 0)
        const recentTotal = recentExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
        const recentCount = recentExpenses.length

        // Monthly trend (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const monthlyExpenses = expenses.filter(e => new Date(e.created_at) >= thirtyDaysAgo && e.amount > 0)
        const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
        const avgPerDay = monthlyTotal / 30

        // Biggest expense
        const biggestExpense = expenses
            .filter(e => e.amount > 0)
            .reduce((max, e) => Number(e.amount) > Number(max.amount) ? e : max, { amount: 0 })

        // Average expense
        const avgExpense = totalTransactions > 0 ? totalPaid / totalTransactions : 0

        // Group breakdown
        const groupStats = []
        memberData.forEach(member => {
            const groupExpenses = expenses.filter(e => e.paid_by === member.id && e.amount > 0)
            const groupTotal = groupExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
            if (groupTotal > 0) {
                groupStats.push({
                    groupName: member.groups?.name || 'Unknown',
                    groupCode: member.groups?.unique_code || '',
                    total: groupTotal,
                    count: groupExpenses.length
                })
            }
        })

        // Recent expenses list (last 10)
        const recentExpensesList = expenses
            .filter(e => e.amount > 0)
            .slice(0, 10)

        // BALANCE CALCULATION - Group by group
        const balanceBreakdown = []
        const groupIds = [...new Set(memberData.map(m => m.group_id))]

        groupIds.forEach(groupId => {
            const groupMembers = allGroupMembers.filter(m => m.group_id === groupId)
            const groupExpenses = allGroupExpenses.filter(e => e.group_id === groupId)

            const totalGroupExpense = groupExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
            const perPersonShare = groupMembers.length > 0 ? totalGroupExpense / groupMembers.length : 0

            const userMember = groupMembers.find(m => m.profile_id === userId)
            if (!userMember) return

            const userPaid = groupExpenses
                .filter(e => e.paid_by === userMember.id)
                .reduce((sum, e) => sum + Number(e.amount), 0)
            const userBalance = userPaid - perPersonShare

            // Calculate who owes what
            groupMembers.forEach(member => {
                if (member.id === userMember.id) return // Skip self

                const memberPaid = groupExpenses
                    .filter(e => e.paid_by === member.id)
                    .reduce((sum, e) => sum + Number(e.amount), 0)
                const memberBalance = memberPaid - perPersonShare

                // If user has positive balance and member has negative, user should receive
                // If user has negative balance and member has positive, user should pay
                let amount = 0
                let type = ''

                if (userBalance > 0 && memberBalance < 0) {
                    // Member owes user
                    amount = Math.min(userBalance, Math.abs(memberBalance))
                    type = 'receive'
                } else if (userBalance < 0 && memberBalance > 0) {
                    // User owes member
                    amount = Math.min(Math.abs(userBalance), memberBalance)
                    type = 'pay'
                }

                if (amount > 1) { // Only show if more than Rs. 1
                    const groupName = memberData.find(m => m.group_id === groupId)?.groups?.name || 'Unknown'
                    balanceBreakdown.push({
                        memberName: member.name,
                        groupName: groupName,
                        amount: amount,
                        type: type // 'pay' or 'receive'
                    })
                }
            })
        })

        // Total owed and receivable
        const totalToReceive = balanceBreakdown
            .filter(b => b.type === 'receive')
            .reduce((sum, b) => sum + b.amount, 0)
        const totalToPay = balanceBreakdown
            .filter(b => b.type === 'pay')
            .reduce((sum, b) => sum + b.amount, 0)

        setStats({
            totalPaid,
            totalTransactions,
            settlementsCount,
            recentTotal,
            recentCount,
            monthlyTotal,
            avgPerDay,
            biggestExpense,
            avgExpense,
            groupStats,
            recentExpensesList,
            balanceBreakdown,
            totalToReceive,
            totalToPay
        })
    }

    return (
        <div className="pb-24 md:pb-8 md:ml-64 min-h-screen">
            {loading ? (
                <div className="flex h-[80vh] items-center justify-center font-bangers text-4xl animate-pulse">
                    Ruko Zara... Sabar Karo... ✋
                </div>
            ) : (
                <div className="max-w-6xl mx-auto p-4 md:p-8 bg-white rounded-xl border-4 border-black shadow-[8px_8px_0_0_black] mt-4">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-8 bg-white border-b-4 border-black p-4 -mx-4 md:mx-0 md:rounded-b-lg md:border-x-4 md:border-b-4 shadow-neo">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/')} className="md:hidden">
                                <ArrowLeft />
                            </button>
                            <div>
                                <h1 className="text-4xl font-bangers">📊 Tera Hisaab</h1>
                                <p className="text-sm font-bold text-gray-500 mt-1">
                                    {userName ? `${userName} ke expenses` : 'Your personal expenses'}
                                </p>
                            </div>
                        </div>
                    </header>

                    {!stats ? (
                        <div className="text-center py-10">
                            <img src="/babu_bhaya_styled.png" alt="No data" className="w-64 mx-auto mb-4" />
                            <p className="font-bangers text-2xl">Abhi tak koi kharcha nahi kiya! 🤔</p>
                        </div>
                    ) : (
                        <>
                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                {/* Total Paid */}
                                <div className="card-neo bg-primary p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wallet size={24} />
                                        <h3 className="font-bold text-sm uppercase">Total Kharcha</h3>
                                    </div>
                                    <p className="text-4xl font-bangers">Rs. {stats.totalPaid.toFixed(0)}</p>
                                </div>

                                {/* Total Transactions */}
                                <div className="card-neo bg-accent text-white p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp size={24} />
                                        <h3 className="font-bold text-sm uppercase">Transactions</h3>
                                    </div>
                                    <p className="text-4xl font-bangers">{stats.totalTransactions}</p>
                                </div>

                                {/* Average Expense */}
                                <div className="card-neo bg-success text-white p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign size={24} />
                                        <h3 className="font-bold text-sm uppercase">Average</h3>
                                    </div>
                                    <p className="text-4xl font-bangers">Rs. {stats.avgExpense.toFixed(0)}</p>
                                </div>

                                {/* Recent Activity */}
                                <div className="card-neo bg-white p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar size={24} />
                                        <h3 className="font-bold text-sm uppercase">Last 7 Days</h3>
                                    </div>
                                    <p className="text-4xl font-bangers">Rs. {stats.recentTotal.toFixed(0)}</p>
                                    <p className="text-xs mt-1 font-bold">{stats.recentCount} expenses</p>
                                </div>
                            </div>

                            {/* Monthly Trend */}
                            <div className="card-neo bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 mb-6">
                                <h3 className="text-2xl font-bangers mb-4">📈 Monthly Trend</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-bold opacity-90">Last 30 Days Total</p>
                                        <p className="text-4xl font-bangers">Rs. {stats.monthlyTotal.toFixed(0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold opacity-90">Average Per Day</p>
                                        <p className="text-4xl font-bangers">Rs. {stats.avgPerDay.toFixed(0)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Debt Summary - New Section */}
                            {stats.balanceBreakdown && stats.balanceBreakdown.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* Total to Receive */}
                                    {stats.totalToReceive > 0 && (
                                        <div className="card-neo bg-gradient-to-br from-green-500 to-teal-600 text-white p-6">
                                            <h3 className="text-xl font-bangers mb-3">💰 Lene Hain</h3>
                                            <p className="text-5xl font-bangers mb-4">Rs. {stats.totalToReceive.toFixed(0)}</p>
                                            <div className="space-y-2">
                                                {stats.balanceBreakdown.filter(b => b.type === 'receive').map((balance, idx) => (
                                                    <div key={idx} className="bg-white/20 p-2 rounded border border-white/30">
                                                        <p className="font-bold text-sm">{balance.memberName}</p>
                                                        <p className="text-xs opacity-90">Rs. {balance.amount.toFixed(0)} • {balance.groupName}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Total to Pay */}
                                    {stats.totalToPay > 0 && (
                                        <div className="card-neo bg-gradient-to-br from-red-500 to-orange-600 text-white p-6">
                                            <h3 className="text-xl font-bangers mb-3">💸 Dene Hain</h3>
                                            <p className="text-5xl font-bangers mb-4">Rs. {stats.totalToPay.toFixed(0)}</p>
                                            <div className="space-y-2">
                                                {stats.balanceBreakdown.filter(b => b.type === 'pay').map((balance, idx) => (
                                                    <div key={idx} className="bg-white/20 p-2 rounded border border-white/30">
                                                        <p className="font-bold text-sm">{balance.memberName}</p>
                                                        <p className="text-xs opacity-90">Rs. {balance.amount.toFixed(0)} • {balance.groupName}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Insights Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Biggest Expense */}
                                {stats.biggestExpense.amount > 0 && (
                                    <div className="card-neo bg-red-100 p-6">
                                        <h3 className="text-xl font-bangers mb-3 flex items-center gap-2">
                                            💰 Sabse Bada Kharcha
                                        </h3>
                                        <p className="text-3xl font-bangers mb-2">Rs. {stats.biggestExpense.amount}</p>
                                        <p className="text-sm font-bold">{stats.biggestExpense.description}</p>
                                        <p className="text-xs text-gray-600 mt-1 font-bold">
                                            {new Date(stats.biggestExpense.created_at).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                )}

                                {/* Settlements */}
                                <div className="card-neo bg-green-100 p-6">
                                    <h3 className="text-xl font-bangers mb-3 flex items-center gap-2">
                                        🤝 Settlements
                                    </h3>
                                    <p className="text-3xl font-bangers mb-2">{stats.settlementsCount}</p>
                                    <p className="text-sm font-bold text-gray-600">Total settlements done</p>
                                </div>
                            </div>

                            {/* Group Breakdown */}
                            {stats.groupStats.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bangers mb-4 border-b-4 border-primary inline-block">
                                        📊 Group-wise Breakdown
                                    </h2>
                                    <div className="space-y-3">
                                        {stats.groupStats.map((group, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 border-2 border-black bg-yellow-50 hover:bg-yellow-100 transition"
                                            >
                                                <div>
                                                    <p className="font-bold text-lg">{group.groupName}</p>
                                                    <p className="text-xs text-gray-600 font-bold">Code: {group.groupCode}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bangers">Rs. {group.total.toFixed(0)}</p>
                                                    <p className="text-xs font-bold text-gray-600">{group.count} expenses</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Expenses */}
                            {stats.recentExpensesList.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-bangers mb-4 border-b-4 border-primary inline-block">
                                        🕐 Recent Expenses
                                    </h2>
                                    <div className="space-y-2">
                                        {stats.recentExpensesList.map((expense) => {
                                            const expenseDate = new Date(expense.created_at)
                                            const now = new Date()
                                            const diffMs = now - expenseDate
                                            const diffMins = Math.floor(diffMs / 60000)
                                            const diffHours = Math.floor(diffMs / 3600000)
                                            const diffDays = Math.floor(diffMs / 86400000)

                                            let relativeTime = ''
                                            if (diffMins < 1) relativeTime = 'Abhi abhi'
                                            else if (diffMins < 60) relativeTime = `${diffMins} min pehle`
                                            else if (diffHours < 24) relativeTime = `${diffHours} ghante pehle`
                                            else if (diffDays === 1) relativeTime = 'Kal'
                                            else if (diffDays < 7) relativeTime = `${diffDays} din pehle`
                                            else relativeTime = expenseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

                                            return (
                                                <div
                                                    key={expense.id}
                                                    className="flex items-center justify-between p-3 border-l-4 border-l-primary border border-gray-200 hover:shadow-md transition"
                                                >
                                                    <div className="flex-1">
                                                        <p className="font-bold">{expense.description}</p>
                                                        <p className="text-xs text-gray-500 font-bold">{relativeTime}</p>
                                                    </div>
                                                    <p className="text-xl font-bangers">Rs. {expense.amount}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <Navigation />
        </div>
    )
}

export default StatsPage
