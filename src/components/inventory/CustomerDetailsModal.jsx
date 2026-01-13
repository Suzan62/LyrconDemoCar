import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export function CustomerDetailsModal({ isOpen, onClose, vehicle, onSave }) {
    const [formData, setFormData] = useState({});
    const [pricing, setPricing] = useState({
        exShowroom: 0,
        rtoTax: 0,
        insurance: 0,
        amcGmc: 0,
        warranty: 0,
        accessories: 0,
        parivahan: 0,
        fastTag: 0,
        tcs: 0,
        trc: 0,
        loyaltyCard: 0,
        driverPrice: 0,
        totalOnRoad: 0,
        consumerOffer: 0,
        corporateDiscount: 0,
        otherDiscount: 0,
        netShortPayment: 0
    });

    useEffect(() => {
        if (vehicle) {
            setFormData({
                buyer_name: vehicle.buyer_name || '',
                buyer_phone: vehicle.phone || '', // Check field mapping
                address_line_1: vehicle.address_line_1 || '',
                address_line_2: vehicle.address_line_2 || '',
                city: vehicle.city || '',
                pincode: vehicle.pincode || '',
                buyer_email: vehicle.buyer_email || '',
                buyer_dob: vehicle.buyer_dob ? vehicle.buyer_dob.split('T')[0] : '',
                delivery_date: vehicle.delivery_date ? vehicle.delivery_date.split('T')[0] : '',
                booking_date: vehicle.booking_date ? vehicle.booking_date.split('T')[0] : '',
                status: vehicle.status || 'Available'
            });

            if (vehicle.vehicle_pricing_breakdown) {
                try {
                    const parsed = JSON.parse(vehicle.vehicle_pricing_breakdown);
                    setPricing(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error("Failed to parse pricing", e);
                }
            }
        }
    }, [vehicle]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePriceChange = (e) => {
        setPricing({ ...pricing, [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    const handleSave = () => {
        const payload = {
            ...vehicle,
            ...formData,
            vehicle_pricing_breakdown: JSON.stringify(pricing)
        };
        onSave(payload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`CUSTOMER DETAILS - CAR #${vehicle?.id}`} className="max-w-4xl">
            <div className="space-y-6">

                {/* Customer Details Form */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase text-slate-700">Customer Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Customer Name*</label>
                            <Input name="buyer_name" value={formData.buyer_name} onChange={handleChange} placeholder="Enter Customer Name" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Customer Phone*</label>
                            <Input name="buyer_phone" value={formData.buyer_phone} onChange={handleChange} placeholder="Enter Customer Phone" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Address Line 1*</label>
                            <Input name="address_line_1" value={formData.address_line_1} onChange={handleChange} placeholder="Enter Address Line 1" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Address Line 2</label>
                            <Input name="address_line_2" value={formData.address_line_2} onChange={handleChange} placeholder="Enter Address Line 2" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">City*</label>
                            <Input name="city" value={formData.city} onChange={handleChange} placeholder="Enter City Name" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Pincode*</label>
                            <Input name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Enter Pincode" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Email*</label>
                            <Input name="buyer_email" value={formData.buyer_email} onChange={handleChange} placeholder="Enter Email" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Date of Birth*</label>
                            <Input type="date" name="buyer_dob" value={formData.buyer_dob} onChange={handleChange} className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Delivery Date*</label>
                            <Input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Booking Date*</label>
                            <Input type="date" name="booking_date" value={formData.booking_date} onChange={handleChange} className="bg-slate-50" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Delivery Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Available">Available</option>
                                <option value="Sold">Sold</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Manage Documents */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase text-slate-700">Manage Documents</h4>
                    <div className="flex gap-2">
                        <Button className="w-full bg-blue-100 text-blue-600 hover:bg-blue-200 border-none shadow-none">Add Document</Button>
                    </div>
                    <Button className="w-full">Save Customer Details</Button>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase text-slate-700">Vehicle Pricing Breakdown</h4>
                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-slate-600 text-xs uppercase">Particulars</th>
                                    <th className="p-3 text-right font-semibold text-slate-600 text-xs uppercase w-48">Customer Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[
                                    { label: 'Ex-Showroom Price', key: 'exShowroom' },
                                    { label: 'RTO Tax', key: 'rtoTax' },
                                    { label: 'Insurance', key: 'insurance' },
                                    { label: 'AMC/GMC Tax', key: 'amcGmc' },
                                    { label: 'Extended Warranty', key: 'warranty' },
                                    { label: 'Accessories', key: 'accessories' },
                                    { label: 'Parivar Accessories', key: 'parivahan' },
                                    { label: 'Fast Tag', key: 'fastTag' },
                                    { label: 'TCS', key: 'tcs' },
                                    { label: 'TRC', key: 'trc' },
                                    { label: 'Loyalty Card', key: 'loyaltyCard' },
                                    { label: 'Driver Price', key: 'driverPrice' },
                                ].map((item) => (
                                    <tr key={item.key}>
                                        <td className="p-3 text-xs md:text-sm font-medium text-slate-700 uppercase">{item.label}</td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                name={item.key}
                                                value={pricing[item.key]}
                                                onChange={handlePriceChange}
                                                className="text-right h-8"
                                            />
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-blue-50">
                                    <td className="p-3 text-xs md:text-sm font-bold text-slate-900 uppercase">Total On-Road Price</td>
                                    <td className="p-3 text-right font-bold text-slate-900">
                                        {(Object.values(pricing).reduce((a, b) => a + b, 0) - (pricing.consumerOffer + pricing.corporateDiscount + pricing.otherDiscount + pricing.netShortPayment)).toLocaleString()}
                                    </td>
                                </tr>
                                <tr className="bg-white">
                                    <td colSpan={2} className='h-4'></td>
                                </tr>
                                {[
                                    { label: 'Consumer Offer', key: 'consumerOffer' },
                                    { label: 'Corporate Discount', key: 'corporateDiscount' },
                                    { label: 'Other Discount', key: 'otherDiscount' },
                                    { label: 'Net Short Payment', key: 'netShortPayment' },
                                ].map((item) => (
                                    <tr key={item.key}>
                                        <td className="p-3 text-xs md:text-sm font-medium text-slate-700 uppercase">{item.label}</td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                name={item.key}
                                                value={pricing[item.key]}
                                                onChange={handlePriceChange}
                                                className="text-right h-8"
                                            />
                                        </td>
                                    </tr>
                                ))}

                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
            <ModalFooter>
                <Button variant="outline" onClick={onClose}>Close</Button>
                <Button onClick={handleSave}>Save Pricing Details</Button>
            </ModalFooter>
        </Modal>
    );
}
