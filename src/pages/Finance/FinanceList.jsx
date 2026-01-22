import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchFinances, deleteFinance, selectFinances, selectFinanceStats } from '../../store/slices/financeSlice';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import { PlusCircle, Eye, Edit, Trash, Search, Filter, FileText } from 'lucide-react';

export default function FinanceList() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const allFinances = useSelector(selectFinances); // Renamed to avoid conflict with local state
    const stats = useSelector(selectFinanceStats);
    const reduxLoading = useSelector(state => state.finance.loading); // Renamed to avoid conflict

    const [finances, setFinances] = useState([]); // Local state for finances
    const [loading, setLoading] = useState(true); // Local state for loading
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [financeToDelete, setFinanceToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await dispatch(fetchFinances());
            setLoading(false);
        };
        fetchData();
    }, [dispatch]);

    useEffect(() => {
        setFinances(allFinances); // Update local finances when Redux state changes
    }, [allFinances]);

    const filteredFinances = finances.filter(item =>
        item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bank_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.account_number?.includes(searchTerm) ||
        item.car?.toLowerCase().includes(searchTerm.toLowerCase()) // Added car filter
    );

    // Pagination
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredFinances.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredFinances.length / entriesPerPage);

    const handleDeleteClick = (id) => {
        setFinanceToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (financeToDelete) {
            await dispatch(deleteFinance(financeToDelete));
            setIsDeleteModalOpen(false);
            setFinanceToDelete(null);
            // Re-fetch or update local state after deletion
            dispatch(fetchFinances());
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Finance Records</h2>
                    <p className="text-muted-foreground">Manage loans and finance details.</p>
                </div>
                <div className="flex gap-2">

                    <Button onClick={() => navigate('/finance/create')} className="gap-2 hidden lg:flex">
                        <PlusCircle size={18} /> Add Finance
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Finance Records</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by customer, bank, or account..."
                                className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                    <TableHead>Bank Name</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Account No</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">Loading records...</TableCell>
                                    </TableRow>
                                ) : filteredFinances.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No finance records found.</TableCell>
                                    </TableRow>
                                ) : (
                                    currentEntries.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600"
                                                        title="Edit"
                                                        onClick={() => navigate(`/finance/edit/${item.id}`)}
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500"
                                                        title="Delete"
                                                        onClick={() => handleDeleteClick(item.id)}
                                                    >
                                                        <Trash size={16} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{item.bank_name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{item.customer_name}</span>
                                                    <span className="text-xs text-muted-foreground">{item.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{item.account_number}</TableCell>
                                            <TableCell>{item.contact_number}</TableCell>
                                            <TableCell>{item.starting_date}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{parseFloat(item.amount).toLocaleString()}</span>
                                                    <span className="text-xs text-muted-foreground">EMI: {parseFloat(item.emi_amount).toLocaleString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.status === 'Completed' ? 'success' : 'default'}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
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
                                disabled={currentPage * entriesPerPage >= filteredFinances.length}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Finance Record"
            >
                <div className="p-4">
                    <p>Are you sure you want to delete this finance record? This action cannot be undone.</p>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                </ModalFooter>
            </Modal>

            {/* Mobile Floating Action Button */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50 shadow-xl">
                <Button
                    onClick={() => navigate('/finance/create')}
                    className="rounded-full h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2"
                >
                    <PlusCircle className="h-5 w-5" /> Add Finance
                </Button>
            </div>
        </div>
    );
}
