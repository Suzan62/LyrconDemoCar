import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setVehicles, deleteVehicle, updateVehicle } from '../store/slices/inventorySlice';
import {
    Printer, Eye, Edit, Trash, User, Store,
    MoreHorizontal, Download, Truck, Calendar, ChevronRight, IndianRupee
} from 'lucide-react';
import { cn } from '../lib/utils';

import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { StatsCards } from '../components/inventory/StatsCards';
import { FilterBar } from '../components/inventory/FilterBar';
import { CustomerDetailsModal } from '../components/inventory/CustomerDetailsModal';
import { DealerDetailsModal } from '../components/inventory/DealerDetailsModal';
import { UpdateDeliveryInfoModal } from '../components/inventory/UpdateDeliveryInfoModal';

export default function Inventory() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const inventory = useSelector(state => state.inventory.items);

    const [activeTab, setActiveTab] = useState('New'); // 'New', 'Purchase', 'Sale'
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        status: 'All',
        entries: 10,
        search: ''
    });

    // Modals State
    const [deleteId, setDeleteId] = useState(null);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [dealerModalOpen, setDealerModalOpen] = useState(false);
    const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    // Fetch Data
    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/vehicles');
            if (res.ok) {
                const data = await res.json();
                dispatch(setVehicles(Array.isArray(data) ? data : []));
            }
        } catch (error) {
            console.error("Failed to fetch inventory", error);
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [dispatch]);

    // Derived Stats (Filtered by Tab)
    const stats = {
        total: inventory.filter(v => v.transaction_type === activeTab).length,
        sold: inventory.filter(v => v.transaction_type === activeTab && v.status === 'Sold').length,
        unsold: inventory.filter(v => v.transaction_type === activeTab && v.status !== 'Sold').length
    };

    // Filter Logic
    const filteredItems = inventory.filter(item => {
        // Tab Filter (Transaction Type)
        // Assume 'New' maps to 'New', 'Purchase' maps to 'Purchase', 'Sale' maps to 'Sale'
        if (item.transaction_type !== activeTab) return false;

        // Status Filter
        if (filters.status !== 'All') {
            if (filters.status === 'Pending' && item.status !== 'Pending') return false;
            if (filters.status === 'Delivered' && item.delivery_status !== 'Delivered') return false;
            // Robust check
            if (item.status !== filters.status && !item.delivery_status?.includes(filters.status)) return false;
        }

        // Date Filter (Booking Date)
        if (filters.dateFrom && item.booking_date && new Date(item.booking_date) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && item.booking_date && new Date(item.booking_date) > new Date(filters.dateTo)) return false;

        // Search
        if (filters.search) {
            const term = filters.search.toLowerCase();
            return (
                item.manufacturer?.toLowerCase().includes(term) ||
                item.model?.toLowerCase().includes(term) ||
                item.docket_number?.toLowerCase().includes(term) ||
                item.buyer_name?.toLowerCase().includes(term) ||
                String(item.id).includes(term)
            );
        }

        return true;
    });

    // Save Handlers
    const handleSaveVehicle = async (updatedVehicle, silent = false) => {
        try {
            // Optimistic update
            dispatch(updateVehicle(updatedVehicle));

            // Sync selected vehicle if it's the one being edited - use loose equality
            if (selectedVehicle && selectedVehicle.id == updatedVehicle.id) {
                setSelectedVehicle(updatedVehicle);
            }

            const res = await fetch(`/api/vehicles/${updatedVehicle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedVehicle)
            });

            if (res.ok) {
                const refreshed = await res.json();
                if (!silent) toast.success("Updated successfully");
                // Final sync with server data - pick up the 'vehicle' key from the response
                const vehicleData = refreshed.vehicle || refreshed;
                dispatch(updateVehicle(vehicleData));
                if (selectedVehicle && selectedVehicle.id == vehicleData.id) {
                    setSelectedVehicle(vehicleData);
                }
            } else {
                toast.error("Failed to save changes");
                fetchInventory(); // Revert
            }
        } catch (e) {
            console.error(e);
            toast.error("Error saving updates");
        }
    };

    const handlePrint = (item) => {
        const printWindow = window.open('', '_blank');
        const content = `
            <html>
                <head>
                    <title>Vehicle Details - ${item.registration_number || item.id}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                        .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 20px; }
                        .info-item { margin-bottom: 10px; }
                        .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
                        .value { font-size: 16px; margin-top: 4px; }
                    </style>
                </head>
                <body>
                    <h1>Vehicle Report: ${item.manufacturer} ${item.model}</h1>
                    <div class="info-grid">
                        <div class="info-item"><div class="label">Registration</div><div class="value">${item.registration_number || 'N/A'}</div></div>
                        <div class="info-item"><div class="label">Chassis Number</div><div class="value">${item.chassis_number || 'N/A'}</div></div>
                        <div class="info-item"><div class="label">Customer</div><div class="value">${item.buyer_name || 'N/A'}</div></div>
                        <div class="info-item"><div class="label">Phone</div><div class="value">${item.customer_phone || item.phone || 'N/A'}</div></div>
                        <div class="info-item"><div class="label">Booking Date</div><div class="value">${item.booking_date ? new Date(item.booking_date).toLocaleDateString() : 'N/A'}</div></div>
                        <div class="info-item"><div class="label">Price</div><div class="value">₹${item.price?.toLocaleString() || '0'}</div></div>
                    </div>
                </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/vehicles/${deleteId}`, { method: 'DELETE' });
            if (res.ok) {
                dispatch(deleteVehicle(deleteId));
                toast.success("Vehicle deleted");
                setDeleteId(null);
            } else {
                toast.error("Failed to delete");
            }
        } catch (e) {
            toast.error("Error deleting vehicle");
        }
    };

    const openCustomerModal = (v) => {
        setSelectedVehicle(v);
        setCustomerModalOpen(true);
    };

    const openDealerModal = (v) => {
        setSelectedVehicle(v);
        setDealerModalOpen(true);
    };

    const openDeliveryModal = (v) => {
        setSelectedVehicle(v);
        setDeliveryModalOpen(true);
    };

    // Tab Handlers (Sync with Router)
    useEffect(() => {
        if (location.pathname.includes('/purchase-old-car')) setActiveTab('Purchase');
        else if (location.pathname.includes('/sell-old-car')) setActiveTab('Sale');
        else if (location.pathname.includes('/inventory') || location.pathname.includes('/new-cars')) setActiveTab('New'); // Default
    }, [location.pathname]);

    return (
        <div className="space-y-6 w-full max-w-[1600px] mx-auto px-4 py-6">

            {/* Breadcrumbs and Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <span>Inventory</span>
                    <ChevronRight size={12} />
                    <span className="text-slate-600">{activeTab === 'New' ? 'All New Cars' : activeTab === 'Purchase' ? 'All Purchase List' : 'All Sell List'}</span>
                </div>

                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-1 bg-primary rounded-full"></div>
                        <h2 className="text-xl font-bold uppercase text-slate-800 tracking-tight">
                            {activeTab === 'New' ? 'New Cars' : activeTab === 'Purchase' ? 'Old Cars (Purchase)' : 'Sold Cars'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-md border border-slate-100">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Jan 2026</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <StatsCards stats={stats} />

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-100 bg-white rounded-t-lg">
                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {activeTab === 'New' ? 'New Cars List' : activeTab === 'Purchase' ? 'Old Cars List' : 'Sold Cars List'}
                    </h3>
                </div>

                <div className="p-4">
                    <FilterBar filters={filters} setFilters={setFilters} />

                    <div className="overflow-x-auto border rounded-md -mx-4 sm:mx-0">
                        <table className="w-full text-sm min-w-[800px]">
                            <thead className="bg-[#f8faff] text-[11px] font-bold text-slate-600 uppercase border-b border-slate-100">
                                <tr>
                                    <th className="p-3 text-left min-w-[150px]">Actions</th>
                                    <th className="p-3 text-left min-w-[100px]">Booking Date</th>
                                    {activeTab === 'Purchase' ? (
                                        <>
                                            <th className="p-3 text-left min-w-[100px]">Delivery Date</th>
                                            <th className="p-3 text-center min-w-[100px]">Delivery Status</th>
                                            <th className="p-3 text-left min-w-[120px]">Manufacturer</th>
                                            <th className="p-3 text-left min-w-[120px]">Customer Name</th>
                                            <th className="p-3 text-left min-w-[100px]">Phone</th>
                                            <th className="p-3 text-left min-w-[100px]">Executive</th>
                                            <th className="p-3 text-left min-w-[100px]">Ins. Expiry</th>
                                            <th className="p-3 text-left min-w-[100px]">Reg. Number</th>
                                            <th className="p-3 text-left min-w-[100px]">Model</th>
                                            <th className="p-3 text-right min-w-[100px]">Remaining Amt</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-3 text-left min-w-[120px]">Customer</th>
                                            <th className="p-3 text-left min-w-[100px]">Contact</th>
                                            <th className="p-3 text-center min-w-[100px]">Delivery Status</th>
                                            <th className="p-3 text-left min-w-[100px]">City Name</th>
                                            <th className="p-3 text-left min-w-[150px]">Car</th>
                                            <th className="p-3 text-left min-w-[80px]">Color</th>
                                            <th className="p-3 text-left min-w-[80px]">Fuel</th>
                                            <th className="p-3 text-left min-w-[100px]">Nominee</th>
                                            <th className="p-3 text-right min-w-[100px]">Customer Rem.</th>
                                            <th className="p-3 text-right min-w-[100px]">Net Short</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.slice(0, filters.entries).map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-2">
                                            <div className="flex items-center justify-start gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500" title="View" onClick={() => navigate(`/vehicle/${item.id}`)}><Eye size={14} /></Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-green-600"
                                                    title="Edit"
                                                    onClick={() => {
                                                        const editRoute = item.transaction_type === 'New' ? 'edit-new' :
                                                            item.transaction_type === 'Purchase' ? 'edit-purchase' :
                                                                item.transaction_type === 'Sale' ? 'edit-sale' : 'edit-new';
                                                        navigate(`/inventory/${item.id}/${editRoute}`);
                                                    }}
                                                >
                                                    <Edit size={14} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" title="Delete" onClick={() => setDeleteId(item.id)}><Trash size={14} /></Button>

                                                {/* Actions specific to New Cars */}
                                                {activeTab === 'New' && (
                                                    <>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500" title="Print" onClick={() => handlePrint(item)}><Printer size={14} /></Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-600" title="Customer Details" onClick={() => openCustomerModal(item)}><User size={14} /></Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-orange-600" title="Dealer Details" onClick={() => openDealerModal(item)}><Store size={14} /></Button>
                                                    </>
                                                )}

                                                {/* Actions specific to Purchase/Sale Cars (Payment/Delivery Info) */}
                                                {(activeTab === 'Purchase' || activeTab === 'Sale') && (
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-purple-600" title="Payments & Delivery" onClick={() => openDeliveryModal(item)}>
                                                        <IndianRupee size={14} />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-slate-600 whitespace-nowrap">{item.booking_date ? new Date(item.booking_date).toLocaleDateString('en-GB') : '01/01/2026'}</td>

                                        {activeTab === 'Purchase' ? (
                                            <>
                                                <td className="p-3 text-slate-600">{item.delivery_date ? new Date(item.delivery_date).toLocaleDateString() : 'N/A'}</td>
                                                <td className="p-3 text-center">
                                                    <Badge variant="outline" className={item.delivery_status === 'Delivered' ? 'bg-blue-50 text-blue-700 font-bold border-blue-100' : 'bg-orange-50 text-orange-700 font-bold border-orange-100'}>
                                                        {item.delivery_status || 'Pending'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-slate-600">{item.manufacturer}</td>
                                                <td className="p-3 font-semibold text-slate-800">{item.buyer_name || 'N/A'}</td>
                                                <td className="p-3 text-slate-600">{item.phone || '-'}</td>
                                                <td className="p-3 text-slate-600">{item.executive_name || '-'}</td>
                                                <td className="p-3 text-slate-600">{item.insurance_expiry || 'N/A'}</td>
                                                <td className="p-3 font-mono text-slate-600">{item.registration_number || '-'}</td>
                                                <td className="p-3 text-slate-600">{item.model}</td>
                                                <td className="p-3 text-right font-mono font-bold bg-green-50 text-green-700">{(item.customer_remaining_amount || 0).toFixed(2)}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-3 font-semibold text-slate-800">{item.buyer_name || 'N/A'}</td>
                                                <td className="p-3 text-slate-600 font-medium">{item.customer_phone || item.phone || '-'}</td>
                                                <td className="p-3 text-center">
                                                    <Badge variant="outline" className={cn(
                                                        "font-bold px-3 py-1",
                                                        item.status === 'Sold' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            item.delivery_status === 'Delivered' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-slate-100/50 text-slate-600 border-slate-200'
                                                    )}>
                                                        {item.delivery_status || item.status || 'Available'}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-slate-600">{item.city || '-'}</td>
                                                <td className="p-3 text-slate-800 font-bold">{item.manufacturer} {item.model}</td>
                                                <td className="p-3 text-slate-600">{item.color || '-'}</td>
                                                <td className="p-3 text-slate-600">{item.fuel_type || '-'}</td>
                                                <td className="p-3 text-slate-600">{item.nominee_name || '-'}</td>
                                                <td className="p-3 text-right font-mono font-bold text-green-600 bg-[#f8fff9]">
                                                    {item.customer_remaining_amount ? item.customer_remaining_amount.toFixed(2) : '0.00'}
                                                </td>
                                                <td className="p-3 text-right font-mono font-bold text-red-600 bg-[#fff8f8]">
                                                    {item.net_short_amount ? item.net_short_amount.toFixed(2) : '0.00'}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan={13} className="p-8 text-center text-muted-foreground">No records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
                        <span>Showing {Math.min(filters.entries, filteredItems.length)} of {inventory.length} entries</span>
                        <div className="flex gap-1">
                            {/* Pagination Mock */}
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm" className="bg-slate-100">1</Button>
                            <Button variant="outline" size="sm">Next</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CustomerDetailsModal
                isOpen={customerModalOpen}
                onClose={() => setCustomerModalOpen(false)}
                vehicle={selectedVehicle}
                onSave={handleSaveVehicle}
            />

            <DealerDetailsModal
                isOpen={dealerModalOpen}
                onClose={() => setDealerModalOpen(false)}
                vehicle={selectedVehicle}
                onSave={handleSaveVehicle}
            />

            <UpdateDeliveryInfoModal
                isOpen={deliveryModalOpen}
                onClose={() => setDeliveryModalOpen(false)}
                vehicle={selectedVehicle}
                onSave={handleSaveVehicle}
            />

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
                <div className="p-4 text-center">
                    <p>Are you sure you want to delete this vehicle?</p>
                    <div className="mt-6 flex justify-center gap-2">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
}
