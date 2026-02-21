import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

export function UpdateDeliveryInfoModal({ isOpen, onClose, vehicle, onSave }) {
    const [formData, setFormData] = useState({
        booking_date: '',
        delivery_date: '',
        delivery_status: 'Pending'
    });
    const [payments, setPayments] = useState([]);
    const [newPayment, setNewPayment] = useState({ receipt: '', amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0] });

    // Pricing Breakdown for Purchase
    const [pricing, setPricing] = useState({
        basePrice: 0,
        extraCharges: 0,
        totalPrice: 0
    });

    useEffect(() => {
        if (vehicle) {
            setFormData({
                booking_date: vehicle.booking_date ? vehicle.booking_date.split('T')[0] : '',
                delivery_date: vehicle.delivery_date ? vehicle.delivery_date.split('T')[0] : '',
                delivery_status: vehicle.delivery_status || 'Pending'
            });

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

            if (vehicle.dealer_pricing_breakdown) {
                try {
                    const parsed = JSON.parse(vehicle.dealer_pricing_breakdown);
                    setPricing(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    setPricing({ basePrice: vehicle.price || 0, extraCharges: 0, totalPrice: vehicle.price || 0 });
                }
            } else {
                setPricing({ basePrice: vehicle.price || 0, extraCharges: 0, totalPrice: vehicle.price || 0 });
            }
        }
    }, [vehicle]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddPayment = () => {
        if (!newPayment.amount || !newPayment.receipt) {
            toast.error("Please fill required fields");
            return;
        }
        const updatedPayments = [...payments, newPayment];
        setPayments(updatedPayments);
        setNewPayment({ receipt: '', amount: '', method: 'Cash', date: new Date().toISOString().split('T')[0] });
    };

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        const val = parseFloat(value) || 0;
        setPricing(prev => {
            const updated = { ...prev, [name]: val };
            updated.totalPrice = updated.basePrice + updated.extraCharges;
            return updated;
        });
    };

    const handleSave = () => {
        const payload = {
            ...vehicle,
            ...formData,
            dealer_payment_history: JSON.stringify(payments),
            dealer_pricing_breakdown: JSON.stringify(pricing),
            price: pricing.totalPrice // Update main price if changed here
        };
        onSave(payload);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="UPDATE DELIVERY INFORMATION" className="max-w-4xl">
            <div className="space-y-6">

                {/* 1. Delivery Information */}
                <div>
                    <h4 className="text-sm font-bold uppercase text-slate-700 mb-3">Update Delivery Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-md border border-slate-100">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Booking Date</label>
                            <Input type="date" name="booking_date" value={formData.booking_date || ''} onChange={handleChange} className="bg-white h-9" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Delivery Date</label>
                            <Input type="date" name="delivery_date" value={formData.delivery_date || ''} onChange={handleChange} className="bg-white h-9" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Delivery Status</label>
                            <select
                                name="delivery_status"
                                value={formData.delivery_status || 'Pending'}
                                onChange={handleChange}
                                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 my-4"></div>

                {/* 2. Purchase Payment History */}
                <div>
                    <h4 className="text-sm font-bold uppercase text-slate-700 mb-3">Purchase Payment History</h4>

                    <div className="flex gap-4 mb-4 text-xs font-medium">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">PAID: {payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}</span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">REMAINING: {(pricing.totalPrice - payments.reduce((sum, p) => sum + Number(p.amount), 0)).toLocaleString()}</span>
                    </div>

                    <div className="p-4 border rounded-md bg-slate-50 space-y-4 mb-4">
                        <h5 className="text-xs font-bold uppercase text-slate-600">Add Payment {vehicle?.id}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Dealer Receipt</label>
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
                            <Button size="sm" onClick={handleAddPayment} className="w-full">Add Payment</Button>
                        </div>
                    </div>

                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-slate-600 text-xs uppercase">Dealer Receipt</th>
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

                <div className="border-t border-slate-100 my-4"></div>

                {/* 3. Pricing Breakdown */}
                <div>
                    <h4 className="text-sm font-bold uppercase text-slate-700 mb-3">Vehicle Pricing Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Base Price</label>
                            <Input type="number" name="basePrice" value={pricing.basePrice ?? ''} onChange={handlePriceChange} className="bg-slate-50 text-right font-mono" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Extra Charges</label>
                            <Input type="number" name="extraCharges" value={pricing.extraCharges ?? ''} onChange={handlePriceChange} className="bg-slate-50 text-right font-mono" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500">Total Price</label>
                            <div className="h-10 px-3 py-2 bg-blue-50 rounded-md text-right font-bold text-blue-700 font-mono flex items-center justify-end border border-blue-100">
                                {pricing.totalPrice.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <ModalFooter>
                <div className="w-full">
                    <Button className="w-full" onClick={handleSave}>Update Delivery Info</Button>
                </div>
            </ModalFooter>
        </Modal>
    );
}
