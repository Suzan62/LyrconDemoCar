import React, { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Edit, Trash, PlusCircle, Car, DollarSign, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import AddCar from './AddCar';

import { useSelector, useDispatch } from 'react-redux';
import { deleteVehicle, setVehicles } from '../store/slices/inventorySlice';

export default function Inventory() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const inventory = useSelector(state => state.inventory.items);

    const [activeTab, setActiveTab] = useState('New'); // 'New', 'Purchase', 'Sale'
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Fetch Inventory on Mount
    React.useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await fetch('/api/vehicles');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        dispatch(setVehicles(data));
                    } else if (data && data.vehicles) {
                        dispatch(setVehicles(data.vehicles));
                    } else {
                        dispatch(setVehicles([]));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch inventory", error);
                toast.error("Failed to load inventory");
            }
        };
        fetchInventory();
    }, [dispatch]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState(null);

    const filteredInventory = (inventory || []).filter(car => {
        // Tab Filter
        if (activeTab === 'New' && car.transaction_type !== 'New') return false;
        if (activeTab === 'Purchase' && car.transaction_type !== 'Purchase') return false;
        if (activeTab === 'Sale' && car.transaction_type !== 'Sale') return false;

        const make = car.manufacturer || car.make || '';
        const model = car.model || '';
        const idStr = String(car.id || '');

        const matchesSearch = make.toLowerCase().includes(searchTerm.toLowerCase()) ||
            model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            idStr.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'All' || car.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const triggerDelete = (id) => {
        setVehicleToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!vehicleToDelete) return;
        try {
            const response = await fetch(`/api/vehicles/${vehicleToDelete}`, { method: 'DELETE' });
            if (response.ok) {
                dispatch(deleteVehicle(vehicleToDelete));
                setIsDeleteModalOpen(false);
                setVehicleToDelete(null);
                toast.success("Vehicle deleted successfully");
            } else {
                toast.error("Failed to delete from server.");
            }
        } catch (error) {
            toast.error("Error deleting vehicle.");
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setIsFormOpen(false); // Close form when switching tabs
        setSearchTerm('');
    };

    return (
        <div className="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Inventory Management</h2>
                    <p className="text-slate-500 text-sm sm:text-base">Manage your fleet, purchases, and sales.</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-slate-100 p-1.5 rounded-xl">
                <button
                    onClick={() => handleTabChange('New')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${activeTab === 'New' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">New Cars</span>
                    <span className="sm:hidden">New</span>
                </button>
                <button
                    onClick={() => handleTabChange('Purchase')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${activeTab === 'Purchase' ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Purchased Cars</span>
                    <span className="sm:hidden">Purchased</span>
                </button>
                <button
                    onClick={() => handleTabChange('Sale')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${activeTab === 'Sale' ? 'bg-white text-green-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Sold Cars</span>
                    <span className="sm:hidden">Sold</span>
                </button>
            </div>

            {/* Collapsible Form Section Removed as per request */}

            {/* Main Content Area */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search make, model, VIN..."
                                    className="pl-10 h-10 w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button
                                variant={showFilters ? "secondary" : "outline"}
                                onClick={() => setShowFilters(!showFilters)}
                                className="gap-2 h-10"
                            >
                                <Filter size={16} /> Filters
                            </Button>
                        </div>

                        {showFilters && (
                            <div className="p-4 bg-slate-50 border rounded-lg animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Vehicle Status</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['All', 'Available', 'Sold', 'Reserved'].map(status => (
                                            <Button
                                                key={status}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setFilterStatus(status)}
                                                className={filterStatus === status ? 'bg-slate-800 text-white border-slate-800' : 'bg-white hover:bg-slate-50'}
                                            >
                                                {status}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    {/* Desktop Table View */}
                    <div className="hidden md:block rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
                                    <TableHead>Vehicle ID</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Year</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInventory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Car className="w-8 h-8 text-slate-300" />
                                                <p>No vehicles found in {activeTab} section.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredInventory.map((car) => (
                                        <TableRow key={car.id} className="group">
                                            <TableCell className="font-mono text-xs text-slate-500">{car.id}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{car.manufacturer || car.make} {car.model}</span>
                                                    <span className="text-xs text-slate-500">{car.mileage ? `${car.mileage} km` : '0 km'} • {car.fuel_type || 'Petrol'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{car.year}</TableCell>
                                            <TableCell className="font-medium">${(car.price || 0).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    car.status === 'Available' ? 'default' :
                                                        car.status === 'Sold' ? 'secondary' : 'outline'
                                                } className={car.status === 'Available' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}>
                                                    {car.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/vehicle/${car.id}`)}>
                                                        <Eye size={16} className="text-slate-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/inventory/${car.id}/edit`)}>
                                                        <Edit size={16} className="text-blue-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50" onClick={() => triggerDelete(car.id)}>
                                                        <Trash size={16} className="text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card Grid View */}
                    <div className="md:hidden grid grid-cols-1 gap-4 p-4">
                        {filteredInventory.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p>No vehicles found.</p>
                            </div>
                        ) : (
                            filteredInventory.map((car) => (
                                <div key={car.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-transform">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{car.manufacturer || car.make} {car.model}</h3>
                                            <p className="text-sm text-slate-500">{car.year} • {car.fuel_type}</p>
                                        </div>
                                        <Badge variant={car.status === 'Available' ? 'default' : 'secondary'}>
                                            {car.status}
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-end border-t border-slate-100 pt-3 mt-1">
                                        <div>
                                            <p className="text-xs text-slate-400">Price</p>
                                            <p className="font-bold text-xl text-blue-600">${(car.price || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => navigate(`/vehicle/${car.id}`)}>View</Button>
                                            <Button size="sm" variant="ghost" className="text-red-500 h-9 w-9 p-0" onClick={() => triggerDelete(car.id)}>
                                                <Trash size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Deletion"
            >
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <Trash className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900">Delete this vehicle?</h4>
                        <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={confirmDelete}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete
                    </Button>
                </ModalFooter>
            </Modal>
        </div >
    );
}
