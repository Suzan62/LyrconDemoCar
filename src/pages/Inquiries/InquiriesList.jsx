import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Edit, Trash, PlusCircle, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import { useSelector, useDispatch } from 'react-redux';
import { deleteInquiry, selectInquiries, selectInquiryStats, fetchInquiries } from '../../store/slices/inquirySlice';

export default function InquiriesList() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const inquiries = useSelector(selectInquiries);
    const stats = useSelector(selectInquiryStats);

    React.useEffect(() => {
        dispatch(fetchInquiries());
    }, [dispatch]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCarType, setFilterCarType] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [inquiryToDelete, setInquiryToDelete] = useState(null);

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [inquiryToToggle, setInquiryToToggle] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    const filteredInquiries = inquiries.filter(item => {
        const matchesSearch =
            (item.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.vehicle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(item.id).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
        const matchesType = filterCarType === 'All' || item.carType === filterCarType;
        return matchesSearch && matchesStatus && matchesType;
    });

    // Pagination
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredInquiries.slice(indexOfFirstEntry, indexOfLastEntry);

    const triggerDelete = (id) => {
        setInquiryToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (inquiryToDelete) {
            dispatch(deleteInquiry(inquiryToDelete));
            setIsDeleteModalOpen(false);
            setInquiryToDelete(null);
        }
    };

    const triggerStatusToggle = (inquiry) => {
        setInquiryToToggle(inquiry);
        setIsStatusModalOpen(true);
    };

    const confirmStatusToggle = async () => {
        if (inquiryToToggle) {
            const newStatus = inquiryToToggle.status === 'pending' ? 'completed' : 'pending';
            try {
                const res = await fetch(`/api/inquiries/${inquiryToToggle.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                if (res.ok) {
                    dispatch(fetchInquiries()); // Refresh the list
                    setIsStatusModalOpen(false);
                    setInquiryToToggle(null);
                }
            } catch (error) {
                console.error('Error updating inquiry status:', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inquiries</h2>
                    <p className="text-muted-foreground">Manage customer interest and follow-ups.</p>
                </div>
                <Button onClick={() => navigate('/inquiries/create')} className="gap-2 hidden lg:flex">
                    <PlusCircle size={18} /> New Inquiry
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Lifetime inquiries</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completed}</div>
                        <p className="text-xs text-muted-foreground text-green-600">Successfully closed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground text-amber-600">Requires follow-up</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search customer, vehicle..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button
                                variant={showFilters ? "secondary" : "outline"}
                                onClick={() => setShowFilters(!showFilters)}
                                className="gap-2"
                            >
                                <Filter size={16} /> Filters
                            </Button>
                        </div>
                        {showFilters && (
                            <div className="p-4 bg-slate-50 border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Car Type</label>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button variant="outline" size="sm" onClick={() => setFilterCarType('All')} className={filterCarType === 'All' ? 'bg-slate-200 border-slate-300' : ''}>All</Button>
                                        <Button variant="outline" size="sm" onClick={() => setFilterCarType('NEW')} className={filterCarType === 'NEW' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}>New</Button>
                                        <Button variant="outline" size="sm" onClick={() => setFilterCarType('OLD')} className={filterCarType === 'OLD' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}>Old</Button>
                                    </div>
                                </div>
                                <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Status</label>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button variant="outline" size="sm" onClick={() => setFilterStatus('All')} className={filterStatus === 'All' ? 'bg-slate-200 border-slate-300' : ''}>All</Button>
                                        <Button variant="outline" size="sm" onClick={() => setFilterStatus('Pending')} className={filterStatus === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}>Pending</Button>
                                        <Button variant="outline" size="sm" onClick={() => setFilterStatus('Completed')} className={filterStatus === 'Completed' ? 'bg-green-100 text-green-800' : ''}>Completed</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Actions</TableHead>
                                    <TableHead>Inquiry ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Customer Phone</TableHead>
                                    <TableHead>Followed Up Date</TableHead>
                                    <TableHead>Vehicle</TableHead>
                                    <TableHead>Car Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentEntries.length > 0 ? (
                                    currentEntries.map((item) => (
                                        <TableRow key={`inquiry-${item.id}`}>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={item.status === 'completed' ? "h-8 w-8 text-red-600" : "h-8 w-8 text-orange-600"}
                                                        title={item.status === 'pending' ? "Complete Inquiry" : "Change to Pending"}
                                                        onClick={() => triggerStatusToggle(item)}
                                                    >
                                                        {item.status === 'pending' ? <Check size={14} /> : <X size={14} />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600"
                                                        title="View Details"
                                                        onClick={() => navigate(`/inquiries/${item.id}`)}
                                                    >
                                                        <Eye size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600"
                                                        title="Edit"
                                                        onClick={() => navigate('/inquiries/create', { state: { inquiry: item } })}
                                                    >
                                                        <Edit size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500"
                                                        title="Delete"
                                                        onClick={() => triggerDelete(item.id)}
                                                    >
                                                        <Trash size={14} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{item.id}</TableCell>
                                            <TableCell>{item.customer}</TableCell>
                                            <TableCell>{item.customerPhone}</TableCell>
                                            <TableCell>-</TableCell>
                                            <TableCell>{item.vehicle}</TableCell>
                                            <TableCell>{item.carType}</TableCell>
                                            <TableCell>{item.date}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.status === 'completed' || item.status === 'Completed' ? 'default' : 'secondary'} className={item.status === 'pending' || item.status === 'Pending' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                            No inquiries found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

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
                                    disabled={currentPage * entriesPerPage >= filteredInquiries.length}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
                <div className="p-4">
                    <p className="text-center mb-4">Are you sure you want to delete this inquiry?</p>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </ModalFooter>
                </div>
            </Modal>

            {/* Status Toggle Confirmation Modal */}
            <Modal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                title={inquiryToToggle?.status === 'pending' ? "COMPLETE THIS INQUIRY?" : "CHANGE TO PENDING?"}
            >
                <div className="p-6">
                    <div className="flex justify-center mb-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${inquiryToToggle?.status === 'pending' ? 'bg-green-100' : 'bg-yellow-100'
                            }`}>
                            <Check className={`w-8 h-8 ${inquiryToToggle?.status === 'pending' ? 'text-green-600' : 'text-yellow-600'
                                }`} />
                        </div>
                    </div>
                    <div className="flex justify-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsStatusModalOpen(false)}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmStatusToggle}
                            className={`px-6 ${inquiryToToggle?.status === 'pending'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-yellow-600 hover:bg-yellow-700'
                                }`}
                        >
                            Proceed
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Mobile Floating Action Button */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50 shadow-xl">
                <Button
                    onClick={() => navigate('/inquiries/create')}
                    className="rounded-full h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2"
                >
                    <PlusCircle className="h-5 w-5" /> New Inquiry
                </Button>
            </div>
        </div>
    );
}
