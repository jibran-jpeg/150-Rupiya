import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const LoginPage = () => {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [isForgotPassword, setIsForgotPassword] = useState(false) // New State
    const navigate = useNavigate()

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isSignUp) {
                // Email-only Signup (Magic Link)
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: window.location.origin,
                    },
                })
                if (error) throw error
                toast.success('Jadoo ki link bhej di! Check Email. 🪄')
            } else {
                // Traditional Login
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                toast.success('Login successful! 🚀')
                navigate('/')
            }
        } catch (error) {
            console.error('Auth Error:', error)
            if (error.message.includes('rate limit')) {
                toast.error("Ruko zara, sabar karo! (Too many requests. Wait a bit.)")
            } else if (error.message.includes('Invalid login credentials')) {
                toast.error("Galat hai bhai! Sahi email/password daal.")
            } else {
                toast.error(error.message)
            }
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordReset = async (e) => {
        e.preventDefault()
        if (!email) return toast.error("Email to daal bhai!")

        setLoading(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/profile`, // Redirect to profile to set new password
            })
            if (error) throw error
            toast.success("Password reset link bhej di! Email check kar. 📧")
            setIsForgotPassword(false) // Go back to login
        } catch (error) {
            console.error('Reset Error:', error)
            if (error.message.includes('rate limit')) {
                toast.error("Ruko zara, sabar karo! (Too many requests. Wait a bit.)")
            } else {
                toast.error(error.message)
            }
        } finally {
            setLoading(false)
        }
    }

    // FORGOT PASSWORD VIEW
    if (isForgotPassword) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                <div className="card-neo w-full max-w-md bg-white">
                    <h1 className="text-4xl font-bangers mb-2">Bhool Gaya? 🤦‍♂️</h1>
                    <p className="text-gray-600 mb-6 font-bold">
                        Koi baat nahi, email daal, reset link bhejta hu.
                    </p>

                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div>
                            <input
                                className="input-neo w-full"
                                type="email"
                                placeholder="Email (jispe account hai)"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            className="btn-neo w-full bg-primary text-black hover:bg-yellow-500"
                            disabled={loading}
                        >
                            {loading ? 'Bhej raha hu...' : 'Send Reset Link 📩'}
                        </button>
                    </form>

                    <button
                        onClick={() => setIsForgotPassword(false)}
                        className="mt-4 text-sm font-bold underline hover:text-black text-gray-500"
                    >
                        ← Wapis Login Pe Ja
                    </button>
                </div>
            </div>
        )
    }

    // LOGIN / SIGNUP VIEW
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <div className="card-neo w-full max-w-md bg-white">
                <h1 className="text-4xl font-bangers mb-2">
                    {isSignUp ? 'Naya Khata Khol!' : 'Aaja Bhai!'}
                </h1>
                <p className="text-gray-600 mb-6 font-bold">
                    {isSignUp ? 'Email daal, link aayega, sab set ho jayega.' : 'Password daal ke andar aaja.'}
                </p>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <input
                            className="input-neo w-full"
                            type="email"
                            placeholder="Email (e.g. raju@hera.pheri)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Only show password for LOGIN */}
                    {!isSignUp && (
                        <div className="animate-in fade-in slide-in-from-top-2 text-right">
                            <div className="relative">
                                <input
                                    className="input-neo w-full mb-1 pr-10"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password (kisi ko batana mat)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-500 hover:text-black"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsForgotPassword(true)}
                                className="text-xs font-bold text-gray-500 hover:text-red-500 underline"
                            >
                                Password bhool gaya?
                            </button>
                        </div>
                    )}

                    <button
                        className="btn-neo w-full bg-primary text-black hover:bg-yellow-500"
                        disabled={loading}
                    >
                        {loading ? 'Ruko jara...' : (isSignUp ? 'Bhej Email Link 📧' : 'Login')}
                    </button>
                </form>

                <p className="mt-4 text-sm font-bold">
                    {isSignUp ? 'Pehle se account hai?' : 'Sirf Email se aana hai?'}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="ml-2 text-accent underline hover:text-red-600"
                    >
                        {isSignUp ? 'Login kar le' : 'Naya Account (Sign Up)'}
                    </button>
                </p>
            </div>
        </div>
    )
}

export default LoginPage
