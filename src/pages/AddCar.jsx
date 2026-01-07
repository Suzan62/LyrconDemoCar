import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Wand2, Save, Upload, Car, FileText, UserCheck, DollarSign, CheckCircle, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { useDispatch } from 'react-redux';
import { addVehicle, updateVehicle } from '../store/slices/inventorySlice';
import { jsPDF } from "jspdf";

export default function AddCar(props) {
    const { carToEdit, onClose, initialMode = 'New' } = props;
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const dispatch = useDispatch();

    // Determine mode and initial data
    const [transactionType, setTransactionType] = useState(initialMode);
    const [loading, setLoading] = useState(false);
    const [existingVehicles, setExistingVehicles] = useState([]);
    const [isEditMode, setIsEditMode] = useState(!!id || !!carToEdit || !!location.state?.car);
    const [initialCarData, setInitialCarData] = useState(carToEdit || location.state?.car || null);

    // Main Form State
    const [formData, setFormData] = useState({
        docket_number: '',
        transaction_type: 'New',
        vin: '',
        manufacturer: '',
        model: '',
        year: '',
        color: '',
        fuel_type: '',
        engine_number: '',
        registration_number: '',
        running_km: '',
        rto_code: '',
        rto_name: '',
        rto_passing_status: 'Pending',
        plate_type: 'Normal',

        // Additional Details
        executive_branch: '',
        executive_name: '',
        executive_number: '',
        insurance_company: '',

        // Dates
        delivery_date: '',
        insurance_expiry: '',

        // Sale Details
        buyer_name: '',
        buyer_address: '',
        buyer_email: '',
        buyer_dob: '',
        nominee_name: '',
        nominee_relation: '',
        nominee_dob: '',
        broker_name: '',
        broker_number: '',
        brokerage_amount: ''
    });

    const [files, setFiles] = useState({});
    const [errors, setErrors] = useState({});
    const [multipartDocs, setMultipartDocs] = useState({});

    // Configuration for Documents
    const DOCUMENT_CONFIG = [
        { key: 'RC_Book', label: 'RC Book', dualSided: true },
        { key: 'Aadhar_Card', label: 'Aadhar Card', dualSided: true },
        { key: 'PAN_Card', label: 'PAN Card', dualSided: true },
        { key: 'Insurance_Policy', label: 'Insurance Policy', dualSided: false },
        { key: 'NOC', label: 'NOC', dualSided: false },
        { key: 'Form_35', label: 'Form 35', dualSided: false },
        { key: 'Purchase_Agreement', label: 'Purchase Agreement', dualSided: false },
    ];

    // Helper: Fetch Vehicle if editing via URL
    useEffect(() => {
        const loadVehicle = async () => {
            if (id && !initialCarData) {
                setLoading(true);
                try {
                    const res = await fetch(`/api/vehicles/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setInitialCarData(data);
                        setIsEditMode(true);

                        // Populate form
                        setFormData(prev => ({
                            ...prev,
                            ...data,
                            manufacturer: data.manufacturer || data.make || '',
                            running_km: data.running_km || data.mileage || '',
                            vin: data.id || data.vin || '',
                            transaction_type: data.transaction_type || 'New'
                        }));
                        setTransactionType(data.transaction_type || 'New');
                    } else {
                        toast.error("Vehicle not found");
                        navigate('/inventory');
                    }
                } catch (error) {
                    console.error("Error fetching vehicle:", error);
                    toast.error("Failed to load vehicle details");
                } finally {
                    setLoading(false);
                }
            }
        };
        loadVehicle();
    }, [id, initialCarData]);

    // Helper: Initialize form from props/state if available immediately
    useEffect(() => {
        if (initialCarData) {
            setFormData(prev => ({
                ...prev,
                ...initialCarData,
                manufacturer: initialCarData.manufacturer || initialCarData.make || '',
                running_km: initialCarData.running_km || initialCarData.mileage || '',
                vin: initialCarData.id || initialCarData.vin || '',
                transaction_type: initialCarData.transaction_type || 'New'
            }));
            setTransactionType(initialCarData.transaction_type || 'New');
        } else if (!isEditMode) {
            setTransactionType(initialMode);
        }
    }, [initialCarData, isEditMode, initialMode]);

    // Fetch existing vehicles for autofill
    useEffect(() => {
        fetch('/api/vehicles')
            .then(res => res.json())
            .then(data => setExistingVehicles(data))
            .catch(err => console.error("Failed to fetch vehicles", err));
    }, []);

    const handleCancel = () => {
        if (onClose) onClose();
        else navigate('/inventory');
    };

    const convertImagesToPDF = async (frontFile, backFile) => {
        const doc = new jsPDF();
        const loadImage = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };
        try {
            if (frontFile) {
                const frontData = await loadImage(frontFile);
                const imgProps = doc.getImageProperties(frontData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                doc.addImage(frontData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }
            if (backFile) {
                if (frontFile) doc.addPage();
                const backData = await loadImage(backFile);
                const imgProps = doc.getImageProperties(backData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                doc.addImage(backData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }
            return doc.output('blob');
        } catch (error) {
            console.error("PDF Generation Failed", error);
            toast.error("Failed to generate PDF");
            return null;
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.docket_number) newErrors.docket_number = "Docket Number is required";
        if (transactionType === 'New' || transactionType === 'Purchase') {
            if (!formData.vin) newErrors.vin = "VIN/Chassis Number is required";
            else if (formData.vin.length !== 17) newErrors.vin = "VIN must be exactly 17 characters";
        }
        if (!formData.manufacturer) newErrors.manufacturer = "Manufacturer is required";
        if (!formData.model) newErrors.model = "Model is required";
        if (!formData.year) newErrors.year = "Year is required";
        if (transactionType === 'Sale') {
            if (!formData.buyer_name) newErrors.buyer_name = "Buyer Name is required";
            if (!formData.buyer_email) newErrors.buyer_email = "Buyer Email is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'rto_passing_status' && value === 'Completed' && prev.rto_passing_status !== 'Completed') {
                setTimeout(() => toast.success("Vehicle RTO Parsing Completed!"), 500);
            }
            return { ...prev, [name]: value };
        });
    };

    const handleFileChange = (e, docType) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [docType]: e.target.files[0] }));
        }
    };

    const handleMultipartChange = async (e, docKey, side) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const currentDocState = multipartDocs[docKey] || { front: null, back: null };
            const newDocState = { ...currentDocState, [side]: file };
            setMultipartDocs(prev => ({ ...prev, [docKey]: newDocState }));

            if (newDocState.front && newDocState.back) {
                toast.info(`Merging ${docKey.replace('_', ' ')} images...`);
                const pdfBlob = await convertImagesToPDF(newDocState.front, newDocState.back);
                if (pdfBlob) {
                    const pdfFile = new File([pdfBlob], `${docKey.toLowerCase()}_merged.pdf`, { type: "application/pdf" });
                    setFiles(prev => ({ ...prev, [docKey]: pdfFile }));
                    toast.success(`${docKey.replace('_', ' ')} merged successfully!`);
                }
            } else {
                toast.info(`${side === 'front' ? 'Front' : 'Back'} uploaded. Waiting for ${side === 'front' ? 'Back' : 'Front'} side.`);
            }
        }
    };

    const handleTypeChange = (type) => {
        setTransactionType(type);
        setFormData(prev => ({ ...prev, transaction_type: type }));
    };

    const handleAutoFill = (e) => {
        const selectedId = e.target.value;
        const selectedCar = existingVehicles.find(v => v.id.toString() === selectedId);
        if (selectedCar) {
            setFormData(prev => ({
                ...prev,
                manufacturer: selectedCar.make || '',
                model: selectedCar.model || '',
                year: selectedCar.year || '',
                color: selectedCar.color || '',
                vin: selectedCar.id || '',
            }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        setLoading(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                data.append(key, formData[key]);
            }
        });
        Object.keys(files).forEach(key => {
            data.append(key, files[key]);
        });

        const targetId = isEditMode ? (initialCarData?.id || id) : null;

        try {
            const url = targetId ? `/api/vehicles/${targetId}` : '/api/vehicles';
            const method = targetId ? 'PUT' : 'POST';

            const response = await fetch(url, { method: method, body: data });
            const result = await response.json();

            if (response.ok) {
                const vehiclePayload = {
                    id: result.id || formData.vin || `INV-${Date.now()}`,
                    make: formData.manufacturer,
                    model: formData.model,
                    year: formData.year,
                    price: 0,
                    mileage: formData.running_km,
                    status: 'Available',
                    ...formData
                };

                if (targetId) {
                    dispatch(updateVehicle({ id: targetId, ...vehiclePayload }));
                } else {
                    dispatch(addVehicle(vehiclePayload));
                }

                toast.success(targetId ? "Vehicle Updated!" : "Vehicle Created!");
                handleCancel();
            } else {
                toast.error(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error("Submission failed", error);
            toast.error("Submission failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-full">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 lg:p-8">
                {!onClose && (
                    <div className="mb-8 border-b pb-4 flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={handleCancel}>
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{isEditMode ? 'Edit Vehicle' : 'Vehicle Transaction'}</h2>
                            <p className="text-slate-500 mt-1">Full-width management for inventory and sales.</p>
                        </div>
                    </div>
                )}

                {!props.hideTypeSwitcher && (
                    <div className="grid grid-cols-3 gap-2 md:gap-6 mb-8">
                        {['New', 'Purchase', 'Sale'].map(type => (
                            <button
                                key={type}
                                onClick={() => !props.lockMode && handleTypeChange(type)}
                                className={`p-2 md:p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-1 md:gap-3 transition-all ${transactionType === type
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                                    : 'border-slate-100 hover:border-slate-300 text-slate-500 bg-slate-50/50'
                                    } ${props.lockMode ? 'cursor-default opacity-100' : 'cursor-pointer'}`}
                            >
                                {type === 'New' && <Car className="w-5 h-5 md:w-7 md:h-7" />}
                                {type === 'Purchase' && <FileText className="w-5 h-5 md:w-7 md:h-7" />}
                                {type === 'Sale' && <DollarSign className="w-5 h-5 md:w-7 md:h-7" />}
                                <span className="font-bold text-xs md:text-lg text-center leading-tight">
                                    {type === 'New' ? 'Add New' : type === 'Purchase' ? 'Purchase' : 'Sell Car'}
                                    <span className="hidden md:inline"> {type === 'New' ? 'Car' : type === 'Purchase' ? 'Old Car' : ''}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {transactionType === 'Sale' && (
                    <div className="mb-8 p-6 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                            <Search size={20} /> Auto-Fill from Inventory
                        </h3>
                        <select onChange={handleAutoFill} className="w-full p-3 border border-indigo-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="">-- Select a Vehicle to Sell --</option>
                            {existingVehicles.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.year} {v.make} {v.model} - {v.id || 'No VIN'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="space-y-10">
                    <section>
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Car className="text-slate-400" /> Vehicle Details
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Docket Number</label>
                                <input name="docket_number" value={formData.docket_number} onChange={handleChange} className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${errors.docket_number ? 'border-red-500' : 'border-slate-300'}`} placeholder="e.g. D12345" />
                                {errors.docket_number && <p className="text-xs text-red-500">{errors.docket_number}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Chassis Number / VIN</label>
                                <div className="flex flex-col gap-1">
                                    <div className="flex gap-2">
                                        <input name="vin" value={formData.vin} onChange={handleChange} className={`w-full min-w-0 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${errors.vin ? 'border-red-500' : 'border-slate-300'}`} placeholder="Unique 17-char ID" />
                                        <Button
                                            type="button"
                                            onClick={async () => {
                                                if (!formData.vin || formData.vin.length < 17) {
                                                    toast.error("Please enter a valid 17-digit VIN first.");
                                                    return;
                                                }
                                                try {
                                                    setLoading(true);
                                                    const res = await fetch(`/api/decode-vin/${formData.vin}`);
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        const { manufacturer, model, year, fuel_type } = data.data;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            manufacturer: manufacturer || prev.manufacturer,
                                                            model: model || prev.model,
                                                            year: year || prev.year,
                                                            fuel_type: fuel_type || prev.fuel_type
                                                        }));
                                                        toast.success("Vehicle details auto-filled!");
                                                    } else {
                                                        toast.error(data.message || "Failed to decode VIN");
                                                    }
                                                } catch (err) {
                                                    toast.error("Error connecting to VIN service");
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            variant="outline"
                                            className="shrink-0 flex items-center gap-1 px-4 border-slate-300"
                                            title="Auto-fill details from VIN"
                                        >
                                            <Wand2 size={16} /> Auto-Fill
                                        </Button>
                                    </div>
                                    {errors.vin && <p className="text-xs text-red-500">{errors.vin}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Manufacturer</label>
                                <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${errors.manufacturer ? 'border-red-500' : 'border-slate-300'}`} />
                                {errors.manufacturer && <p className="text-xs text-red-500">{errors.manufacturer}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Model</label>
                                <input name="model" value={formData.model} onChange={handleChange} className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${errors.model ? 'border-red-500' : 'border-slate-300'}`} />
                                {errors.model && <p className="text-xs text-red-500">{errors.model}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Year</label>
                                <input name="year" type="number" value={formData.year} onChange={handleChange} className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${errors.year ? 'border-red-500' : 'border-slate-300'}`} />
                                {errors.year && <p className="text-xs text-red-500">{errors.year}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Color</label>
                                <input name="color" value={formData.color} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Fuel Type</label>
                                <input name="fuel_type" value={formData.fuel_type} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                            </div>
                            {transactionType !== 'New' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Running Kilometers</label>
                                    <input name="running_km" type="number" value={formData.running_km} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="border-t border-slate-100"></div>

                    <section>
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Additional Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Executive Name</label>
                                <input name="executive_name" value={formData.executive_name} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Parsing Status</label>
                                <select name="rto_passing_status" value={formData.rto_passing_status} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                                    <option>Pending</option>
                                    <option>In-Progress</option>
                                    <option>Completed</option>
                                    <option>Rejected</option>
                                    <option>Document Error</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Plate Type</label>
                                <select name="plate_type" value={formData.plate_type} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                                    <option>Normal</option>
                                    <option>Choice (VIP)</option>
                                    <option>High-Security (HSRP)</option>
                                    <option>Temporary</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Insurance Company</label>
                                <input name="insurance_company" value={formData.insurance_company} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                            </div>
                        </div>
                    </section>

                    {transactionType === 'New' && (
                        <>
                            <div className="border-t border-slate-100"></div>
                            <section className="bg-blue-50/30 p-6 rounded-lg border border-blue-100">
                                <h3 className="text-xl font-bold text-blue-900 mb-6">New Car Specifics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Delivery/Arrival Date</label>
                                        <input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {transactionType === 'Purchase' && (
                        <>
                            <div className="border-t border-slate-100"></div>
                            <section className="bg-amber-50/30 p-6 rounded-lg border border-amber-100">
                                <h3 className="text-xl font-bold text-amber-900 mb-6">Purchase Documents</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                    {DOCUMENT_CONFIG.map((doc) => {
                                        if (doc.dualSided) {
                                            return (
                                                <div key={doc.key} className={`space-y-4 p-4 border rounded-xl bg-white ${files[doc.key] ? 'border-green-500 ring-2 ring-green-100' : 'border-amber-200'} transition-all hover:shadow-md md:col-span-2 lg:col-span-3`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-bold text-slate-700">{doc.label} (Front & Back)</label>
                                                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Merged to PDF</span>
                                                        </div>
                                                        {files[doc.key] && <CheckCircle className="text-green-500 h-5 w-5" />}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <span className="text-xs font-semibold text-slate-500 uppercase">Front Side</span>
                                                            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleMultipartChange(e, doc.key, 'front')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <span className="text-xs font-semibold text-slate-500 uppercase">Back Side</span>
                                                            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleMultipartChange(e, doc.key, 'back')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-slate-400 italic mt-2">
                                                        * Uploading both sides will automatically merge them into a single PDF document.
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={doc.key} className={`space-y-2 p-4 border rounded-xl bg-white ${files[doc.key] ? 'border-green-500 ring-2 ring-green-100' : 'border-amber-200'} transition-all hover:shadow-md`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-sm font-bold text-slate-700">{doc.label}</label>
                                                        {files[doc.key] && <CheckCircle className="text-green-500 h-5 w-5" />}
                                                    </div>
                                                    <input type="file" accept="image/*,application/pdf" capture="environment" onChange={(e) => handleFileChange(e, doc.key)} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 transition-colors" />
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            </section>
                        </>
                    )}

                    {transactionType === 'Sale' && (
                        <>
                            <div className="border-t border-slate-100"></div>
                            <section className="bg-green-50/30 p-6 rounded-lg border border-green-100">
                                <h3 className="text-xl font-bold text-green-900 mb-6">Buyer & Broker Details</h3>
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-lg"><UserCheck size={20} /> Customer Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <input name="buyer_name" placeholder="Name" value={formData.buyer_name} onChange={handleChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                            <input name="buyer_email" placeholder="Email" value={formData.buyer_email} onChange={handleChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                            <input name="buyer_dob" type="date" placeholder="DOB" value={formData.buyer_dob} onChange={handleChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                            <input name="buyer_address" placeholder="Address" value={formData.buyer_address} onChange={handleChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-800 mb-4 text-lg">Nominee Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <input name="nominee_name" placeholder="Nominee Name" value={formData.nominee_name} onChange={handleChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                            <select name="nominee_relation" value={formData.nominee_relation} onChange={handleChange} className="p-3 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none">
                                                <option value="">Select Relation</option>
                                                <option>Spouse</option>
                                                <option>Father</option>
                                                <option>Mother</option>
                                                <option>Son</option>
                                                <option>Daughter</option>
                                                <option>Brother</option>
                                                <option>Sister</option>
                                            </select>
                                            <input name="nominee_dob" type="date" placeholder="Nominee DOB" value={formData.nominee_dob} onChange={handleChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-800 mb-4 text-lg">Brokerage</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <input name="broker_name" placeholder="Broker Name" value={formData.broker_name} onChange={handleChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                            <input name="broker_number" placeholder="Broker Phone" value={formData.broker_number} onChange={handleChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                            <input name="brokerage_amount" type="number" placeholder="Brokerage Amount" value={formData.brokerage_amount} onChange={handleChange} className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                </div>

                <div className="flex items-center justify-end pt-4 gap-4 mt-4 border-t border-slate-100">
                    <Button variant="outline" onClick={handleCancel} size="lg" className="px-8">Cancel</Button>
                    <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800 px-8" onClick={handleSubmit} disabled={loading} size="lg">
                        <Save size={18} /> {loading ? 'Saving...' : 'Save Transaction'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
