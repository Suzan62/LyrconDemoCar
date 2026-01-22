import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Trash2, Edit, Search, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '../../components/ui/Badge';

export default function InsuranceList() {
    const navigate = useNavigate();
    const [insurances, setInsurances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedInsurance, setSelectedInsurance] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

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
        item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.insurance_company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredInsurances.slice(indexOfFirstEntry, indexOfLastEntry);

    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return null;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return <Badge variant="destructive">Expired</Badge>;
        } else if (diffDays <= 30) {
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
                <Link to="/insurances/add" className="hidden lg:block">
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
                                {currentEntries.length > 0 ? (
                                    currentEntries.map((item) => (
                                        <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="p-4 flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600"
                                                    title="View Details"
                                                    onClick={() => {
                                                        setSelectedInsurance(item);
                                                        setIsDetailModalOpen(true);
                                                    }}
                                                >
                                                    <Eye size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-green-600"
                                                    title="Edit"
                                                    onClick={() => navigate(`/insurances/edit/${item.id}`)}
                                                >
                                                    <Edit size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500"
                                                    title="Delete"
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
                                                    {getExpiryStatus(item.expiry_date)}
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

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-600">Show</span>
                            <select
                                value={entriesPerPage}
                                onChange={(e) => {
                                    setEntriesPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border rounded px-2 py-1 text-sm"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-slate-600">entries</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                Previous
                            </Button>
                            <Button variant="outline" size="sm" className="bg-slate-100">{currentPage}</Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage * entriesPerPage >= filteredInsurances.length}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Floating Action Button */}
            <Link to="/insurances/add" className="lg:hidden fixed bottom-6 right-6 z-50 shadow-xl">
                <Button className="rounded-full h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2">
                    <Plus className="h-5 w-5" /> Add Insurance
                </Button>
            </Link>

            {/* Insurance Detail Modal */}
            {isDetailModalOpen && selectedInsurance && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsDetailModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Insurance Details - Insurance #{selectedInsurance.id}</h2>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Bank Name</label>
                                    <p className="text-slate-900 font-semibold">{selectedInsurance.bank_name || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Branch</label>
                                    <p className="text-slate-900">{selectedInsurance.branch || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Customer Name</label>
                                    <p className="text-slate-900 font-semibold">{selectedInsurance.customer_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Insurance Company</label>
                                    <p className="text-slate-900">{selectedInsurance.insurance_company || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Premium Amount</label>
                                    <p className="text-green-600 font-bold">${selectedInsurance.premium_amount?.toLocaleString() || '0'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Expiry Date</label>
                                    <p className="text-slate-900">{selectedInsurance.expiry_date || 'N/A'}</p>
                                </div>
                                {selectedInsurance.vehicle && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium text-slate-600">Vehicle</label>
                                            <p className="text-slate-900">{selectedInsurance.vehicle.manufacturer} {selectedInsurance.vehicle.model} ({selectedInsurance.vehicle.year})</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-slate-600">Registration Number</label>
                                            <p className="text-slate-900 font-mono">{selectedInsurance.vehicle.registration_number || '-'}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Manage Documents Section */}
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Manage Documents</h3>

                                {/* Document Upload Sections */}
                                <div className="space-y-4">
                                    {/* Old Policy */}
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">OLD POLICY</label>
                                        <div className="flex gap-2">
                                            <input type="file" className="flex-1 text-sm" />
                                            <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm">DOWNLOAD</Button>
                                        </div>
                                    </div>

                                    {/* New Policy */}
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">NEW POLICY</label>
                                        <div className="flex gap-2">
                                            <input type="file" className="flex-1 text-sm" />
                                            <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm">DOWNLOAD</Button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">Add Document</Button>
                                        <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">Save Documents</Button>
                                    </div>
                                </div>
                            </div>

                            {/* Close Button */}
                            <div className="border-t border-slate-200 pt-4">
                                <Button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
