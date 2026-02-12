import React from 'react'
import { Home, BarChart2, Plus, Handshake, User, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

// NavItem Component for cleaner code
const NavItem = ({ icon: Icon, label, onClick, active, disabled, className }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
            group flex items-center justify-center md:justify-start gap-4 p-3 rounded-xl transition-all w-full
            ${active ? 'bg-primary border-2 border-black shadow-[2px_2px_0_0_black]' : 'hover:bg-gray-100'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
            ${className}
        `}
        title={label}
    >
        <Icon size={28} strokeWidth={2.5} />
        <span className="hidden md:inline font-bold text-lg">{label}</span>
    </button>
)

const Navigation = ({ onAdd, onSettle }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const isProfile = location.pathname === '/profile'
    const isStats = location.pathname === '/stats'
    const isDashboard = location.pathname.startsWith('/group') || location.pathname === '/'

    return (
        <>
            {/* Desktop Sidebar (md:flex) */}
            <div className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 bg-white border-r-4 border-black p-6 z-50 justify-between">

                {/* Logo Area */}
                <div>
                    <div className="mb-8 flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" onError={(e) => e.target.style.display = 'none'} />
                        <h1 className="text-3xl font-bangers">150 Rupiya</h1>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex flex-col gap-4">
                        <NavItem
                            icon={Home}
                            label="Dashboard"
                            onClick={() => navigate('/')}
                            active={isDashboard}
                        />
                        <NavItem
                            icon={BarChart2}
                            label="Stats"
                            onClick={() => navigate('/stats')}
                            active={isStats}
                        />
                        <NavItem
                            icon={User}
                            label="Profile"
                            onClick={() => navigate('/profile')}
                            active={isProfile}
                        />
                    </nav>
                </div>

                {/* Actions Area */}
                <div className="flex flex-col gap-4">
                    <button
                        onClick={onAdd}
                        className="btn-neo bg-accent text-white flex items-center justify-center gap-2 w-full py-3"
                    >
                        <Plus size={24} />
                        <span className="font-bold">Add Kharcha</span>
                    </button>

                    <button
                        onClick={onSettle}
                        className="btn-neo bg-success text-white flex items-center justify-center gap-2 w-full py-3"
                    >
                        <Handshake size={24} />
                        <span className="font-bold">Settle Up</span>
                    </button>

                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                        <NavItem icon={LogOut} label="Logout" className="text-danger hover:bg-red-50" />
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar (md:hidden) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black p-2 flex justify-around items-center z-50 h-20 pb-4">
                <button
                    onClick={() => navigate('/')}
                    className={`p-2 transition-transform ${isDashboard ? 'bg-black text-white rounded-full' : 'active:scale-95'}`}
                >
                    <Home size={28} strokeWidth={2.5} />
                </button>
                <button
                    onClick={() => navigate('/stats')}
                    className={`p-2 transition-transform ${isStats ? 'bg-black text-white rounded-full' : 'active:scale-95'}`}
                >
                    <BarChart2 size={28} strokeWidth={2.5} />
                </button>

                <button
                    onClick={onAdd}
                    className="bg-accent text-white p-3 rounded-xl border-2 border-black shadow-[2px_2px_0_0_black] -mt-8 active:translate-y-1 active:shadow-none transition-all"
                >
                    <Plus size={32} strokeWidth={3} />
                </button>

                <button onClick={onSettle} className="p-2 active:scale-95 transition-transform"><Handshake size={28} strokeWidth={2.5} /></button>

                <button
                    onClick={() => navigate('/profile')}
                    className={`p-2 transition-transform ${isProfile ? 'bg-black text-white rounded-full' : 'active:scale-95'}`}
                >
                    <User size={28} strokeWidth={2.5} />
                </button>
            </div>
        </>
    )
}

export default Navigation
