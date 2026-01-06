import React, { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Eye, Edit, Trash, PlusCircle, MoreVertical } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';

import { useSelector, useDispatch } from 'react-redux';
import { deleteVehicle, setVehicles } from '../store/slices/inventorySlice';

export default function Inventory() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const inventory = useSelector(state => state.inventory.items);

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
                        // Fallback for wrapped responses
                        dispatch(setVehicles(data.vehicles));
                    } else {
                        console.error("Invalid vehicle data format:", data);
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
    const [filterType, setFilterType] = useState('All');
    const [showFilters, setShowFilters] = useState(false); // Toggle for filter section

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState(null);

    const filteredInventory = (inventory || []).filter(car => {
        const make = car.manufacturer || car.make || '';
        const model = car.model || '';
        const idStr = String(car.id || '');

        const matchesSearch = make.toLowerCase().includes(searchTerm.toLowerCase()) ||
            model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            idStr.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'All' || car.status === filterStatus;
        const matchesType = filterType === 'All' || car.transaction_type === filterType;
        return matchesSearch && matchesStatus && matchesType;
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
                toast.error("Failed to delete vehicle from server.");
            }
        } catch (error) {
            console.error("Delete failed", error);
            toast.error("Error deleting vehicle.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
                    <p className="text-muted-foreground">Manage your vehicle fleet and status.</p>
                </div>
                <Button onClick={() => navigate('/add-car')} className="gap-2">
                    <PlusCircle size={18} /> Add New Car
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search make, model, VIN..."
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

                        {/* Collapsible Filter Section */}
                        {showFilters && (
                            <div className="p-4 bg-slate-50 border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Transaction Type</label>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button variant="outline" size="sm" onClick={() => setFilterType('All')} className={filterType === 'All' ? 'bg-slate-200 border-slate-300' : ''}>All</Button>
                                        <Button variant="outline" size="sm" onClick={() => setFilterType('New')} className={filterType === 'New' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}>New</Button>
                                        <Button variant="outline" size="sm" onClick={() => setFilterType('Purchase')} className={filterType === 'Purchase' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}>Purchase</Button>
                                        <Button variant="outline" size="sm" onClick={() => setFilterType('Sale')} className={filterType === 'Sale' ? 'bg-green-100 text-green-700 border-green-200' : ''}>Sale</Button>
                                    </div>
                                </div>
                                <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Vehicle Status</label>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button variant="outline" size="sm" onClick={() => setFilterStatus('All')} className={filterStatus === 'All' ? 'bg-slate-200 border-slate-300' : ''}>All</Button>
                                        <Button variant="outline" size="sm" onClick={() => setFilterStatus('Available')} className={filterStatus === 'Available' ? 'bg-green-100 text-green-800 border-green-200' : ''}>Available</Button>
                                        <Button variant="outline" size="sm" onClick={() => setFilterStatus('Sold')} className={filterStatus === 'Sold' ? 'bg-slate-100 text-slate-800' : ''}>Sold</Button>
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
                                    <TableHead>Vehicle ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Make & Model</TableHead>
                                    <TableHead>Year</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInventory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            No vehicles found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredInventory.map((car) => (
                                        <TableRow key={car.id}>
                                            <TableCell className="font-medium whitespace-nowrap">{car.id}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    car.transaction_type === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        car.transaction_type === 'Purchase' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            car.transaction_type === 'Sale' ? 'bg-green-50 text-green-700 border-green-200' : ''
                                                }>
                                                    {car.transaction_type || 'New'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium whitespace-nowrap">{car.manufacturer || car.make} {car.model}</span>
                                                    <span className="text-xs text-muted-foreground">{car.mileage ? `${car.mileage} miles` : '0 miles'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{car.year}</TableCell>
                                            <TableCell>${(car.price || 0).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    car.status === 'Available' ? 'default' :
                                                        car.status === 'Sold' ? 'secondary' : 'outline'
                                                }>
                                                    {car.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/vehicle/${car.id}`)}>
                                                        <Eye size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/inventory/${car.id}/edit`)}>
                                                        <Edit size={16} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => triggerDelete(car.id)}>
                                                        <Trash size={16} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
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
                        <p className="text-sm text-gray-500 mt-1">This action cannot be undone. This will permanently remove the vehicle from your inventory.</p>
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
                        Delete Vehicle
                    </Button>
                </ModalFooter>
            </Modal>
        </div >
    );
}
