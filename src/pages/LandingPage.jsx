import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Plus, LogOut, Users, ArrowRight, Quote } from 'lucide-react'
import Navigation from '../components/Navigation'
import toast from 'react-hot-toast'
import { getRandomDialogue } from '../utils/quotes'

const LandingPage = () => {
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState(null)
    const [myRooms, setMyGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [joinCode, setJoinCode] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [fullName, setFullName] = useState('')
    const [newPassword, setNewPassword] = useState('')

    // Daily Gyan
    const [gyan, setGyan] = useState({ text: "Loading...", character: "..." })

    const navigate = useNavigate()

    useEffect(() => {
        setGyan(getRandomDialogue())
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session) checkProfileAndRooms(session.user.id)
            else setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (session) checkProfileAndRooms(session.user.id)
            else setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const checkProfileAndRooms = async (userId) => {
        try {
            setLoading(true)

            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (profileError && profileError.code !== 'PGRST116') throw profileError

            const currentProfile = profileData || { id: userId }
            setProfile(currentProfile)

            if (currentProfile.full_name) {
                // Only fetch rooms if profile is complete
                fetchMyRooms(userId)
            } else {
                setLoading(false)
            }

        } catch (error) {
            console.error('Error fetching data:', error)
            setLoading(false)
        }
    }

    const fetchMyRooms = async (userId) => {
        try {
            const { data } = await supabase
                .from('members')
                .select('group_id, groups(*)')
                .eq('profile_id', userId)

            const rooms = data?.map(item => item.groups).filter(Boolean) || []
            setMyGroups(rooms)
        } catch (error) {
            console.error('Error fetching rooms', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateProfile = async () => {
        if (!fullName.trim()) return toast.error("Naam to bata de bhai!")
        if (newPassword && newPassword.length < 6) return toast.error("Password kam se kam 6 characters ka rakh!")

        try {
            setLoading(true)
            const user = session.user

            const updates = {
                id: user.id,
                full_name: fullName.trim(),
                updated_at: new Date(),
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(updates)

            if (profileError) throw profileError

            // Set Password if provided
            if (newPassword) {
                const { error: authError } = await supabase.auth.updateUser({
                    password: newPassword
                })
                if (authError) throw authError
            }

            setProfile({ ...profile, ...updates })
            toast.success("Profile aur Password Set! 🚀")
            fetchMyRooms(user.id)

        } catch (error) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return toast.error("Naam to likh de bhai!")

        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase()
            const user = session.user

            // 1. Create Group
            const { data: group, error: groupError } = await supabase
                .from('groups')
                .insert([{
                    name: newGroupName,
                    unique_code: code,
                    created_by: user.id
                }])
                .select()
                .single()

            if (groupError) throw groupError

            // 2. Add Creator as Member
            const { error: memberError } = await supabase
                .from('members')
                .insert([{
                    group_id: group.id,
                    profile_id: user.id,
                    name: profile.full_name || 'Admin'
                }])

            if (memberError) throw memberError

            toast.success("Dhanda Shuru! 🚀")
            navigate(`/group/${code}`)

        } catch (error) {
            console.error(error)
            toast.error(error.message)
        }
    }

    const handleJoinGroup = async () => {
        if (!joinCode.trim()) return toast.error("Code kahan hai?")

        try {
            const user = session.user

            // 1. Find Group
            const { data: group, error: groupError } = await supabase
                .from('groups')
                .select('id, unique_code')
                .eq('unique_code', joinCode.toUpperCase())
                .single()

            if (groupError || !group) throw new Error("Galat code hai bidu!")

            // 2. Check if already member
            const { data: existing } = await supabase
                .from('members')
                .select('*')
                .eq('group_id', group.id)
                .eq('profile_id', user.id)
                .single()

            if (existing) {
                toast.success("Pehle se hi andar hai tu!")
                navigate(`/group/${group.unique_code}`)
                return
            }

            // 3. Add Member
            const { error: joinError } = await supabase
                .from('members')
                .insert([{
                    group_id: group.id,
                    profile_id: user.id,
                    name: profile.full_name || 'Member'
                }])

            if (joinError) throw joinError

            toast.success("Swagat hai! 🎉")
            navigate(`/group/${group.unique_code}`)

        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setSession(null)
        setMyGroups([])
        setProfile(null)
    }

    if (loading) {
        return (
            <div className="min-h-screen pb-24 md:pb-8 md:ml-64">
                <div className="flex h-[80vh] items-center justify-center font-bangers text-4xl animate-pulse">
                    Ruko Zara... Sabar Karo... ✋
                </div>
                <Navigation
                    onAdd={() => {
                        setIsCreating(true)
                        window.scrollTo({ top: 300, behavior: 'smooth' })
                    }}
                    onSettle={() => toast.error("Pehle kisi Khate me ja!")}
                />
            </div>
        )
    }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <div className="relative group mb-8">
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-full w-48 h-48 flex items-center justify-center mx-auto overflow-hidden">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-cover scale-110" />
                    </div>
                </div>
                <h1 className="text-5xl font-bangers mb-4">150 RUPIYA</h1>
                <p className="text-xl font-bold mb-8 rotate-[-1deg] bg-white inline-block px-2 border-2 border-black">
                    ...dega. Kachra Seth ka wada hai!
                </p>
                <button
                    onClick={() => navigate('/login')}
                    className="btn-neo text-2xl px-12 py-4 bg-primary text-black hover:scale-105 transition-transform"
                >
                    Login to Start 🔐
                </button>
            </div>
        )
    }

    // PROFILE SETUP SCREEN
    if (!profile?.full_name) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="card-neo bg-white max-w-md w-full">
                    <h1 className="text-4xl font-bangers mb-2">Kaun hai re tu? 🤨</h1>
                    <p className="text-gray-600 font-bold mb-6">Profile set karle bhai.</p>

                    <div className="mb-4">
                        <label className="block text-lg font-bold mb-2">Pura Naam (Full Name)</label>
                        <input
                            type="text"
                            className="input-neo w-full"
                            placeholder="e.g. Raju, Shyam, Baburao..."
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-lg font-bold mb-2">Password Set Karle (Future ke liye)</label>
                        <input
                            type="password"
                            className="input-neo w-full"
                            placeholder="Secret Password..."
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Taaki agli baar login kar sake.</p>
                    </div>

                    <button
                        onClick={handleUpdateProfile}
                        className="btn-neo w-full bg-primary text-xl"
                    >
                        Save Details ➡️
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="max-w-xl mx-auto pb-24 md:pb-8 md:ml-64 min-h-screen">
                <div className="bg-white p-4 rounded-xl border-4 border-black shadow-[8px_8px_0_0_black] mt-4 mx-4 md:mx-0">

                    {/* Header Profile */}
                    <header className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0_0_black]">
                            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bangers text-lg border-2 border-white">
                                {profile.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-xl font-bangers leading-none">{profile.full_name.split(' ')[0]}</h1>
                                <p className="text-[10px] text-gray-600 font-bold opacity-70 leading-none">THE BOSS</p>
                            </div>
                        </div>
                    </header>

                    {/* Babu Bhaiya ka Gyan (Daily Quote) */}
                    <div className="card-neo bg-white mb-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Quote size={64} fill="black" />
                        </div>
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Babu Bhaiya ka Gyan</p>
                        <p className="text-xl font-bold italic mb-2">"{gyan.text}"</p>
                        <p className="text-right font-bangers text-lg text-primary">- {gyan.character}</p>
                    </div>

                    {/* Create/Join Actions */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="btn-neo bg-primary flex flex-col items-center justify-center gap-2 py-6 hover:rotate-1 transition-transform"
                        >
                            <Plus strokeWidth={3} size={32} />
                            <span className="font-bangers text-xl">Naya Khata</span>
                        </button>

                        <div className="card-neo bg-white p-2 flex flex-col justify-between">
                            <h2 className="text-sm font-bold flex items-center gap-1"><Users size={16} /> Join Khata</h2>
                            <div className="flex gap-1 mt-2">
                                <input
                                    type="text"
                                    placeholder="CODE"
                                    className="input-neo w-full text-center uppercase p-1 text-sm"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                />
                                <button onClick={handleJoinGroup} className="btn-neo bg-black text-white px-2 py-1">
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Create Room Form (Conditional) */}
                    {isCreating && (
                        <div className="card-neo bg-black text-white mb-8 animate-in fade-in slide-in-from-bottom-4 border-white">
                            <h2 className="text-xl font-bold mb-2 text-primary">Naam kya hai Khate ka?</h2>
                            <input
                                type="text"
                                placeholder="e.g. Goa Trip 2026..."
                                className="input-neo w-full mb-4 text-black"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button onClick={handleCreateGroup} className="btn-neo flex-1 bg-primary text-black">Create 🚀</button>
                                <button onClick={() => setIsCreating(false)} className="btn-neo flex-1 bg-white text-black">Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* My Rooms Grid */}
                    <h3 className="text-3xl font-bangers mb-4 border-b-4 border-black inline-block bg-white px-2">Mere Khatay</h3>
                    {myRooms.length === 0 ? (
                        <div className="text-center opacity-60 mt-8 py-10 border-4 border-dashed border-black/20 rounded-xl bg-white/50">
                            <p className="font-bold text-xl">Sannata hai bhai...</p>
                            <p>Koi Khata join kar ya naya bana.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myRooms.map(room => (
                                <div
                                    key={room.id}
                                    onClick={() => navigate(`/group/${room.unique_code}`)}
                                    className="card-neo bg-white cursor-pointer hover:translate-y-[-4px] hover:shadow-[8px_8px_0_0_black] transition-all relative overflow-hidden h-32 flex flex-col justify-between group"
                                >
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary rounded-full opacity-20 group-hover:scale-150 transition-transform"></div>

                                    <h4 className="font-bold text-2xl z-10 line-clamp-2 leading-tight">{room.name}</h4>
                                    <div className="flex justify-between items-end z-10">
                                        <span className="text-xs bg-black text-white px-2 py-1 font-mono rounded-md">
                                            {room.unique_code}
                                        </span>
                                        <ArrowRight size={24} className="group-hover:-rotate-45 transition-transform" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <footer className="mt-12 text-center text-xs font-bold opacity-60 pb-8">
                        <p>Powered by <span className="font-bangers text-lg">Laxmi Chit Fund</span> 💰</p>
                        <p>Since 2000 • 21 Din mein Paisa Double</p>
                    </footer>
                </div>

                <Navigation
                    onAdd={() => {
                        setIsCreating(true)
                        window.scrollTo({ top: 300, behavior: 'smooth' })
                    }}
                    onSettle={() => toast.error("Pehle kisi Khate me ja!")}
                />
            </div>
        </div>
    )
}

export default LandingPage

