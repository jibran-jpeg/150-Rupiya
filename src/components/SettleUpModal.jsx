import React, { useState } from 'react'
import { X, Handshake } from 'lucide-react'

const SettleUpModal = ({ isOpen, onClose, members, onSave, currentUserId }) => {
    const [receiverId, setReceiverId] = useState('')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    // Find current user's member record
    const currentMember = members.find(m => m.profile_id === currentUserId)
    const payerId = currentMember?.id || ''

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!receiverId || !amount) {
            alert("Aree hisaab to dhang se kar le! (Please fill all details)")
            return
        }
        if (!payerId) {
            alert("Pehle login kar le bhai!")
            return
        }
        if (payerId === receiverId) {
            alert("Khud ko paisa dega kya? (Payer and Receiver cannot be same)")
            return
        }

        setLoading(true)
        // For settlement: Payer pays Receiver. 
        // In our expense logic: Payer PAID 'amount'. 
        // BUT this is a reimbursement, not a group expense.
        // To balance it out in our "Split Equally" logic is tricky if we don't have a specific settlement type.
        // HACK: We will record it as an expense paid by 'Payer', but description says "Paid to [Receiver]".
        // AND we need to adjust logic? 
        // WAIT. Standard splitwise logic: Settlement is a payment between two people.
        // Our current logic takes Total / Count. 
        // If I pay You 100 separately, it shouldn't affect the Group Total Share?
        // Actually, simpler way for this MVP: 
        // We just add a record. 
        // IF we want to strictly follow "Total / Members" logic, settlements are messy.
        // BETTER LOGIC for MVP: 
        // A Settlement is just an expense where 'paid_by' = Payer.
        // But who is it split among? ONLY the Receiver?
        // Our DB schema `expenses` doesn't support "split_among". It assumes equal split among ALL group members.

        // WORKAROUND for "Split All" architecture:
        // We cannot easily do 1-on-1 settlements without changing schema to support `expense_splits`.
        // changing schema is risky now.

        // ALTERNATIVE:
        // Just a visual "Hisaab Barabar" that doesn't affect the main math? No that's useless.

        // LET'S DO THIS:
        // Add a NEGATIVE expense? No.

        // HACK for "Split Equally" system to support 1-on-1 payment:
        // It's mathematically impossible without 'split_shares'.

        // RE-EVALUATING:
        // The user wants "Settle Up".
        // I can add a `type` column to expenses? Or just assume for now we assume standard behavior.

        // Let's stick to the requested "Funny/Simple" vibe.
        // Maybe we just record it as:
        // "Payer paid Receiver" -> This implies Payer spent money. 
        // If we add it to Total Expense, everyone's share increases. That is WRONG for a settlement.

        // OKAY, critical realization: The current Schema (Total / N) CANNOT support 1-on-1 settlements efficiently.
        // BUT, I can simulate it by:
        // Payer Pays X. 
        // We need to reduce Payer's Debt and Reduce Receiver's Credit.
        // In "Total / N" logic: 
        // Balance = Paid - (Total / N).
        // If Payer pays X to Receiver (off-app or recorded):
        // effectively Payer's "Paid" amount should go UP? 
        // If Payer pays 100. Payer's 'Paid' += 100.
        // Receiver's 'Paid' should go DOWN? (As if they got money back).
        // Yes! If Receiver 'Paid' reduces by 100, their Balance (Paid - Share) reduces.
        // If Payer 'Paid' increases by 100, their Balance increases.
        // This keeps "Total Expense" (and thus Share) CONSTANT.
        // PERFECT MATH HACK!

        await onSave({ payerId, receiverId, amount: parseFloat(amount) })
        setLoading(false)
        setAmount('')
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

                <h2 className="text-3xl font-bangers text-center mb-6">Hisaab Barabar</h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="bg-primary/20 border-2 border-black p-3 rounded-lg">
                        <label className="block font-bold mb-1">Kaun de raha hai? (Payer)</label>
                        <p className="text-xl font-bangers">Main de raha hun: {currentMember?.name || 'Unknown'}</p>
                    </div>

                    <div>
                        <label className="block font-bold mb-1">Kisko mil raha hai? (Receiver)</label>
                        <select
                            value={receiverId}
                            onChange={(e) => setReceiverId(e.target.value)}
                            className="input-neo"
                        >
                            <option value="">Select Bhai</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-bold mb-1">Kitna maal?</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 500"
                            className="input-neo"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-neo w-full flex items-center justify-center gap-2 mt-6 py-3 text-xl bg-success hover:bg-green-700"
                    >
                        {loading ? 'Hisaab ho raha hai...' : <>Maamla Rrafa-Dafa! <Handshake size={24} /></>}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default SettleUpModal
