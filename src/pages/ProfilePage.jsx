import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Users, Lock, Edit2, Check, ExternalLink, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import Navigation from '../components/Navigation'

const ProfilePage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState(null)
    const [myGroups, setMyGroups] = useState([])
    const [friends, setFriends] = useState([]) // "People you know"

    // Edit States
    const [isEditing, setIsEditing] = useState(false)
    const [newName, setNewName] = useState('')
    const [newPassword, setNewPassword] = useState('')

    useEffect(() => {
        getProfile()
    }, [])

    const getProfile = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                navigate('/login')
                return
            }
            setSession(session)

            // 1. Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            setProfile(profileData)
            setNewName(profileData?.full_name || '')

            // 2. Fetch My Groups
            const { data: memberData } = await supabase
                .from('members')
                .select('group_id, groups(*)')
                .eq('profile_id', session.user.id)

            const groups = memberData?.map(m => m.groups).filter(Boolean) || []
            setMyGroups(groups)

            // 3. Fetch "Friends" (People in my groups)
            // We get all members of the groups I am in.
            if (groups.length > 0) {
                const groupIds = groups.map(g => g.id)
                const { data: allMembers } = await supabase
                    .from('members')
                    .select('profile_id, name, profiles(full_name)')
                    .in('group_id', groupIds)
                    .neq('profile_id', session.user.id) // Exclude me

                // Deduplicate by profile_id
                const uniqueFriends = []
                const seenIds = new Set()

                allMembers?.forEach(m => {
                    if (m.profile_id && !seenIds.has(m.profile_id)) {
                        seenIds.add(m.profile_id)
                        uniqueFriends.push({
                            id: m.profile_id,
                            name: m.profiles?.full_name || m.name || 'Unknown'
                        })
                    }
                })
                setFriends(uniqueFriends)
            }

        } catch (error) {
            console.error('Error loading profile:', error)
            toast.error("Profile load nahi hua!")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async () => {
        if (!newName.trim()) return toast.error("Naam to likh!")

        try {
            setLoading(true)
            const updates = {
                id: session.user.id,
                full_name: newName,
                updated_at: new Date(),
            }

            const { error } = await supabase.from('profiles').upsert(updates)
            if (error) throw error

            if (newPassword) {
                if (newPassword.length < 6) throw new Error("Password chota hai! (Min 6 chars)")
                const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword })
                if (pwdError) throw pwdError
                setNewPassword('')
                toast.success("Password bhi update ho gaya!")
            }

            setProfile({ ...profile, ...updates })
            setIsEditing(false)
            toast.success("Profile Chamak gayi! ✨")

        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/')
    }

    return (
        <div className="pb-24 md:pb-8 md:ml-64 min-h-screen">
            {loading ? (
                <div className="flex justify-center items-center h-[80vh] font-bangers text-4xl animate-pulse">
                    Ruko Zara... Sabar Karo... ✋
                </div>
            ) : (
                <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl border-4 border-black shadow-[8px_8px_0_0_black] mt-4 relative">

                    {/* Header */}
                    <h1 className="text-5xl font-bangers mb-8 border-b-4 border-black inline-block">My Profile</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Left Col: User Details */}
                        <div className="space-y-8">
                            {/* Profile Card */}
                            <div className="card-neo bg-primary relative">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="absolute top-4 right-4 p-2 bg-white border-2 border-black rounded-full hover:bg-gray-100"
                                >
                                    {isEditing ? <Check size={20} /> : <Edit2 size={20} />}
                                </button>

                                <div className="flex flex-col items-center mb-4">
                                    <div className="w-24 h-24 bg-black rounded-full border-4 border-white shadow-[4px_4px_0_0_black] flex items-center justify-center text-white text-4xl font-bangers mb-4">
                                        {profile?.full_name?.[0].toUpperCase()}
                                    </div>

                                    {isEditing ? (
                                        <input
                                            className="input-neo text-center text-xl font-bold mb-2"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                            placeholder="Full Name"
                                        />
                                    ) : (
                                        <h2 className="text-3xl font-bangers">{profile?.full_name}</h2>
                                    )}

                                    <p className="font-mono text-sm bg-white/50 px-2 rounded border border-black/20">
                                        {session?.user.email}
                                    </p>
                                </div>

                                {isEditing && (
                                    <div className="bg-white/50 p-4 rounded-xl border-2 border-black mb-4">
                                        <label className="flex items-center gap-2 font-bold mb-1"><Lock size={16} /> New Password</label>
                                        <input
                                            type="password"
                                            className="input-neo w-full bg-white"
                                            placeholder="Leave empty to keep same"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                )}

                                {isEditing && (
                                    <button
                                        onClick={handleUpdate}
                                        className="btn-neo w-full bg-black text-white"
                                    >
                                        Save Changes
                                    </button>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="btn-neo w-full bg-danger text-white mt-4 flex items-center justify-center gap-2"
                                >
                                    <LogOut size={20} /> Logout
                                </button>
                            </div>

                            {/* Friends Section */}
                            <div className="card-neo bg-white">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-bangers flex items-center gap-2">
                                        <Users /> Mere Dost ({friends.length})
                                    </h3>
                                    <button
                                        className="btn-neo bg-accent text-white px-3 py-1 flex items-center gap-1 text-sm"
                                        onClick={() => toast.success("Feature coming soon! (Abhi ke liye group se dost import kiye hain)")}
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                </div>

                                {friends.length === 0 ? (
                                    <p className="text-gray-500 italic">Koi dost nahi mila... (Join groups to find friends)</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {friends.map(friend => (
                                            <div key={friend.id} className="border-2 border-black p-2 rounded bg-gray-50 flex items-center gap-2">
                                                <div className="w-8 h-8 bg-black rounded-full text-white flex items-center justify-center font-bold text-xs">
                                                    {friend.name[0]}
                                                </div>
                                                <span className="font-bold truncate">{friend.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Col: Groups */}
                        <div>
                            <h3 className="text-3xl font-bangers mb-4">Mere Khatay</h3>
                            <div className="space-y-4">
                                {myGroups.length === 0 ? (
                                    <div className="text-center p-8 border-4 border-dashed border-gray-300 rounded-xl">
                                        <p className="text-gray-500 font-bold">No groups yet.</p>
                                    </div>
                                ) : (
                                    myGroups.map(group => (
                                        <div
                                            key={group.id}
                                            onClick={() => navigate(`/group/${group.unique_code}`)}
                                            className="card-neo bg-white cursor-pointer hover:bg-yellow-50 flex justify-between items-center group"
                                        >
                                            <div>
                                                <h4 className="text-xl font-bold group-hover:underline">{group.name}</h4>
                                                <span className="text-xs bg-gray-200 px-1 border border-black/20 font-mono">
                                                    {group.unique_code}
                                                </span>
                                            </div>
                                            <ExternalLink size={20} className="text-gray-400 group-hover:text-black" />
                                        </div>
                                    ))
                                )}

                                <button
                                    onClick={() => navigate('/')}
                                    className="btn-neo w-full bg-white border-dashed border-4 flex items-center justify-center gap-2 text-gray-500 hover:text-black hover:border-black"
                                >
                                    <Plus /> Join / Create Khata
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            <Navigation
                onAdd={() => navigate('/')}
                onSettle={() => toast("Group select kar pehle!")}
            />
        </div>
    )
}

export default ProfilePage
