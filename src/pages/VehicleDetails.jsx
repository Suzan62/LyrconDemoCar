import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { deleteVehicle } from '../store/slices/inventorySlice';
import { ArrowLeft, Edit, Trash, Gauge, Camera } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalFooter } from '../components/ui/Modal';

export default function VehicleDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [fetchedCar, setFetchedCar] = useState(null);
    const [loading, setLoading] = useState(false);

    // Find vehicle in redux store (handle type mismatch)
    const reduxCar = useSelector(state =>
        state.inventory.items.find(item => String(item.id) === id)
    );

    const car = reduxCar || fetchedCar;

    React.useEffect(() => {
        if (!reduxCar && id) {
            setLoading(true);
            fetch(`/api/vehicles/${id}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Vehicle not found');
                })
                .then(data => {
                    setFetchedCar(data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Failed to fetch vehicle", error);
                    setLoading(false);
                });
        }
    }, [id, reduxCar]);

    if (loading) {
        return <div className="p-8 text-center">Loading vehicle details...</div>;
    }

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
            if (response.ok) {
                dispatch(deleteVehicle(Number(id))); // Cast to number for Redux
                navigate('/inventory');
            } else {
                alert("Failed to delete vehicle from server.");
            }
        } catch (error) {
            console.error("Delete failed", error);
            alert("Error deleting vehicle.");
        }
    };

    if (!car) {
        return <div className="p-8 text-center text-red-500">Vehicle not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/inventory')}>
                    <ArrowLeft size={18} />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{car.year} {car.make} {car.model}</h2>
                    <p className="text-muted-foreground">VIN: {car.id} • {car.trim || 'Standard'}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => navigate('/add-car', { state: { car } })}>
                        <Edit size={16} /> Edit
                    </Button>
                    <Button variant="destructive" className="gap-2" onClick={() => setIsDeleteModalOpen(true)}>
                        <Trash size={16} /> Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-0 overflow-hidden rounded-lg">
                            <div className="h-64 bg-gray-200 w-full flex items-center justify-center text-gray-400">
                                <span className="flex items-center gap-2"><Camera /> No Image Available</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Vehicle Specifications</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground block">Odometer</span>
                                <span className="font-medium">{car.mileage} miles</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground block">Exterior Color</span>
                                <span className="font-medium">{car.color || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground block">Fuel Type</span>
                                <span className="font-medium">{car.fuel_type || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground block">Transmission</span>
                                <span className="font-medium">Automatic</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar / Stats */}
                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader><CardTitle className="text-primary flex items-center gap-2"><Gauge size={20} /> AI Profitability</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center justify-center py-4">
                                <div className="relative h-32 w-32">
                                    <svg className="h-full w-full" viewBox="0 0 36 36">
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="#e2e8f0"
                                            strokeWidth="3"
                                        />
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" // Semi circleish (not really but enough for gauge)
                                            fill="none"
                                            stroke="#007bff"
                                            strokeWidth="3"
                                            strokeDasharray={`${car.profitability}, 100`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold">{car.profitability}</span>
                                        <span className="text-xs text-muted-foreground">Score</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Predicted Margin</span>
                                    <span className="font-bold text-green-600">+{car.predictedMargin}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Days to Sell</span>
                                    <span className="font-bold">14 days</span>
                                </div>
                            </div>
                            <Button className="w-full">View Market Analysis</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Sale Status</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex gap-2 flex-wrap">
                                <Badge>{car.status}</Badge>
                                <Badge variant="outline">Clean Title</Badge>
                                <Badge variant="outline">One Owner</Badge>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <span className="text-2xl font-bold">${(car.price || 0).toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

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
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete Vehicle
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
