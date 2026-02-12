import React, { useState } from 'react'
import { X, Check } from 'lucide-react'

const AddExpenseModal = ({ isOpen, onClose, members, onSave, currentUserId }) => {
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    // Find current user's member record
    const currentMember = members.find(m => m.profile_id === currentUserId)
    const payerId = currentMember?.id || ''

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!amount || !description) {
            alert("Aree kharcha kisne kiya? Aur kitna? (Please fill all details)")
            return
        }
        if (!payerId) {
            alert("Pehle login kar le bhai!")
            return
        }

        setLoading(true)
        await onSave({ payerId, amount: parseFloat(amount), description })
        setLoading(false)
        // Reset form
        setAmount('')
        setDescription('')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full border-2 border-black"
                >
                    <X size={24} />
                </button>

                <h2 className="text-3xl font-bangers text-center mb-6">Kharcha Pani</h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="bg-primary/20 border-2 border-black p-3 rounded-lg">
                        <label className="block font-bold mb-1">Kis ki jeb dhilli hui?</label>
                        <p className="text-xl font-bangers">Meri jeb: {currentMember?.name || 'Unknown'}</p>
                    </div>

                    <div>
                        <label className="block font-bold mb-1">Kitna chuna laga?</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 150"
                            className="input-neo"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="block font-bold mb-1">Kya kaarnaama kiya?</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Chai Sutta"
                            className="input-neo"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-neo w-full flex items-center justify-center gap-2 mt-6 py-3 text-xl"
                    >
                        {loading ? 'Likh raha hu...' : <>Likhlia! <Check size={24} /></>}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AddExpenseModal
