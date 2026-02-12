import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Trash2, ExternalLink, ShieldAlert, User, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminPanel = () => {
    const navigate = useNavigate()
    const [groups, setGroups] = useState([])
    const [members, setMembers] = useState([])
    const [stats, setStats] = useState({ totalGroups: 0, totalExpenses: 0, totalAmount: 0, totalMembers: 0 })
    const [loading, setLoading] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [pin, setPin] = useState('')

    const ADMIN_PIN = '1234' // Hardcoded for now

    const handleLogin = (e) => {
        e.preventDefault()
        if (pin === ADMIN_PIN) {
            setIsAuthenticated(true)
            fetchData()
        } else {
            toast.error("Galat PIN hai bhai! Tu Admin nahi hai.")
        }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch Groups
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('*')
                .order('created_at', { ascending: false })

            if (groupsError) throw groupsError

            // Fetch Members
            const { data: membersData, error: membersError } = await supabase
                .from('members')
                .select('*')
            // .order('created_at', { ascending: false }) // Column structure unknown, removing sort to fix error

            if (membersError) throw membersError

            // Fetch Expenses for stats
            const { data: expensesData, error: expensesError } = await supabase
                .from('expenses')
                .select('amount')

            if (expensesError) throw expensesError

            setGroups(groupsData || [])
            setMembers(membersData || [])

            // Calculate stats
            const totalAmount = expensesData.reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0)

            setStats({
                totalGroups: groupsData.length,
                totalMembers: membersData.length,
                totalExpenses: expensesData.length,
                totalAmount: totalAmount
            })

        } catch (error) {
            console.error('Error fetching admin data:', error)
            toast.error(`Error: ${error.message || error.error_description || "Unknown error"}`)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm("Sure hai? Sab uda dega yeh! (Are you sure? This will delete everything for this group)")) return

        try {
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', groupId)

            if (error) throw error

            toast.success("Khallas! Group deleted.")
            fetchData() // Refresh
        } catch (error) {
            console.error("Delete failed", error)
            toast.error("Delete nahi hua!")
        }
    }

    const handleDeleteMember = async (memberId) => {
        if (!window.confirm("Is member ko nikalna hai? (Are you sure you want to remove this member?)")) return

        try {
            const { error } = await supabase
                .from('members')
                .delete()
                .eq('id', memberId)

            if (error) throw error

            toast.success("Gaya kaam se! Member deleted.")
            fetchData() // Refresh
        } catch (error) {
            console.error("Delete member failed", error)
            toast.error("Member delete nahi hua! Shayad kharcha juda hai isse.")
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="card-neo bg-white max-w-sm w-full text-center">
                    <ShieldAlert size={64} className="mx-auto mb-4 text-danger" />
                    <h2 className="text-3xl mb-4">Admin Area</h2>
                    <p className="mb-6 font-bold text-gray-600">Enter Secret PIN to continue</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="input-neo text-center text-4xl tracking-widest"
                            placeholder="****"
                            maxLength={4}
                            autoFocus
                        />
                        <button type="submit" className="btn-neo w-full bg-primary">
                            Unlock
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    if (loading) return <div className="text-center text-4xl font-bangers mt-20">Loading Admin Data...</div>

    return (
        <div className="pb-24">
            <h1 className="text-4xl text-black mb-8 border-b-4 border-black inline-block">Admin Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="card-neo bg-accent text-white relative overflow-hidden">
                    <h3 className="text-xl">Total Groups</h3>
                    <p className="text-5xl font-bangers mt-2">{stats.totalGroups}</p>
                </div>
                <div className="card-neo bg-secondary text-white relative overflow-hidden">
                    <h3 className="text-xl">Total Users</h3>
                    <p className="text-5xl font-bangers mt-2">{stats.totalMembers}</p>
                </div>
                <div className="card-neo bg-success text-white relative overflow-hidden">
                    <h3 className="text-xl">Total Logged (Rs)</h3>
                    <p className="text-5xl font-bangers mt-2">{stats.totalAmount.toLocaleString()}</p>
                </div>
                <div className="card-neo bg-black text-white relative overflow-hidden">
                    <h3 className="text-xl">Total Transactions</h3>
                    <p className="text-5xl font-bangers mt-2">{stats.totalExpenses}</p>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Users /> All Groups</h2>
            <div className="space-y-4 mb-12">
                {groups.map(group => (
                    <div key={group.id} className="card-neo hover:bg-gray-50 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-2xl font-bangers">{group.name}</h3>
                            <p className="font-mono bg-gray-200 px-2 py-1 rounded text-sm inline-block mt-1">
                                Code: <span className="font-bold">{group.unique_code}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Created: {new Date(group.created_at).toLocaleDateString()}</p>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={() => navigate(`/group/${group.unique_code}`)}
                                className="flex-1 md:flex-none btn-neo bg-white text-black text-sm py-1 px-3 flex items-center justify-center gap-2 hover:bg-gray-100"
                            >
                                <ExternalLink size={16} /> View
                            </button>
                            <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="flex-1 md:flex-none btn-neo bg-danger text-white text-sm py-1 px-3 flex items-center justify-center gap-2 hover:bg-red-700"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                ))}

                {groups.length === 0 && (
                    <div className="text-center py-12 opacity-50 font-bold">No groups found.</div>
                )}
            </div>

            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><User /> All Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map(member => {
                    const group = groups.find(g => g.id === member.group_id)
                    return (
                        <div key={member.id} className="card-neo flex justify-between items-center bg-white">
                            <div>
                                <h4 className="text-xl font-bold">{member.name}</h4>
                                <p className="text-sm text-gray-500">
                                    Group: {group ? <span className="font-bold text-black bg-yellow-200 px-1">{group.name}</span> : 'Unknown'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="text-gray-400 hover:text-danger hover:scale-110 transition p-2"
                                title="Delete Member"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    )
                })}

                {members.length === 0 && (
                    <div className="col-span-full text-center py-12 opacity-50 font-bold">No members found.</div>
                )}
            </div>
        </div>
    )
}

export default AdminPanel
