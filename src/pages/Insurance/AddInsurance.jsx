import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function AddInsurance() {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        bank_name: "",
        branch: "",
        customer_name: "",
        customer_phone: "",
        address: "",
        total_amount: "",
        premium_amount: "",
        insurance_company: "",
        expiry_date: "",
        vehicle_id: ""
    });

    // Selected Vehicle Data (for display only)
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    useEffect(() => {
        // Fetch vehicles for dropdown
        const fetchVehicles = async () => {
            try {
                const res = await fetch('/api/vehicles');
                if (res.ok) {
                    const data = await res.json();
                    setVehicles(data);
                }
            } catch (err) {
                console.error("Failed to load vehicles");
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, []);

    // Handle Vehicle Selection
    const handleVehicleChange = (e) => {
        const vId = e.target.value;
        const vehicle = vehicles.find(v => v.id.toString() === vId);

        setFormData({ ...formData, vehicle_id: vId });
        setSelectedVehicle(vehicle || null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);

        // Basic Validation
        if (!formData.customer_name || !formData.customer_phone) {
            toast.error("Customer Name and Phone are required");
            setSubmitLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/insurances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success("Insurance record created successfully");
                navigate('/insurances');
            } else {
                const err = await res.json();
                toast.error(err.message || "Failed to create record");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">Create Insurance Record</h2>
                    <p className="text-muted-foreground">Add a new insurance policy for a customer.</p>
                </div>
            </div>

            <Card className="border-none shadow-md">
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Basic Info */}
                        <section>
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full"></span>
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Insurance Bank</label>
                                    <input name="bank_name" value={formData.bank_name} onChange={handleChange} className="w-full h-10 px-3 rounded-md border text-sm" placeholder="Bank Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Branch</label>
                                    <input name="branch" value={formData.branch} onChange={handleChange} className="w-full h-10 px-3 rounded-md border text-sm" placeholder="Branch Name" />
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-slate-100"></div>

                        {/* Customer Details */}
                        <section>
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full"></span>
                                Customer Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Customer Name *</label>
                                    <input required name="customer_name" value={formData.customer_name} onChange={handleChange} className="w-full h-10 px-3 rounded-md border text-sm" placeholder="Full Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone Number *</label>
                                    <input required name="customer_phone" value={formData.customer_phone} onChange={handleChange} className="w-full h-10 px-3 rounded-md border text-sm" placeholder="Contact Number" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Address</label>
                                    <input name="address" value={formData.address} onChange={handleChange} className="w-full h-10 px-3 rounded-md border text-sm" placeholder="Full Address" />
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-slate-100"></div>

                        {/* Insurance Details & Car Selection */}
                        <section>
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full"></span>
                                Policy Details
                            </h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Total Amount</label>
                                        <input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} className="w-full h-10 px-3 rounded-md border text-sm" placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Select Car</label>
                                        <select
                                            name="vehicle_id"
                                            value={formData.vehicle_id}
                                            onChange={handleVehicleChange}
                                            className="w-full h-10 px-3 rounded-md border text-sm bg-white"
                                        >
                                            <option value="">-- Select a Vehicle --</option>
                                            {vehicles.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.manufacturer} {v.model} ({v.year}) - {v.registration_number || v.chassis_number}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Insurance Company Name</label>
                                        <input name="insurance_company" value={formData.insurance_company} onChange={handleChange} className="w-full h-10 px-3 rounded-md border text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Premium Amount</label>
                                        <input type="number" name="premium_amount" value={formData.premium_amount} onChange={handleChange} className="w-full h-10 px-3 rounded-md border text-sm" placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Expiry Date</label>
                                        <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} className="w-full h-10 px-3 rounded-md border text-sm" />
                                    </div>
                                </div>

                                {/* Read-Only Vehicle Information (Auto-filled) */}
                                {selectedVehicle && (
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mt-4">
                                        <h4 className="font-semibold mb-4 text-slate-700">Vehicle Information (Preview)</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="font-semibold text-xs text-muted-foreground uppercase">Manufacturer</p>
                                                <p>{selectedVehicle.manufacturer || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-xs text-muted-foreground uppercase">Model</p>
                                                <p>{selectedVehicle.model || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-xs text-muted-foreground uppercase">Color</p>
                                                <p>{selectedVehicle.color || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-xs text-muted-foreground uppercase">Year</p>
                                                <p>{selectedVehicle.year || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-xs text-muted-foreground uppercase">Fuel Type</p>
                                                <p>{selectedVehicle.fuel_type || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-xs text-muted-foreground uppercase">Registration No</p>
                                                <p>{selectedVehicle.registration_number || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-xs text-muted-foreground uppercase">Chassis No</p>
                                                <p className="truncate" title={selectedVehicle.chassis_number}>{selectedVehicle.chassis_number || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-xs text-muted-foreground uppercase">Engine No</p>
                                                <p className="truncate" title={selectedVehicle.engine_number}>{selectedVehicle.engine_number || "-"}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-100">
                            <Button type="button" variant="ghost" onClick={() => navigate('/insurances')}>Cancel</Button>
                            <Button type="submit" disabled={submitLoading} className="w-32">
                                {submitLoading ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
