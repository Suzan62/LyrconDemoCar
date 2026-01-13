import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function DealerDetailsModal({ isOpen, onClose, vehicle, onSave }) {
    const [payments, setPayments] = useState([]);
    const [purchasePrice, setPurchasePrice] = useState(vehicle?.price || 0);

    // In a real app, you'd fetch this from a separate 'DealerPayments' table related to the vehicle
    // Here we'll simulate it with the vehicle.dealer_payment_history JSON field

    useEffect(() => {
        if (vehicle) {
            setPurchasePrice(vehicle.price || 0);
            if (vehicle.dealer_payment_history) {
                try {
                    const parsed = JSON.parse(vehicle.dealer_payment_history);
                    setPayments(Array.isArray(parsed) ? parsed : []);
                } catch (e) {
                    setPayments([]);
                }
            } else {
                setPayments([]);
            }
        }
    }, [vehicle]);

    const [newPayment, setNewPayment] = useState({ receipt: '', amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0] });

    const handleAddPayment = () => {
        if (!newPayment.amount || !newPayment.receipt) {
            toast.error("Please fill required fields");
            return;
        }
        const updated = [...payments, newPayment];
        setPayments(updated);
        setNewPayment({ receipt: '', amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0] });

        // Auto save to vehicle object for persistence
        onSave({
            ...vehicle,
            price: purchasePrice,
            dealer_payment_history: JSON.stringify(updated)
        }, true); // true = silent save
    };

    const handleUpdate = () => {
        onSave({
            ...vehicle,
            price: purchasePrice,
            dealer_payment_history: JSON.stringify(payments)
        });
        onClose();
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`DEALER DETAILS - CAR #${vehicle?.id}`} className="max-w-4xl">
            <div className="space-y-6">

                {/* Payment History */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase text-slate-700">Dealer Payment History</h4>
                    <div className="flex gap-4 text-xs font-medium mb-2">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">PAID: {payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}</span>
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">REMAINING: {(purchasePrice - payments.reduce((sum, p) => sum + Number(p.amount), 0)).toLocaleString()}</span>
                    </div>

                    <div className="p-4 border rounded-md bg-blue-50/30 space-y-4">
                        <h5 className="text-xs font-bold uppercase text-slate-600">Purchase Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Purchase Price (Total Amount)</label>
                                <Input
                                    type="number"
                                    value={purchasePrice}
                                    onChange={e => setPurchasePrice(Number(e.target.value))}
                                    className="h-8 bg-white"
                                    placeholder="Total Purchase Price"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border rounded-md bg-slate-50 space-y-4">
                        <h5 className="text-xs font-bold uppercase text-slate-600">Add Payment</h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Receipt No</label>
                                <Input value={newPayment.receipt} onChange={e => setNewPayment({ ...newPayment, receipt: e.target.value })} className="h-8 bg-white" placeholder="Receipt #" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Amount</label>
                                <Input type="number" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} className="h-8 bg-white" placeholder="Amount" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Method</label>
                                <select
                                    className="flex h-8 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none"
                                    value={newPayment.method}
                                    onChange={e => setNewPayment({ ...newPayment, method: e.target.value })}
                                >
                                    <option>Cash</option>
                                    <option>Cheque</option>
                                    <option>Online</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Date</label>
                                <Input type="date" value={newPayment.date} onChange={e => setNewPayment({ ...newPayment, date: e.target.value })} className="h-8 bg-white" />
                            </div>
                        </div>
                        <Button size="sm" onClick={handleAddPayment} className="w-full">Add Payment</Button>
                    </div>

                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-slate-600 text-xs uppercase">Receipt</th>
                                    <th className="p-3 text-left font-semibold text-slate-600 text-xs uppercase">Method</th>
                                    <th className="p-3 text-right font-semibold text-slate-600 text-xs uppercase">Amount</th>
                                    <th className="p-3 text-right font-semibold text-slate-600 text-xs uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length > 0 ? (
                                    payments.map((p, idx) => (
                                        <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="p-3 text-xs md:text-sm">{p.receipt}</td>
                                            <td className="p-3 text-xs md:text-sm">{p.method}</td>
                                            <td className="p-3 text-right text-xs md:text-sm font-mono">{Number(p.amount).toLocaleString()}</td>
                                            <td className="p-3 text-right text-xs md:text-sm text-slate-500">{p.date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-muted-foreground text-xs uppercase">No payments recorded</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Dealer Pricing Breakdown (Placeholder similar to Customer one if needed, keeping simple for now) */}
                <div className="space-y-2">
                    <h4 className="text-sm font-bold uppercase text-slate-700">Vehicle Pricing Breakdown</h4>
                    <div className="border rounded-md p-4 bg-slate-50 text-center text-xs text-muted-foreground">
                        Dealer pricing structure same as customer details...
                    </div>
                </div>

            </div>
            <ModalFooter>
                <div className="w-full">
                    <Button className="w-full" onClick={handleUpdate}>Update and Add Payments</Button>
                </div>
            </ModalFooter>
        </Modal>
    );
}
