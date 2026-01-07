import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addInquiry } from '../../store/slices/inquirySlice';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Save, X, ArrowLeft } from 'lucide-react';

export default function AddInquiry() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        customer: '',
        email: '',
        customerPhone: '',
        vehicle: '',
        carType: '',
        contactMethod: '',
        notes: '',
        source: ''
    });

    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!formData.customer) newErrors.customer = "Customer Name is required";
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }
        if (!formData.customerPhone) {
            newErrors.customerPhone = "Phone is required";
        } else if (formData.customerPhone.length < 10) {
            newErrors.customerPhone = "Phone must be at least 10 digits";
        }
        if (!formData.vehicle) newErrors.vehicle = "Vehicle of interest is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        dispatch(addInquiry(formData));
        navigate('/inquiries');
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight">Add New Inquiry</h2>
                    <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}</div>
                </div>
            </div>

            <Card className="border-none shadow-md">
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Customer Information */}
                        <section>
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full"></span>
                                CUSTOMER INFORMATION
                            </h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CUSTOMER NAME*</label>
                                    <Input
                                        name="customer"
                                        placeholder="Enter Customer Name"
                                        value={formData.customer}
                                        onChange={handleChange}
                                        className={errors.customer ? "border-red-500" : ""}
                                    />
                                    {errors.customer && <p className="text-xs text-red-500">{errors.customer}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CUSTOMER EMAIL ADDRESS*</label>
                                    <Input
                                        name="email"
                                        type="email"
                                        placeholder="Enter Customer Email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={errors.email ? "border-red-500" : ""}
                                    />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">CUSTOMER PHONE*</label>
                                    <Input
                                        name="customerPhone"
                                        placeholder="Enter Customer Phone"
                                        value={formData.customerPhone}
                                        onChange={handleChange}
                                        className={errors.customerPhone ? "border-red-500" : ""}
                                    />
                                    {errors.customerPhone && <p className="text-xs text-red-500">{errors.customerPhone}</p>}
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-slate-100"></div>

                        {/* Inquiry Details */}
                        <section>
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full"></span>
                                INQUIRY DETAILS
                            </h3>
                            <div className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">VEHICLE OF INTEREST*</label>
                                        <Input
                                            name="vehicle"
                                            placeholder="Enter Vehicle of Interest"
                                            value={formData.vehicle}
                                            onChange={handleChange}
                                            className={errors.vehicle ? "border-red-500" : ""}
                                        />
                                        {errors.vehicle && <p className="text-xs text-red-500">{errors.vehicle}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">CAR TYPE*</label>
                                        <select
                                            name="carType"
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={formData.carType}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select Car Type</option>
                                            <option value="NEW">New</option>
                                            <option value="OLD">Old</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">PREFERRED CONTACT METHOD*</label>
                                        <select
                                            name="contactMethod"
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={formData.contactMethod}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select Preferred Contact Method</option>
                                            <option value="Email">Email</option>
                                            <option value="Phone">Phone</option>
                                            <option value="Sms">SMS</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">ADDITIONAL NOTES</label>
                                    <textarea
                                        name="notes"
                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Enter Additional Notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-slate-100"></div>

                        {/* Additional Details */}
                        <section>
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <span className="h-6 w-1 bg-primary rounded-full"></span>
                                ADDITIONAL DETAILS
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">INQUIRY SOURCE</label>
                                    <select
                                        name="source"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.source}
                                        onChange={handleChange}
                                    >
                                        <option value="" disabled>Select Inquiry Source</option>
                                        <option value="Website">Website</option>
                                        <option value="Walk-in">Walk-in</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Social Media">Social Media</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-6 mt-8 border-t border-slate-100">
                            <Button type="button" variant="ghost" onClick={() => navigate('/inquiries')}>
                                CANCEL
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] shadow-sm">
                                Record Inquiry
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
