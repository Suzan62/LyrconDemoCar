import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export function CustomerDetailsModal({ isOpen, onClose, vehicle, onSave }) {
    const [formData, setFormData] = useState({
        buyer_name: '',
        buyer_phone: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        pincode: '',
        buyer_email: '',
        buyer_dob: '',
        delivery_date: '',
        booking_date: '',
        status: 'Available'
    });
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
    const [customDocs, setCustomDocs] = useState([]);
    const [newDocName, setNewDocName] = useState('');
    const [newDocFile, setNewDocFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (vehicle) {
            setFormData({
                buyer_name: vehicle.buyer_name || '',
                buyer_phone: vehicle.phone || vehicle.customer_phone || '',
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
            // Reset docs when vehicle changes
            setCustomDocs([]);
            setNewDocName('');
            setNewDocFile(null);
        }
    }, [vehicle]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePriceChange = (e) => {
        setPricing({ ...pricing, [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    const handleAddCustomDoc = () => {
        if (!newDocName.trim()) {
            toast.error('Please enter a document name');
            return;
        }
        if (!newDocFile) {
            toast.error('Please select a file');
            return;
        }
        setCustomDocs(prev => [...prev, { name: newDocName.trim(), file: newDocFile }]);
        setNewDocName('');
        setNewDocFile(null);
        toast.success(`Document "${newDocName.trim()}" added — click Save to upload`);
    };

    const handleRemoveDoc = (index) => {
        setCustomDocs(prev => prev.filter((_, i) => i !== index));
    };


    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Build the merged payload
            // IMPORTANT: explicitly set all name/email/phone aliases so the backend
            // picks up the NEW form values instead of the stale aliases from ...vehicle
            const basePayload = {
                ...vehicle,        // base vehicle data (id, transaction_type, manufacturer, etc.)
                ...formData,       // new form values (buyer_name, buyer_phone, etc.)
                // Explicitly override ALL aliases the backend may use — prevents stale spread values winning
                buyer_name: formData.buyer_name,
                customer_name: formData.buyer_name,          // backend checks customer_name first!
                customer_phone: formData.buyer_phone || vehicle?.customer_phone || vehicle?.phone || '',
                phone: formData.buyer_phone || vehicle?.phone || '',
                buyer_email: formData.buyer_email,
                email: formData.buyer_email,          // alias used by backend
                address_line_1: formData.address_line_1,
                address_line_2: formData.address_line_2,
                city: formData.city,
                city_name: formData.city,                 // alias
                pincode: formData.pincode,
                booking_date: formData.booking_date || null,
                delivery_date: formData.delivery_date || null,
                buyer_dob: formData.buyer_dob || null,
                customer_dob: formData.buyer_dob || null,
                status: formData.status,
            };

            let savedVehicle = null;

            if (customDocs.length > 0) {
                // Use FormData to upload files along with the save
                const data = new FormData();
                Object.keys(basePayload).forEach(key => {
                    if (basePayload[key] !== null && basePayload[key] !== undefined) {
                        data.append(key, basePayload[key]);
                    }
                });
                customDocs.forEach((doc, i) => {
                    data.append(`doc_name_${i}`, doc.name);
                    data.append(`doc_file_${i}`, doc.file);
                });
                const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: 'PUT', body: data });
                if (!res.ok) {
                    const err = await res.json();
                    toast.error(`Save failed: ${err.message || 'Unknown error'}`);
                    return;
                }
                const result = await res.json();
                savedVehicle = result.vehicle || { ...basePayload, id: vehicle.id };
                toast.success('Customer details and documents saved!');
            } else {
                // No docs — use JSON PUT
                const res = await fetch(`/api/vehicles/${vehicle.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(basePayload)
                });
                if (!res.ok) {
                    const err = await res.json();
                    toast.error(`Save failed: ${err.message || 'Unknown error'}`);
                    return;
                }
                const result = await res.json();
                savedVehicle = result.vehicle || { ...basePayload, id: vehicle.id };
                toast.success('Customer details saved!');
            }

            setCustomDocs([]);
            // Pass savedVehicle to parent for Redux update (API call already done, no need to refetch)
            onSave(savedVehicle, true); // second arg `true` = skip backend re-call
            onClose(); // Close modal → returns user to the car list
        } catch (err) {
            console.error('Save error:', err);
            toast.error('Save failed. Please try again.');
        } finally {
            setIsSaving(false);
        }
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
                            <Input name="buyer_name" value={formData.buyer_name || ''} onChange={handleChange} placeholder="Enter Customer Name" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Customer Phone*</label>
                            <Input name="buyer_phone" value={formData.buyer_phone || ''} onChange={handleChange} placeholder="Enter Customer Phone" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Address Line 1*</label>
                            <Input name="address_line_1" value={formData.address_line_1 || ''} onChange={handleChange} placeholder="Enter Address Line 1" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Address Line 2</label>
                            <Input name="address_line_2" value={formData.address_line_2 || ''} onChange={handleChange} placeholder="Enter Address Line 2" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">City*</label>
                            <Input name="city" value={formData.city || ''} onChange={handleChange} placeholder="Enter City Name" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Pincode*</label>
                            <Input name="pincode" value={formData.pincode || ''} onChange={handleChange} placeholder="Enter Pincode" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Email*</label>
                            <Input name="buyer_email" value={formData.buyer_email || ''} onChange={handleChange} placeholder="Enter Email" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Date of Birth*</label>
                            <Input type="date" name="buyer_dob" value={formData.buyer_dob || ''} onChange={handleChange} className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Delivery Date*</label>
                            <Input type="date" name="delivery_date" value={formData.delivery_date || ''} onChange={handleChange} className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-slate-500">Booking Date*</label>
                            <Input type="date" name="booking_date" value={formData.booking_date || ''} onChange={handleChange} className="bg-slate-50" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold uppercase text-slate-500">Delivery Status</label>
                            <select
                                name="status"
                                value={formData.status || 'Available'}
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

                    {/* Document Name + File Input Row */}
                    <div className="flex gap-2 items-center">
                        <Input
                            placeholder="Document name (e.g. PAN Card)"
                            value={newDocName}
                            onChange={(e) => setNewDocName(e.target.value)}
                            className="bg-slate-50 flex-1"
                        />
                        <label className="cursor-pointer flex items-center gap-1 px-3 py-2 rounded-md bg-slate-100 border border-slate-200 text-sm text-slate-600 hover:bg-slate-200 transition-colors whitespace-nowrap">
                            <Plus size={14} />
                            {newDocFile ? newDocFile.name.slice(0, 15) + (newDocFile.name.length > 15 ? '…' : '') : 'Choose File'}
                            <input type="file" className="hidden" onChange={(e) => setNewDocFile(e.target.files[0] || null)} />
                        </label>
                        <Button
                            type="button"
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shadow-none whitespace-nowrap"
                            onClick={handleAddCustomDoc}
                        >
                            Add
                        </Button>
                    </div>

                    {/* List of pending docs to upload */}
                    {customDocs.length > 0 && (
                        <div className="space-y-1">
                            {customDocs.map((doc, i) => (
                                <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-md px-3 py-2 text-sm">
                                    <span className="font-medium text-blue-700">{doc.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">{doc.file?.name}</span>
                                        <button type="button" onClick={() => handleRemoveDoc(i)} className="text-red-400 hover:text-red-600">
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Save Customer Details Button */}
                    <Button
                        type="button"
                        className="w-full"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Customer Details'}
                    </Button>
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
                                                value={pricing[item.key] ?? ''}
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
                                                value={pricing[item.key] ?? ''}
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
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save All'}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
