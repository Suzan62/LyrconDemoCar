import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Trash2, Edit, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '../../components/ui/Badge';

export default function InsuranceList() {
    const [insurances, setInsurances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchInsurances();
    }, []);

    const fetchInsurances = async () => {
        try {
            const res = await fetch('http://127.0.0.1:5000/api/insurances');
            if (res.ok) {
                const data = await res.json();
                setInsurances(data);
            } else {
                toast.error("Failed to fetch insurances");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/insurances/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Record deleted");
                setInsurances(insurances.filter(i => i.id !== id));
            } else {
                toast.error("Failed to delete");
            }
        } catch (err) {
            toast.error("Network error");
        }
    };

    const filteredInsurances = insurances.filter(item =>
        item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDaysRemaining = (expiryDate) => {
        if (!expiryDate) return null;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getExpiryBadge = (expiryDate) => {
        const days = getDaysRemaining(expiryDate);
        if (days === null) return <Badge variant="secondary">N/A</Badge>;

        if (days < 0) {
            return <Badge variant="destructive">Expired</Badge>;
        } else if (days <= 30) {
            return <Badge className="bg-yellow-500 hover:bg-yellow-600">Expiring Soon</Badge>;
        } else {
            return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Insurance Records</h2>
                    <p className="text-muted-foreground">Manage customer vehicle insurance details.</p>
                </div>
                <Link to="/insurances/add">
                    <Button><Plus className="mr-2 h-4 w-4" /> Add Insurance</Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <CardTitle>All Insurances</CardTitle>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="text-left border-b">
                                    <th className="p-4 font-medium">Actions</th>
                                    <th className="p-4 font-medium">Bank</th>
                                    <th className="p-4 font-medium">Customer</th>
                                    <th className="p-4 font-medium">Phone</th>
                                    <th className="p-4 font-medium">Car</th>
                                    <th className="p-4 font-medium">Reg No</th>
                                    <th className="p-4 font-medium">Insurer</th>
                                    <th className="p-4 font-medium">Premium</th>
                                    <th className="p-4 font-medium">Expiry</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInsurances.length > 0 ? (
                                    filteredInsurances.map((item) => (
                                        <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="p-4 flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </td>
                                            <td className="p-4">{item.bank_name || "-"}</td>
                                            <td className="p-4 font-medium">{item.customer_name}</td>
                                            <td className="p-4">{item.customer_phone}</td>
                                            <td className="p-4">{item.vehicle ? `${item.vehicle.manufacturer} ${item.vehicle.model} (${item.vehicle.year})` : "-"}</td>
                                            <td className="p-4">{item.vehicle?.registration_number || "-"}</td>
                                            <td className="p-4">{item.insurance_company || "-"}</td>
                                            <td className="p-4 text-green-600 font-medium">${item.premium_amount?.toLocaleString()}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span>{item.expiry_date || "N/A"}</span>
                                                    {getExpiryBadge(item.expiry_date)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="p-8 text-center text-muted-foreground">
                                            No records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
