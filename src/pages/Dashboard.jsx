import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Plus, Share2, Wallet, ArrowLeft, Handshake } from 'lucide-react'
import toast from 'react-hot-toast'
import AddExpenseModal from '../components/AddExpenseModal'
import SettleUpModal from '../components/SettleUpModal'
import Navigation from '../components/Navigation'

const Dashboard = () => {
    const { id } = useParams() // This is the unique_code
    const navigate = useNavigate()
    const [group, setGroup] = useState(null)
    const [members, setMembers] = useState([])
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSettleOpen, setIsSettleOpen] = useState(false)

    // Fetch logic
    const fetchData = async () => {
        try {
            // 1. Get Group by unique_code
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .select('*')
                .eq('unique_code', id)
                .single()

            if (groupError || !groupData) {
                toast.error("Khata nahi mila bhai! (Group not found)")
                navigate('/')
                return
            }
            setGroup(groupData)

            // 2. Get Members
            const { data: membersData } = await supabase
                .from('members')
                .select('*')
                .eq('group_id', groupData.id)
            setMembers(membersData || [])

            // 3. Get Expenses (with payer info if needed, but we have member list)
            const { data: expensesData } = await supabase
                .from('expenses')
                .select('*')
                .eq('group_id', groupData.id)
                .order('created_at', { ascending: false })
            setExpenses(expensesData || [])

        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error("Kuch to gadbad hai daya!")
        } finally {
            setLoading(false)
        }
    }

    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUser(user)
        }
        getUser()
        fetchData()
    }, [id])

    // Debt Alert Check
    useEffect(() => {
        if (!loading && currentUser && members.length > 0 && expenses) {
            // Calculate balances for debt check
            const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
            const perPersonShare = members.length > 0 ? totalExpense / members.length : 0

            const myMember = members.find(m => m.profile_id === currentUser.id)
            if (myMember) {
                const paid = expenses
                    .filter(e => e.paid_by === myMember.id)
                    .reduce((sum, e) => sum + Number(e.amount), 0)
                const balance = paid - perPersonShare

                if (balance < -1) { // checking < -1 to avoid float issues
                    toast.error(`Oye! Tere upar Rs. ${Math.abs(balance).toFixed(0)} ka udhaar hai! Chup chap de de! 😡`, {
                        duration: 5000,
                        icon: '💸'
                    })
                }
            }
        }
    }, [loading, currentUser, members, expenses])

    // Calculation Logic
    const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const perPersonShare = members.length > 0 ? totalExpense / members.length : 0

    const calculateBalances = () => {
        const balances = members.map(member => {
            const paid = expenses
                .filter(e => e.paid_by === member.id)
                .reduce((sum, e) => sum + Number(e.amount), 0)
            const balance = paid - perPersonShare
            return { ...member, paid, balance }
        })
        return balances.sort((a, b) => b.balance - a.balance) // Winners first
    }

    const memberBalances = calculateBalances()

    // Actions
    const handleSaveExpense = async ({ payerId, amount, description }) => {
        const { error } = await supabase
            .from('expenses')
            .insert([{
                group_id: group.id,
                paid_by: payerId,
                amount: amount,
                description: description
            }])

        if (error) {
            console.error(error)
            toast.error("Kharcha save nahi hua!")
        } else {
            toast.success("Chilla chilla ke sabko scheme bata de!")
            await fetchData()
        }
    }

    const handleSettleUp = async ({ payerId, receiverId, amount }) => {
        const payerName = members.find(m => m.id === payerId)?.name
        const receiverName = members.find(m => m.id === receiverId)?.name

        const { error: error1 } = await supabase
            .from('expenses')
            .insert([
                {
                    group_id: group.id,
                    paid_by: payerId,
                    amount: amount,
                    description: `Settlement to ${receiverName}`
                },
                {
                    group_id: group.id,
                    paid_by: receiverId,
                    amount: -amount,
                    description: `Received from ${payerName}`
                }
            ])

        if (error1) {
            toast.error("Hisaab gadbad ho gaya!")
            console.error(error1)
        } else {
            toast.success("Hisaab Barabar! Dosti barkarar!")
            await fetchData()
        }
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success("Copy ho gaya bidu! Share kar de.")
    }

    return (
        <div className="pb-24 md:pb-8 md:ml-64 min-h-screen">
            {loading ? (
                <div className="flex h-[80vh] items-center justify-center font-bangers text-4xl animate-pulse">
                    Ruko Zara... Sabar Karo... ✋
                </div>
            ) : (
                <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white rounded-xl border-4 border-black shadow-[8px_8px_0_0_black] mt-4 relative">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-8 bg-white border-b-4 border-black p-4 -mx-4 md:mx-0 md:rounded-b-lg md:border-x-4 md:border-b-4 shadow-neo">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/')} className="md:hidden"><ArrowLeft /></button>
                            <div>
                                <h1 className="text-3xl md:text-4xl text-black leading-none">{group?.name}</h1>
                                <p className="text-sm font-bold text-gray-500">
                                    Code: {group?.unique_code} <span className="mx-2">•</span> {members.length} Log
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleCopyLink}
                            className="bg-primary p-2 border-2 border-black shadow-[2px_2px_0_0_black] active:shadow-none active:translate-y-[2px] transition"
                            title="Share Link"
                        >
                            <Share2 />
                        </button>
                    </header>

                    {/* Total Card */}
                    <div className="card-neo bg-primary mb-8 text-center py-8 relative overflow-hidden">
                        <div className="absolute top-[-20px] left-[-20px] w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                        <h2 className="text-2xl font-sans font-bold uppercase tracking-widest mb-2">Total Barbaadi</h2>
                        <p className="text-6xl font-bangers">Rs. {totalExpense.toFixed(0)}</p>
                        <p className="text-sm font-bold mt-2 bg-black text-white inline-block px-2 py-1 rotate-1">
                            Share: Rs. {perPersonShare.toFixed(0)} / person
                        </p>
                    </div>

                    {/* Balances Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                        {memberBalances.map(member => {
                            const isPositive = member.balance >= 0
                            const statusColor = isPositive ? 'bg-success' : 'bg-danger'
                            const textColor = 'text-white'

                            return (
                                <div key={member.id} className={`card-neo relative group transition-transform hover:-translate-y-1`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-2xl mb-1">{member.name}</h3>
                                            <p className="text-sm text-gray-600 font-bold">Paid: Rs. {member.paid.toFixed(0)}</p>
                                        </div>
                                        <div className={`${statusColor} ${textColor} px-3 py-1 border-2 border-black font-bangers text-xl shadow-[2px_2px_0_0_black]`}>
                                            {isPositive ? 'Lene hain' : 'Dene hain'}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-between items-end">
                                        <span className={`text-4xl font-bangers ${isPositive ? 'text-success' : 'text-danger'}`}>
                                            {Math.abs(member.balance).toFixed(0)}
                                        </span>
                                        <span
                                            className="text-xs font-bold border-black border px-1 bg-yellow-100"
                                            title={!isPositive ? "Click for sound!" : ""}
                                        >
                                            {isPositive ? "Paisa hi Paisa hoga!" : "Tera kya hoga Kalia?"}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Expense List / Empty State */}
                    <h3 className="text-3xl font-bangers border-b-4 border-primary inline-block mb-6">Kharcha History</h3>

                    {expenses.length === 0 ? (
                        <div className="text-center py-10 opacity-80">
                            <img src="/babu_bhaya_styled.png" alt="No expenses" className="w-64 mx-auto mb-4" />
                            <p className="font-bangers text-2xl rotate-[-1deg]">"Bilkul ricks nahi lene ka! Pehla kharcha add kar."</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {expenses.map((expense) => {
                                const payerName = members.find(m => m.id === expense.paid_by)?.name || 'Unknown'
                                const isSettlement = expense.amount < 0 || expense.description.startsWith('Settlement') || expense.description.startsWith('Received')

                                // Format date and time
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
                                else relativeTime = expenseDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

                                const fullDate = expenseDate.toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })
                                const time = expenseDate.toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                })

                                return (
                                    <div key={expense.id} className={`bg-white border-l-4 ${isSettlement ? 'border-l-success bg-green-50' : 'border-l-black'} border-y border-r border-gray-200 p-4 flex justify-between items-center shadow-sm hover:shadow-md transition`}>
                                        <div className="flex-1">
                                            <p className="font-bold text-lg">{expense.description}</p>
                                            <p className="text-sm text-gray-500">
                                                {expense.amount < 0 ? 'Received by ' : 'Paid by '}
                                                <span className="font-bold text-black bg-primary px-1">{payerName}</span>
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                <span className="font-bold">{relativeTime}</span>
                                                <span className="opacity-60">• {fullDate}, {time}</span>
                                            </p>
                                        </div>
                                        <div className={`text-2xl font-bangers ${expense.amount < 0 ? 'text-success' : ''}`}>
                                            Rs. {Math.abs(expense.amount)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Modals */}
                    <AddExpenseModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        members={members}
                        onSave={handleSaveExpense}
                        currentUserId={currentUser?.id}
                    />

                    <SettleUpModal
                        isOpen={isSettleOpen}
                        onClose={() => setIsSettleOpen(false)}
                        members={members}
                        onSave={handleSettleUp}
                        currentUserId={currentUser?.id}
                    />
                </div>
            )}

            {/* Responsive Navigation */}
            <Navigation
                onAdd={() => setIsModalOpen(true)}
                onSettle={() => setIsSettleOpen(true)}
            />
        </div>
    )
}

export default Dashboard

