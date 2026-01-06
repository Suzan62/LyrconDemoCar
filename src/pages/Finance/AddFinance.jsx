import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addFinance } from '../../store/slices/financeSlice';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Save, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export default function AddFinance() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Vehicle Data for Dropdown
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const [formData, setFormData] = useState({
        bank_name: '',
        bank_branch: '',
        customer_name: '',
        account_number: '',
        address: '',
        contact_number: '',
        email: '',
        starting_date: '',
        ending_date: '',
        amount: '',
        loan_protection: false,
        disbursement_amount: '',
        disbursement_date: '',
        status: 'Received',
        emi_amount: '',
        car_type: 'New Car', // Default
        vehicle_id: ''
    });

    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!formData.bank_name) newErrors.bank_name = "Bank Name is required";
        if (!formData.customer_name) newErrors.customer_name = "Customer Name is required";
        if (!formData.account_number) newErrors.account_number = "Account Number is required";
        if (!formData.amount || formData.amount <= 0) newErrors.amount = "Valid Amount is required";
        if (!formData.emi_amount || formData.emi_amount <= 0) newErrors.emi_amount = "Valid EMI Amount is required";
        if (!formData.starting_date) newErrors.starting_date = "Start Date is required";
        if (!formData.ending_date) newErrors.ending_date = "End Date is required";

        // Simple Email Regex
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid Email Format";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        // Fetch vehicles for dropdown
        fetch('/api/vehicles')
            .then(res => res.json())
            .then(data => setVehicles(data))
            .catch(err => console.error("Failed to fetch vehicles", err));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (name === 'vehicle_id') {
            const v = vehicles.find(veh => veh.id.toString() === value);
            setSelectedVehicle(v || null);
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await dispatch(addFinance(formData)).unwrap();
            navigate('/finance');
        } catch (error) {
            alert(`Failed to save: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/finance')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Create Finance Record</h2>
                        <p className="text-muted-foreground">Add a new loan or finance entry.</p>
                    </div>
                </div>
                <Button className="gap-2" onClick={handleSubmit} disabled={loading}>
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Record'}
                </Button>
            </div>

            <Card className="border-none shadow-md">
                <CardContent className="p-8">
                    <div className="space-y-8">
                        {/* Basic Information */}
                        <section>
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full"></span>
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Bank Name</label>
                                    <input name="bank_name" value={formData.bank_name} onChange={handleChange} className={`w-full p-2 border rounded-md ${errors.bank_name ? 'border-red-500' : ''}`} placeholder="e.g. HDFC Bank" />
                                    {errors.bank_name && <p className="text-xs text-red-500">{errors.bank_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Bank Branch</label>
                                    <input name="bank_branch" value={formData.bank_branch} onChange={handleChange} className="w-full p-2 border rounded-md" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Customer Name</label>
                                    <input name="customer_name" value={formData.customer_name} onChange={handleChange} className={`w-full p-2 border rounded-md ${errors.customer_name ? 'border-red-500' : ''}`} />
                                    {errors.customer_name && <p className="text-xs text-red-500">{errors.customer_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Account Number</label>
                                    <input name="account_number" value={formData.account_number} onChange={handleChange} className={`w-full p-2 border rounded-md ${errors.account_number ? 'border-red-500' : ''}`} />
                                    {errors.account_number && <p className="text-xs text-red-500">{errors.account_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Contact Number</label>
                                    <input name="contact_number" value={formData.contact_number} onChange={handleChange} className="w-full p-2 border rounded-md" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <input name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md" type="email" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Address</label>
                                    <textarea name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded-md h-24" />
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-slate-100"></div>

                        {/* Loan Details */}
                        <section>
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full"></span>
                                Loan Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Starting Date</label>
                                    <input name="starting_date" type="date" value={formData.starting_date} onChange={handleChange} className="w-full p-2 border rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ending Date</label>
                                    <input name="ending_date" type="date" value={formData.ending_date} onChange={handleChange} className="w-full p-2 border rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount</label>
                                    <input name="amount" type="number" value={formData.amount} onChange={handleChange} className={`w-full p-2 border rounded-md ${errors.amount ? 'border-red-500' : ''}`} />
                                    {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">EMI Amount</label>
                                    <input name="emi_amount" type="number" value={formData.emi_amount} onChange={handleChange} className={`w-full p-2 border rounded-md ${errors.emi_amount ? 'border-red-500' : ''}`} />
                                    {errors.emi_amount && <p className="text-xs text-red-500">{errors.emi_amount}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Disbursement Amount</label>
                                    <input name="disbursement_amount" type="number" value={formData.disbursement_amount} onChange={handleChange} className="w-full p-2 border rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Disbursement Date</label>
                                    <input name="disbursement_date" type="date" value={formData.disbursement_date} onChange={handleChange} className="w-full p-2 border rounded-md" />
                                </div>
                                <div className="flex items-center gap-2 mt-8">
                                    <input type="checkbox" name="loan_protection" checked={formData.loan_protection} onChange={handleChange} className="h-4 w-4" />
                                    <label className="text-sm font-medium">Loan Protection</label>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                                        <option>Received</option>
                                        <option>Pending</option>
                                        <option>Rejected</option>
                                        <option>Approved</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-slate-100"></div>

                        {/* Vehicle Selection */}
                        <section>
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full"></span>
                                Vehicle Information
                            </h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Car Type</label>
                                        <select name="car_type" value={formData.car_type} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                                            <option>New Car</option>
                                            <option>Old Car</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Select Vehicle</label>
                                        <select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} className="w-full p-2 border rounded-md bg-white">
                                            <option value="">-- Choose Vehicle --</option>
                                            {vehicles.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.make || v.manufacturer} {v.model} ({v.year}) - {v.registration_number || v.docket_number || 'No Reg'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Read-Only Vehicle Details for Confirmation */}
                                {selectedVehicle && (
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mt-4">
                                        <h4 className="font-semibold mb-4 flex items-center gap-2"><Car size={16} /> Selected Vehicle Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-500 block">Manufacturer</span>
                                                <span className="font-medium">{selectedVehicle.make || selectedVehicle.manufacturer}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Model</span>
                                                <span className="font-medium">{selectedVehicle.model}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Color</span>
                                                <span className="font-medium">{selectedVehicle.color}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Fuel Type</span>
                                                <span className="font-medium">{selectedVehicle.fuel_type}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Chassis Number</span>
                                                <span className="font-medium">{selectedVehicle.chassis_number || selectedVehicle.vin || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Engine Number</span>
                                                <span className="font-medium">{selectedVehicle.engine_number || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
