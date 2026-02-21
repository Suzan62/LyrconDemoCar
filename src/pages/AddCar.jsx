import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Wand2, Save, Upload, Car, FileText, UserCheck, DollarSign, CheckCircle, Search, ArrowLeft, FilePlus, Eye, Camera, Trash } from 'lucide-react';
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

    // Sync transactionType with initialCarData if present
    useEffect(() => {
        if (initialCarData?.transaction_type) {
            setTransactionType(initialCarData.transaction_type);
        }
    }, [initialCarData]);

    // Main Form State
    const [formData, setFormData] = useState({
        docket_number: '',
        transaction_type: 'New',
        entry_type: '',
        booking_date: '',
        delivery_date: '',

        // Customer Details
        customer_name: '',
        customer_phone: '',
        customer_address_line1: '',
        customer_address_line2: '',
        customer_city: '',
        customer_pincode: '',
        customer_email: '',
        customer_dob: '',

        // Nominee Details
        nominee_relation: '',
        nominee_name: '',
        nominee_dob: '',

        // Vehicle Information
        manufacturer: '',
        model: '',
        color: '',
        year: '',
        fuel_type: '',
        registration_number: '',
        vin: '',
        engine_number: '',
        hp: '',
        running_km: '',
        renovation_cost: '',

        // Additional Details
        dealer: '',
        location: '',
        executive_name: '',
        executive_number: '',
        executive_branch: '',
        choice_number: '',
        insurance_company: '',
        insurance_expiry: '',
        rto_name: '',
        rto_code: '',
        rto_passing_status: 'Pending',
        plate_type: 'Normal',
        scheme: '',
        broker_name: '',
        broker_number: '',
        brokerage_amount: '',
        other_remarks: '',

        // Sale Details (for Sale mode)
        buyer_name: '',
        buyer_address: '',
        buyer_email: '',
        buyer_dob: '',

        // Pricing
        price: '',
        buying_price: '' // Added for Profit Calculation
    });

    const [files, setFiles] = useState({});
    const [errors, setErrors] = useState({});
    const [multipartDocs, setMultipartDocs] = useState({});

    // Dynamic Documents State
    const [customDocs, setCustomDocs] = useState([]);
    const [newDocName, setNewDocName] = useState('');
    const [newDocFile, setNewDocFile] = useState(null);

    const handleAddCustomDoc = () => {
        console.log("Adding Custom Doc:", newDocName, newDocFile);
        if (newDocName && newDocFile) {
            setCustomDocs([...customDocs, { name: newDocName, file: newDocFile }]);
            setNewDocName('');
            setNewDocFile(null);
            toast.success("Document added to list (don't forget to Save!)");
        } else {
            toast.error("Please enter a name and select a file");
        }
    };

    const handleRemoveCustomDoc = (index) => {
        setCustomDocs(customDocs.filter((_, i) => i !== index));
    };

    // Configuration for Documents - New Cars
    const NEW_CAR_DOCUMENTS = [
        { key: 'KYC', label: 'KYC', dualSided: true },
        { key: 'Deal_Agreement', label: 'Deal Agreement', dualSided: false },
    ];

    // Configuration for Documents - Purchase/Sale Old Cars
    const OLD_CAR_DOCUMENTS = [
        { key: 'RC_Book', label: 'RC Book', dualSided: true },
        { key: 'Owner_ID_Proof', label: 'Owner ID Proof', dualSided: true },
        { key: 'Insurance_Policy', label: 'Insurance', dualSided: false },
        { key: 'PAN_Card', label: 'Pan Card', dualSided: true },
        { key: 'Aadhar_Card', label: 'Aadhar Card', dualSided: true },
        { key: 'NOC', label: 'NOC', dualSided: false },
        { key: 'Form_35', label: 'Form 35', dualSided: false },
        { key: 'Purchase_Agreement', label: 'Purchase Agreement', dualSided: false },
    ];

    // Select appropriate document config based on transaction type
    const DOCUMENT_CONFIG = transactionType === 'New' ? NEW_CAR_DOCUMENTS : OLD_CAR_DOCUMENTS;

    // Helper: Fetch Vehicle if editing via URL
    useEffect(() => {
        const loadVehicle = async () => {
            if (id && !initialCarData) {
                setLoading(true);
                try {
                    const typeParam = initialMode === 'Purchase' ? 'Purchase' : initialMode === 'Sale' ? 'Sale' : 'New';
                    const res = await fetch(`/api/vehicles/${id}?type=${typeParam}`);
                    if (res.ok) {
                        const data = await res.json();
                        setInitialCarData(data);
                        setIsEditMode(true);

                        // Populate form safely, ensuring no null values leak into state
                        const safeData = {};
                        Object.keys(data).forEach(key => {
                            if (data[key] === null) {
                                safeData[key] = '';
                            } else if (key.includes('date') || key.includes('dob') || key.includes('expiry')) {
                                // Format dates as YYYY-MM-DD for inputs
                                try {
                                    safeData[key] = data[key].split('T')[0];
                                } catch (e) {
                                    safeData[key] = data[key];
                                }
                            } else {
                                safeData[key] = data[key];
                            }
                        });

                        setFormData(prev => ({
                            ...prev,
                            ...safeData,
                            manufacturer: safeData.manufacturer || safeData.make || '',
                            docket_number: safeData.docket_number || '',
                            running_km: safeData.running_km || safeData.mileage || '',
                            vin: safeData.chassis_number || safeData.id || safeData.vin || '',
                            transaction_type: initialMode === 'New' ? (safeData.transaction_type || 'New') : initialMode,

                            // Map Pricing for Profit Calc
                            buying_price: safeData.current_price || safeData.buying_price || '',
                            price: initialMode === 'Sale' ? (safeData.price || '') : (safeData.current_price || safeData.price || ''),
                            renovation_cost: safeData.renovation_cost || ''
                        }));
                        setTransactionType(initialMode === 'New' ? (safeData.transaction_type || 'New') : initialMode);
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
            const safeCarData = {};
            Object.keys(initialCarData).forEach(key => {
                if (initialCarData[key] === null) {
                    safeCarData[key] = '';
                } else if (key.includes('date') || key.includes('dob') || key.includes('expiry')) {
                    // Format dates as YYYY-MM-DD for inputs
                    try {
                        safeCarData[key] = initialCarData[key].split('T')[0];
                    } catch (e) {
                        safeCarData[key] = initialCarData[key];
                    }
                } else {
                    safeCarData[key] = initialCarData[key];
                }
            });

            setFormData(prev => ({
                ...prev,
                ...safeCarData,
                manufacturer: safeCarData.manufacturer || safeCarData.make || '',
                docket_number: safeCarData.docket_number || '',
                running_km: safeCarData.running_km || safeCarData.mileage || '',
                vin: safeCarData.chassis_number || safeCarData.id || safeCarData.vin || '',
                transaction_type: initialMode === 'New' ? (safeCarData.transaction_type || 'New') : initialMode
            }));
            setTransactionType(initialMode === 'New' ? (safeCarData.transaction_type || 'New') : initialMode);
        } else if (!isEditMode) {
            // Ensure formData stays in sync with the current mode for new records
            setFormData(prev => ({
                ...prev,
                transaction_type: initialMode
            }));
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
        if (onClose) {
            onClose();
        } else {
            navigate(-1);
        }
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
        if (!formData.docket_number && transactionType === 'New') newErrors.docket_number = "Docket Number is required";
        if (transactionType === 'New' || transactionType === 'Purchase') {
            if (!formData.vin) newErrors.vin = "VIN/Chassis Number is required";
            // Relaxed VIN length validation for old/purchase cars as they may not follow standard 17-char formats
            else if (transactionType === 'New' && formData.vin.length !== 17) {
                newErrors.vin = "VIN must be exactly 17 characters for new cars";
            }
        }
        if (!formData.manufacturer && transactionType !== 'Sale') newErrors.manufacturer = "Manufacturer is required";
        if (!formData.model) newErrors.model = "Model is required";
        if (!formData.year) newErrors.year = "Year is required";
        if (!formData.registration_number) newErrors.registration_number = "Registration Number is required";
        if (transactionType === 'Sale') {
            if (!formData.customer_name) newErrors.customer_name = "Customer Name is required";
            if (!formData.customer_email) newErrors.customer_email = "Customer Email is required";
        }

        // Debug logging
        if (Object.keys(newErrors).length > 0) {
            console.log('Validation failed with errors:', newErrors);
            console.log('Current formData:', {
                model: formData.model,
                year: formData.year,
                registration_number: formData.registration_number,
                customer_name: formData.customer_name,
                customer_email: formData.customer_email,
                transactionType: transactionType
            });
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

    // VIN Auto-Fill Functionality
    const handleVinAutoFill = async () => {
        if (!formData.vin) {
            toast.error('Please enter a VIN/Chassis Number first');
            return;
        }

        try {
            toast.info('Fetching vehicle details...');
            const response = await fetch(`/api/decode-vin/${formData.vin}`);

            if (!response.ok) {
                throw new Error('Failed to decode VIN');
            }

            const data = await response.json();

            setFormData(prev => ({
                ...prev,
                manufacturer: data.Make || prev.manufacturer,
                model: data.Model || prev.model,
                year: data.ModelYear || prev.year,
                fuel_type: data.FuelTypePrimary || prev.fuel_type
            }));

            toast.success('Vehicle details auto-filled successfully!');
        } catch (error) {
            console.error('Auto-fill error:', error);
            toast.error('Could not auto-fill vehicle details. Please enter manually.');
        }
    };


    // PDF Preview Function
    const handlePreview = (file) => {
        if (file) {
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        }
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
        const selectedCar = existingVehicles.find(v => (v.id).toString() === selectedId);
        if (selectedCar) {
            // When selecting an existing car for Sale, we switch to Edit Mode
            // so that the submission maps to a PUT request (updating the vehicle to 'Sold')
            // instead of a POST request (which would fail with 'VIN already exists')
            setIsEditMode(true);
            setInitialCarData(selectedCar);

            setFormData(prev => ({
                ...prev,
                manufacturer: selectedCar.manufacturer || selectedCar.make || '',
                docket_number: selectedCar.docket_number || '',
                model: selectedCar.model || '',
                year: selectedCar.year || '',
                color: selectedCar.color || '',
                vin: selectedCar.chassis_number || selectedCar.vin || selectedCar.id || '',
                registration_number: selectedCar.registration_number || '',
                engine_number: selectedCar.engine_number || '',
                fuel_type: selectedCar.fuel_type || '',
                running_km: selectedCar.running_km || '',
                hp: selectedCar.hp || selectedCar.hp_name || '',
                insurance_company: selectedCar.insurance_company || '',
                insurance_expiry: selectedCar.insurance_expiry || '',
                // Preserve customer/buyer fields that user may have already entered
                customer_name: prev.customer_name || '',
                customer_email: prev.customer_email || ''
            }));
            toast.success("Vehicle details loaded. Form is now in Update mode.");
        }
    };



    const handlePartialSave = async (section) => {
        console.log(`Partial Save Initiated for section: ${section}`);
        setLoading(true);
        const data = new FormData();

        console.log("Form Data Keys being appended:");

        // Append IDs and Type (Always needed)
        data.append('transaction_type', transactionType);
        if (id) data.append('id', id);

        // STRATEGY CHANGE: 
        // Instead of partial data, we send ALL data available in formData.
        // This ensures that if it's a new Create request, we don't fail validation due to missing fields 
        // that might be in other sections (e.g. VIN, Dealer, etc. if user filled them).
        // The backend `update_common_fields` only updates what is sent, so sending extra empty fields is fine usually,
        // (as long as we don't wipe existing data with empty strings - but formData has current state).
        // Actually, safer to send everything non-null/non-undefined.

        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                // console.log(`Key: ${key}, Value: ${formData[key]}`);
                data.append(key, formData[key]);
            }
        });

        console.log(`Appending ${customDocs.length} custom docs`);
        // Append Custom Docs (Crucial for "Add Doc" per user request)
        // If user added a doc then clicked "Save Pricing", we want that doc saved too.
        customDocs.forEach((doc, index) => {
            data.append(`doc_name_${index}`, doc.name);
            data.append(`doc_file_${index}`, doc.file);
        });

        // Append Static Files (KYC) if any new ones selected
        Object.keys(files).forEach(key => {
            if (files[key]) data.append(key, files[key]);
        });

        // Use ID if available, regardless of isEditMode state to prevent duplicates
        const targetId = initialCarData?.id || id;

        try {
            // IF creating new (no ID), we must validate minimal required fields generally
            // OR we just create a "Draft" vehicle? 
            // For now, assuming user might be editing or creating.
            // If creating, we need at least some mandatory fields for DB?
            // Backend `create_vehicle` might fail if required fields missing?
            // Let's rely on backend optionality or existing validation if full submit.
            // But for partial save, we might need to bypass strict validation?
            // Our backend `Vehicle` model has many nullable=True, but some False?
            // status default 'unsold', created_at default.
            // Mapped columns: everything seems Nullable=True except Pks?
            // Let's check `app.py`.
            // Ah, checked `app.py` earlier: almost everything is nullable=True except IDs and some status.

            const url = targetId ? `/api/vehicles/${targetId}` : '/api/vehicles';
            const method = targetId ? 'PUT' : 'POST';

            const response = await fetch(url, { method: method, body: data });
            const result = await response.json();

            if (response.ok) {
                const vehiclePayload = result.vehicle || { ...formData, id: result.id };

                if (targetId) {
                    dispatch(updateVehicle(vehiclePayload));
                    toast.success(`${section === 'customer' ? 'Customer' : 'Pricing'} details updated!`);
                } else {
                    dispatch(addVehicle(vehiclePayload));
                    toast.success(`Vehicle created with ${section === 'customer' ? 'customer' : 'pricing'} details!`);
                    // Update URL to edit mode to prevent duplicate creation on next save
                    navigate(`/edit-new-car/${result.id}`, { state: { car: vehiclePayload }, replace: true });
                    // Also update local state
                    setIsEditMode(true);
                    setInitialCarData(vehiclePayload);
                }
            } else {
                console.error("Save Error Response:", result);
                toast.error(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error("Partial save failed EXCEPTION:", error);
            toast.error("Save failed. check console.");
        } finally {
            setLoading(false);
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

        // Append Custom Docs
        customDocs.forEach((doc, index) => {
            data.append(`doc_name_${index}`, doc.name);
            data.append(`doc_file_${index}`, doc.file);
        });

        // Explicitly append transaction_type as it's not in formData
        data.append('transaction_type', transactionType);

        // Use ID if available, regardless of isEditMode state to prevent duplicates
        const targetId = initialCarData?.id || id;

        try {
            const url = targetId ? `/api/vehicles/${targetId}` : '/api/vehicles';
            const method = targetId ? 'PUT' : 'POST';

            const response = await fetch(url, { method: method, body: data });
            const result = await response.json();

            if (response.ok) {
                const vehiclePayload = result.vehicle || {
                    id: result.id || formData.vin || `INV-${Date.now()}`,
                    ...formData
                };

                if (targetId) {
                    dispatch(updateVehicle(vehiclePayload));
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
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                                {isEditMode
                                    ? 'Edit Vehicle'
                                    : transactionType === 'New'
                                        ? 'Add New Car'
                                        : transactionType === 'Purchase'
                                            ? 'Add Old Car'
                                            : 'Sell Old Car'}
                            </h2>
                            <p className="text-slate-500 mt-1">
                                {transactionType === 'New'
                                    ? 'Enter details for new inventory.'
                                    : transactionType === 'Purchase'
                                        ? 'Record details for purchasing an old vehicle.'
                                        : 'Process a sale for an existing vehicle.'}
                            </p>
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
                                <option key={`${v.transaction_type}-${v.id}`} value={v.id}>
                                    {v.year} {v.make} {v.model} - {v.id || 'No VIN'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="space-y-10">
                    {/* Basic Information */}
                    {transactionType === 'New' && (
                        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <FileText className="text-blue-500" /> Basic Information
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Docket Number *</label>
                                    <input
                                        name="docket_number"
                                        value={formData.docket_number}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.docket_number ? 'border-red-500' : 'border-slate-300'}`}
                                        placeholder="e.g. 427856"
                                    />
                                    {errors.docket_number && <p className="text-xs text-red-500">{errors.docket_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Entry Type *</label>
                                    <select
                                        name="entry_type"
                                        value={formData.entry_type}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select Entry Type</option>
                                        <option>Stock</option>
                                        <option>Retail</option>
                                        <option>Corporate</option>
                                        <option>Exchange</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Booking Date *</label>
                                    <input
                                        name="booking_date"
                                        type="date"
                                        value={formData.booking_date || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Delivery Date *</label>
                                    <input
                                        name="delivery_date"
                                        type="date"
                                        value={formData.delivery_date || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Customer Details */}
                    {transactionType === 'New' && (
                        <>
                            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <UserCheck className="text-green-500" /> Customer Details
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Customer Name</label>
                                        <input
                                            name="customer_name"
                                            value={formData.customer_name}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Customer Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Customer Phone</label>
                                        <input
                                            name="customer_phone"
                                            value={formData.customer_phone}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Customer Phone"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Address Line 1</label>
                                        <input
                                            name="customer_address_line1"
                                            value={formData.customer_address_line1}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Address Line 1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Address Line 2</label>
                                        <input
                                            name="customer_address_line2"
                                            value={formData.customer_address_line2}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Address Line 2"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">City</label>
                                        <input
                                            name="customer_city"
                                            value={formData.customer_city}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter City Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Pincode</label>
                                        <input
                                            name="customer_pincode"
                                            value={formData.customer_pincode}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Pincode"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <input
                                            name="customer_email"
                                            type="email"
                                            value={formData.customer_email}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Email"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Date of Birth</label>
                                        <input
                                            name="customer_dob"
                                            type="date"
                                            value={formData.customer_dob}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex justify-end">
                                        <Button
                                            type="button"
                                            onClick={() => handlePartialSave('customer')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                            disabled={loading}
                                        >
                                            <Save size={16} /> Save Customer Details
                                        </Button>
                                    </div>
                                </div>
                            </section>

                            {/* Nominee Details */}
                            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <UserCheck className="text-teal-500" /> Nominee Details
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Nominee Relation *</label>
                                        <select
                                            name="nominee_relation"
                                            value={formData.nominee_relation || ''}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Select Nominee Relation</option>
                                            <option>Spouse</option>
                                            <option>Father</option>
                                            <option>Mother</option>
                                            <option>Son</option>
                                            <option>Daughter</option>
                                            <option>Brother</option>
                                            <option>Sister</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Nominee Name *</label>
                                        <input
                                            name="nominee_name"
                                            value={formData.nominee_name || ''}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Nominee Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Nominee Date of Birth *</label>
                                        <input
                                            name="nominee_dob"
                                            type="date"
                                            value={formData.nominee_dob || ''}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </section>

                        </>
                    )}

                    {/* Vehicle Information */}
                    {transactionType === 'New' && (
                        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Car className="text-indigo-500" /> Vehicle Information
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {transactionType === 'New' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">VIN/Chassis Number *</label>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                name="vin"
                                                value={formData.vin}
                                                onChange={handleChange}
                                                className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.vin ? 'border-red-500' : 'border-slate-300'}`}
                                                placeholder="Enter VIN/Chassis Number"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleVinAutoFill}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap sm:w-auto w-full"
                                            >
                                                Auto-Fill
                                            </button>
                                        </div>
                                        {errors.vin && <p className="text-xs text-red-500">{errors.vin}</p>}
                                    </div>
                                )}
                                {transactionType === 'New' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Manufacturer *</label>
                                            <input
                                                name="manufacturer"
                                                value={formData.manufacturer}
                                                onChange={handleChange}
                                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.manufacturer ? 'border-red-500' : 'border-slate-300'}`}
                                                placeholder="Enter Manufacturer Name"
                                            />
                                            {errors.manufacturer && <p className="text-xs text-red-500">{errors.manufacturer}</p>}
                                        </div>
                                    </>
                                )}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Model</label>
                                    <input
                                        name="model"
                                        value={formData.model}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.model ? 'border-red-500' : 'border-slate-300'}`}
                                        placeholder="Enter Model Name"
                                    />
                                    {errors.model && <p className="text-xs text-red-500">{errors.model}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Color</label>
                                    <input
                                        name="color"
                                        value={formData.color}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Enter Color"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Manufacture Year *</label>
                                    <input
                                        name="year"
                                        type="number"
                                        value={formData.year}
                                        onChange={handleChange}
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.year ? 'border-red-500' : 'border-slate-300'}`}
                                        placeholder="Enter Manufacture Year"
                                    />
                                    {errors.year && <p className="text-xs text-red-500">{errors.year}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Fuel Type</label>
                                    <input
                                        name="fuel_type"
                                        value={formData.fuel_type}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Enter Fuel Type"
                                    />
                                </div>
                                {transactionType === 'New' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Registration Number *</label>
                                            <input
                                                name="registration_number"
                                                value={formData.registration_number}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Enter Registration Number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Engine Number</label>
                                            <input
                                                name="engine_number"
                                                value={formData.engine_number}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Enter Engine Number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Insurance Expiry Date *</label>
                                            <input
                                                name="insurance_expiry"
                                                type="date"
                                                value={formData.insurance_expiry}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">HP</label>
                                            <input
                                                name="hp"
                                                value={formData.hp}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Enter HP Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Running Kilometer</label>
                                            <input
                                                name="running_km"
                                                type="number"
                                                value={formData.running_km}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Enter running kilometer"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Additional Details */}
                    {transactionType === 'New' && (
                        <>
                            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <FilePlus className="text-orange-500" /> Additional Details
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Dealer *</label>
                                        <input
                                            name="dealer"
                                            value={formData.dealer}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Dealer Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Location *</label>
                                        <input
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Location"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Parivar's Executive name *</label>
                                        <input
                                            name="executive_name"
                                            value={formData.executive_name}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Parivar's Executive Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Executive Number *</label>
                                        <input
                                            name="executive_number"
                                            value={formData.executive_number}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Executive Number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Executive Branch *</label>
                                        <input
                                            name="executive_branch"
                                            value={formData.executive_branch}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Executive Branch Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Choice Number</label>
                                        <input
                                            name="choice_number"
                                            value={formData.choice_number}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Choice Number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Insurance Company *</label>
                                        <input
                                            name="insurance_company"
                                            value={formData.insurance_company}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Insurance Company Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">RTO *</label>
                                        <input
                                            name="rto_name"
                                            value={formData.rto_name}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter RTO Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">RTO Code *</label>
                                        <input
                                            name="rto_code"
                                            value={formData.rto_code}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter RTO Code"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Parsing Status *</label>
                                        <select
                                            name="rto_passing_status"
                                            value={formData.rto_passing_status}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Select Parsing Status</option>
                                            <option>Pending</option>
                                            <option>In-Progress</option>
                                            <option>Completed</option>
                                            <option>Rejected</option>
                                            <option>Document Error</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Number Plate Type *</label>
                                        <select
                                            name="plate_type"
                                            value={formData.plate_type}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Select Number Plate Type</option>
                                            <option>Normal</option>
                                            <option>Choice (VIP)</option>
                                            <option>High-Security (HSRP)</option>
                                            <option>Temporary</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Scheme</label>
                                        <input
                                            name="scheme"
                                            value={formData.scheme}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Scheme"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Broker Name</label>
                                        <input
                                            name="broker_name"
                                            value={formData.broker_name}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Broker Name"
                                        />
                                    </div>
                                    {transactionType === 'Purchase' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Broker number</label>
                                                <input
                                                    name="broker_number"
                                                    value={formData.broker_number}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Enter Broker number"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-700">Broker Brokerage</label>
                                                <input
                                                    name="brokerage_amount"
                                                    type="number"
                                                    value={formData.brokerage_amount}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="Enter Broker Brokerage"
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div className="space-y-2 lg:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">Other Remarks</label>
                                        <textarea
                                            name="other_remarks"
                                            value={formData.other_remarks}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Other Remarks"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="border-t border-slate-100"></div>
                        </>
                    )}

                    {/* Documents Section for New Cars */}
                    {transactionType === 'New' && (
                        <section className="bg-blue-50/30 p-6 rounded-lg border border-blue-100">
                            <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                                <FileText className="text-blue-600" /> Documents
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {DOCUMENT_CONFIG.map((doc) => {
                                    if (doc.dualSided) {
                                        return (
                                            <div key={doc.key} className={`space-y-4 p-4 border rounded-xl bg-white ${files[doc.key] ? 'border-green-500 ring-2 ring-green-100' : 'border-blue-200'} transition-all hover:shadow-md md:col-span-2 lg:col-span-3`}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-sm font-bold text-slate-700">{doc.label} (Front & Back)</label>
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Merged to PDF</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {files[doc.key] && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePreview(files[doc.key])}
                                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                title="Preview Merged PDF"
                                                            >
                                                                <Eye size={20} />
                                                            </button>
                                                        )}
                                                        {files[doc.key] && <CheckCircle className="text-green-500 h-5 w-5" />}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <span className="text-xs font-semibold text-slate-500 uppercase">Front Side</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            onChange={(e) => handleMultipartChange(e, doc.key, 'front')}
                                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-xs font-semibold text-slate-500 uppercase">Back Side</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            onChange={(e) => handleMultipartChange(e, doc.key, 'back')}
                                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-400 italic mt-2">
                                                    * Uploading both sides will automatically merge them into a single PDF document.
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={doc.key} className={`space-y-2 p-4 border rounded-xl bg-white ${files[doc.key] ? 'border-green-500 ring-2 ring-green-100' : 'border-blue-200'} transition-all hover:shadow-md`}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-sm font-bold text-slate-700">{doc.label}</label>
                                                    {files[doc.key] && <CheckCircle className="text-green-500 h-5 w-5" />}
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    capture="environment"
                                                    onChange={(e) => handleFileChange(e, doc.key)}
                                                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition-colors"
                                                />
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </section>
                    )}

                    {/* Car Images Section for New Cars */}
                    {transactionType === 'New' && (
                        <>
                            <div className="border-t border-slate-100"></div>
                            <section className="bg-purple-50/30 p-6 rounded-lg border border-purple-100">
                                <h3 className="text-xl font-bold text-purple-900 mb-6 flex items-center gap-2">
                                    <Upload className="text-purple-600" /> Car Images
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 p-4 border rounded-xl bg-white border-purple-200 transition-all hover:shadow-md">
                                        <label className="text-sm font-bold text-slate-700 block mb-2">Main Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(e) => handleFileChange(e, 'Main_Image')}
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2 p-4 border rounded-xl bg-white border-purple-200 transition-all hover:shadow-md">
                                        <label className="text-sm font-bold text-slate-700 block mb-2">Additional Images</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            multiple
                                            onChange={(e) => handleFileChange(e, 'Additional_Images')}
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition-colors"
                                        />
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {/* Purchase Old Car Form */}
                    {transactionType === 'Purchase' && (
                        <>
                            {/* Basic Information */}
                            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <FileText className="text-blue-500" /> Basic Information
                                </h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Docket Number</label>
                                        <input
                                            name="docket_number"
                                            value={formData.docket_number}
                                            onChange={handleChange}
                                            className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.docket_number ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-blue-400'}`}
                                            placeholder="e.g. 559789"
                                        />
                                        {errors.docket_number && <p className="text-xs text-red-500 font-medium ml-1">{errors.docket_number}</p>}
                                    </div>
                                </div>
                            </section>

                            {/* Customer Details */}
                            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <UserCheck className="text-green-500" /> Customer Details
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Customer Name</label>
                                        <input
                                            name="customer_name"
                                            value={formData.customer_name}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Customer Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Customer Phone</label>
                                        <input
                                            name="customer_phone"
                                            value={formData.customer_phone}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Customer Phone"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Address Line 1</label>
                                        <input
                                            name="customer_address_line1"
                                            value={formData.customer_address_line1}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Address Line 1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Address Line 2</label>
                                        <input
                                            name="customer_address_line2"
                                            value={formData.customer_address_line2}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Address Line 2"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">City</label>
                                        <input
                                            name="customer_city"
                                            value={formData.customer_city}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter City Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Pincode</label>
                                        <input
                                            name="customer_pincode"
                                            value={formData.customer_pincode}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Pincode"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <input
                                            name="customer_email"
                                            type="email"
                                            value={formData.customer_email}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Email"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Date of Birth</label>
                                        <input
                                            name="customer_dob"
                                            type="date"
                                            value={formData.customer_dob}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Vehicle Information */}
                            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Car className="text-indigo-500" /> Vehicle Information
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Manufacturer</label>
                                        <input
                                            name="manufacturer"
                                            value={formData.manufacturer}
                                            onChange={handleChange}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.manufacturer ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                            placeholder="Enter Manufacturer Name"
                                        />
                                        {errors.manufacturer && <p className="text-xs text-red-500 ml-1">{errors.manufacturer}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Model *</label>
                                        <input
                                            name="model"
                                            value={formData.model}
                                            onChange={handleChange}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.model ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                            placeholder="Enter Model Name"
                                        />
                                        {errors.model && <p className="text-xs text-red-500 ml-1">{errors.model}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Color</label>
                                        <input
                                            name="color"
                                            value={formData.color}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Color"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Manufacture Year *</label>
                                        <input
                                            name="year"
                                            type="number"
                                            value={formData.year}
                                            onChange={handleChange}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.year ? 'border-red-500' : 'border-slate-300'}`}
                                            placeholder="Enter Manufacture Year"
                                        />
                                        {errors.year && <p className="text-xs text-red-500">{errors.year}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Fuel Type</label>
                                        <input
                                            name="fuel_type"
                                            value={formData.fuel_type}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Fuel Type"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Registration Number *</label>
                                        <input
                                            name="registration_number"
                                            value={formData.registration_number}
                                            onChange={handleChange}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.registration_number ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                            placeholder="Enter Registration Number"
                                        />
                                        {errors.registration_number && <p className="text-xs text-red-500 ml-1">{errors.registration_number}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Chassis Number</label>
                                        <div className="flex gap-2">
                                            <input
                                                name="vin"
                                                value={formData.vin}
                                                onChange={handleChange}
                                                className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.vin ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                                placeholder="Enter Chassis Number"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleVinAutoFill}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
                                            >
                                                Auto-Fill
                                            </button>
                                        </div>
                                        {errors.vin && <p className="text-xs text-red-500 ml-1">{errors.vin}</p>}
                                    </div>
                                    {/* <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Chassis Number</label>
                                        <input
                                            name="vin"
                                            value={formData.vin}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Chassis Number"
                                        />
                                    </div> */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Engine Number</label>
                                        <input
                                            name="engine_number"
                                            value={formData.engine_number}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Engine Number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Insurance Expiry Date *</label>
                                        <input
                                            name="insurance_expiry"
                                            type="date"
                                            value={formData.insurance_expiry}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">HP</label>
                                        <input
                                            name="hp"
                                            value={formData.hp}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter HP Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Running Kilometer</label>
                                        <input
                                            name="running_km"
                                            type="number"
                                            value={formData.running_km}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Running Kilometer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Vehicle Price / Cost Price</label>
                                        <input
                                            name="price"
                                            type="number"
                                            value={formData.price || ''}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Vehicle Price"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex justify-end">
                                        <Button
                                            type="button"
                                            onClick={() => handlePartialSave('pricing')}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                                            disabled={loading}
                                        >
                                            <Save size={16} /> Save Pricing Detail
                                        </Button>
                                    </div>

                                    {(transactionType === 'Purchase' || transactionType === 'Sale') && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Renovation Cost</label>
                                            <input
                                                name="renovation_cost"
                                                type="number"
                                                value={formData.renovation_cost || ''}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Enter Renovation Cost"
                                            />
                                        </div>
                                    )}

                                    {/* Profit Calculation Display */}
                                    {transactionType === 'Sale' && (
                                        <div className="md:col-span-2 p-4 bg-green-50 rounded-xl border border-green-200 mt-4">
                                            <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                                                <DollarSign size={18} /> Profit Calculation
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-slate-500 block">Buying Price</span>
                                                    <span className="font-mono font-bold">₹{Number(formData.buying_price || 0).toLocaleString()}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 block">Renovation</span>
                                                    <span className="font-mono font-bold text-orange-600">+ ₹{Number(formData.renovation_cost || 0).toLocaleString()}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 block">Selling Price</span>
                                                    <span className="font-mono font-bold text-blue-600">₹{Number(formData.price || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="bg-white p-2 rounded shadow-sm">
                                                    <span className="text-slate-500 block font-bold">Net Profit</span>
                                                    <span className={`font-mono font-bold text-lg ${(Number(formData.price || 0) - (Number(formData.buying_price || 0) + Number(formData.renovation_cost || 0))) >= 0
                                                        ? 'text-green-600' : 'text-red-500'
                                                        }`}>
                                                        ₹{(Number(formData.price || 0) - (Number(formData.buying_price || 0) + Number(formData.renovation_cost || 0))).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Additional Details */}
                            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <FilePlus className="text-orange-500" /> Additional Details
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Executive Branch *</label>
                                        <input
                                            name="executive_branch"
                                            value={formData.executive_branch}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Executive Branch Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Executive name</label>
                                        <input
                                            name="executive_name"
                                            value={formData.executive_name}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Executive Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Executive Number</label>
                                        <input
                                            name="executive_number"
                                            value={formData.executive_number}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Executive Number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Insurance Company *</label>
                                        <input
                                            name="insurance_company"
                                            value={formData.insurance_company}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Insurance Company Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">RTO Code</label>
                                        <input
                                            name="rto_code"
                                            value={formData.rto_code}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter RTO Code"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">RTO</label>
                                        <input
                                            name="rto_name"
                                            value={formData.rto_name}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter RTO Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Parsing Status</label>
                                        <select
                                            name="rto_passing_status"
                                            value={formData.rto_passing_status}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Select Parsing Status</option>
                                            <option>Pending</option>
                                            <option>In-Progress</option>
                                            <option>Completed</option>
                                            <option>Rejected</option>
                                            <option>Document Error</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Number Plate Type</label>
                                        <select
                                            name="plate_type"
                                            value={formData.plate_type}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Select Number Plate Type</option>
                                            <option>Normal</option>
                                            <option>Choice (VIP)</option>
                                            <option>High-Security (HSRP)</option>
                                            <option>Temporary</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Scheme</label>
                                        <input
                                            name="scheme"
                                            value={formData.scheme}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Scheme"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Broker Name</label>
                                        <input
                                            name="broker_name"
                                            value={formData.broker_name}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Broker Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Broker number</label>
                                        <input
                                            name="broker_number"
                                            value={formData.broker_number}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Broker number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Broker Brokerage</label>
                                        <input
                                            name="brokerage_amount"
                                            type="number"
                                            value={formData.brokerage_amount}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Broker Brokerage"
                                        />
                                    </div>
                                    <div className="space-y-2 lg:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">Other Remarks</label>
                                        <textarea
                                            name="other_remarks"
                                            value={formData.other_remarks}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Other Remarks"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="border-t border-slate-100"></div>

                            {/* Documents Section for New Cars */}
                            <section className="bg-blue-50/30 p-6 rounded-lg border border-blue-100">
                                <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                                    <FileText className="text-blue-600" /> Documents (KYC)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {DOCUMENT_CONFIG.map((doc) => {
                                        if (doc.dualSided) {
                                            return (
                                                <div key={doc.key} className={`space-y-4 p-4 border rounded-xl bg-white ${files[doc.key] ? 'border-green-500 ring-2 ring-green-100' : 'border-blue-200'} transition-all hover:shadow-md md:col-span-2 lg:col-span-3`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-bold text-slate-700">{doc.label} (Front & Back)</label>
                                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Merged to PDF</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {files[doc.key] && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePreview(files[doc.key])}
                                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                    title="Preview Merged PDF"
                                                                >
                                                                    <Eye size={20} />
                                                                </button>
                                                            )}
                                                            {files[doc.key] && <CheckCircle className="text-green-500 h-5 w-5" />}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-semibold text-slate-500 uppercase">Front Side</span>
                                                                <Camera className="w-4 h-4 text-slate-400" />
                                                            </div>
                                                            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleMultipartChange(e, doc.key, 'front')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-semibold text-slate-500 uppercase">Back Side</span>
                                                                <Camera className="w-4 h-4 text-slate-400" />
                                                            </div>
                                                            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleMultipartChange(e, doc.key, 'back')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={doc.key} className={`space-y-2 p-4 border rounded-xl bg-white ${files[doc.key] ? 'border-green-500 ring-2 ring-green-100' : 'border-blue-200'} transition-all hover:shadow-md`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-sm font-bold text-slate-700">{doc.label}</label>
                                                        {files[doc.key] && <CheckCircle className="text-green-500 h-5 w-5" />}
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept="image/*,application/pdf"
                                                            capture="environment"
                                                            onChange={(e) => handleFileChange(e, doc.key)}
                                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors pr-8"
                                                        />
                                                        <Camera className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            </section>
                        </>
                    )}

                    {/* MANAGE DOCUMENTS (Dynamic - All Types) */}
                    <section className="bg-slate-50 p-6 rounded-lg border border-slate-200 mt-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 uppercase">MANAGE DOCUMENTS</h3>

                        <div className="space-y-4">
                            {/* Input Area */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Document Name</label>
                                    <input
                                        type="text"
                                        value={newDocName}
                                        onChange={(e) => setNewDocName(e.target.value)}
                                        className="w-full p-2 border rounded-md text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Enter document name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Upload Document</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            onChange={(e) => setNewDocFile(e.target.files[0])}
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors bg-white border border-slate-200 rounded-md p-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="button"
                                onClick={handleAddCustomDoc}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                            >
                                Add Document
                            </Button>

                            {/* List of Added Documents */}
                            {customDocs.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-700">Added Documents:</h4>
                                    {customDocs.map((doc, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-white border rounded-md shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-full">
                                                    <FileText className="text-blue-500 w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-900 uppercase">{doc.name}</span>
                                                    <span className="text-xs text-slate-500">{doc.file?.name}</span>
                                                </div>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                onClick={() => handleRemoveCustomDoc(idx)}
                                            >
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {transactionType === 'Purchase' && (
                        <>
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
                                                        <div className="flex items-center gap-2">
                                                            {files[doc.key] && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePreview(files[doc.key])}
                                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                    title="Preview Merged PDF"
                                                                >
                                                                    <Eye size={20} />
                                                                </button>
                                                            )}
                                                            {files[doc.key] && <CheckCircle className="text-green-500 h-5 w-5" />}
                                                        </div>
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

                            {/* Car Images Section for Purchase */}
                            <section className="bg-purple-50/30 p-6 rounded-lg border border-purple-100">
                                <h3 className="text-xl font-bold text-purple-900 mb-6 flex items-center gap-2">
                                    <Upload className="text-purple-600" /> Car Images
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 p-4 border rounded-xl bg-white border-purple-200 transition-all hover:shadow-md">
                                        <label className="text-sm font-bold text-slate-700 block mb-2">Main Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(e) => handleFileChange(e, 'Main_Image')}
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2 p-4 border rounded-xl bg-white border-purple-200 transition-all hover:shadow-md">
                                        <label className="text-sm font-bold text-slate-700 block mb-2">Additional Images</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            multiple
                                            onChange={(e) => handleFileChange(e, 'Additional_Images')}
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition-colors"
                                        />
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {/* Sell Old Car Form */}
                    {transactionType === 'Sale' && (
                        <>
                            {/* Basic Information */}
                            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <FileText className="text-blue-500" /> Basic Information
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Docket Number</label>
                                        <input
                                            name="docket_number"
                                            value={formData.docket_number}
                                            onChange={handleChange}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.docket_number ? 'border-red-500' : 'border-slate-300'}`}
                                            placeholder="e.g. 735365"
                                        />
                                        {errors.docket_number && <p className="text-xs text-red-500">{errors.docket_number}</p>}
                                    </div>
                                </div>
                            </section>

                            {/* Customer Details */}
                            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <UserCheck className="text-green-500" /> Customer Details
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Customer Name</label>
                                        <input
                                            name="customer_name"
                                            value={formData.customer_name}
                                            onChange={handleChange}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.customer_name ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                            placeholder="Enter Customer Name"
                                        />
                                        {errors.customer_name && <p className="text-xs text-red-500 ml-1">{errors.customer_name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Customer Phone</label>
                                        <input
                                            name="customer_phone"
                                            value={formData.customer_phone}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Customer Phone"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Address Line 1</label>
                                        <input
                                            name="customer_address_line1"
                                            value={formData.customer_address_line1}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Address Line 1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Address Line 2</label>
                                        <input
                                            name="customer_address_line2"
                                            value={formData.customer_address_line2}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Address Line 2"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">City</label>
                                        <input
                                            name="customer_city"
                                            value={formData.customer_city}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter City Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Pincode</label>
                                        <input
                                            name="customer_pincode"
                                            value={formData.customer_pincode}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Pincode"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Email</label>
                                        <input
                                            name="customer_email"
                                            type="email"
                                            value={formData.customer_email}
                                            onChange={handleChange}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.customer_email ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                            placeholder="Enter Email"
                                        />
                                        {errors.customer_email && <p className="text-xs text-red-500 ml-1">{errors.customer_email}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Date of Birth</label>
                                        <input
                                            name="customer_dob"
                                            type="date"
                                            value={formData.customer_dob}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Vehicle Information */}
                            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Car className="text-indigo-500" /> Vehicle Information
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Manufacturer *</label>
                                        <input
                                            name="manufacturer"
                                            value={formData.manufacturer}
                                            onChange={handleChange}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.manufacturer ? 'border-red-500' : 'border-slate-300'}`}
                                            placeholder="Enter Manufacturer Name"
                                        />
                                        {errors.manufacturer && <p className="text-xs text-red-500">{errors.manufacturer}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Model</label>
                                        <input
                                            name="model"
                                            value={formData.model}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Model Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Color</label>
                                        <input
                                            name="color"
                                            value={formData.color}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Color"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Manufacture Year *</label>
                                        <input
                                            name="year"
                                            type="number"
                                            value={formData.year}
                                            onChange={handleChange}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.year ? 'border-red-500' : 'border-slate-300'}`}
                                            placeholder="Enter Manufacture Year"
                                        />
                                        {errors.year && <p className="text-xs text-red-500">{errors.year}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Fuel Type</label>
                                        <input
                                            name="fuel_type"
                                            value={formData.fuel_type}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Fuel Type"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Registration Number *</label>
                                        <input
                                            name="registration_number"
                                            value={formData.registration_number}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Registration Number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Chassis Number</label>
                                        <input
                                            name="vin"
                                            value={formData.vin}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Chassis Number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Engine Number</label>
                                        <input
                                            name="engine_number"
                                            value={formData.engine_number}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Engine Number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Insurance Expiry Date *</label>
                                        <input
                                            name="insurance_expiry"
                                            type="date"
                                            value={formData.insurance_expiry}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">HP</label>
                                        <input
                                            name="hp"
                                            value={formData.hp}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter HP Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Running Kilometer</label>
                                        <input
                                            name="running_km"
                                            type="number"
                                            value={formData.running_km}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter running kilometer"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Additional Details */}
                            <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <FilePlus className="text-orange-500" /> Additional Details
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Executive Branch *</label>
                                        <input
                                            name="executive_branch"
                                            value={formData.executive_branch}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Executive Branch Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">parivar's Executive name</label>
                                        <input
                                            name="executive_name"
                                            value={formData.executive_name}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter parivar's Executive Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Executive Number</label>
                                        <input
                                            name="executive_number"
                                            value={formData.executive_number}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Executive Number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Insurance Company *</label>
                                        <input
                                            name="insurance_company"
                                            value={formData.insurance_company}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Insurance Company Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">RTO Code</label>
                                        <input
                                            name="rto_code"
                                            value={formData.rto_code}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter RTO Code"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">RTO</label>
                                        <input
                                            name="rto_name"
                                            value={formData.rto_name}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter RTO Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Parsing Status</label>
                                        <select
                                            name="rto_passing_status"
                                            value={formData.rto_passing_status}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Select Parsing Status</option>
                                            <option>Pending</option>
                                            <option>In-Progress</option>
                                            <option>Completed</option>
                                            <option>Rejected</option>
                                            <option>Document Error</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Number Plate Type</label>
                                        <select
                                            name="plate_type"
                                            value={formData.plate_type}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Select Number Plate Type</option>
                                            <option>Normal</option>
                                            <option>Choice (VIP)</option>
                                            <option>High-Security (HSRP)</option>
                                            <option>Temporary</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Scheme</label>
                                        <input
                                            name="scheme"
                                            value={formData.scheme}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Scheme"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Broker Name</label>
                                        <input
                                            name="broker_name"
                                            value={formData.broker_name}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Broker Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Broker number</label>
                                        <input
                                            name="broker_number"
                                            value={formData.broker_number}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Broker number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Broker Brokerage</label>
                                        <input
                                            name="brokerage_amount"
                                            type="number"
                                            value={formData.brokerage_amount}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Broker Brokerage"
                                        />
                                    </div>
                                    <div className="space-y-2 lg:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">Other Remarks</label>
                                        <textarea
                                            name="other_remarks"
                                            value={formData.other_remarks}
                                            onChange={handleChange}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Enter Other Remarks"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Documents Section for Sale */}
                            <section className="bg-green-50/30 p-6 rounded-lg border border-green-100">
                                <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                                    <FileText className="text-green-600" /> Documents
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {DOCUMENT_CONFIG.map((doc) => {
                                        if (doc.dualSided) {
                                            return (
                                                <div key={doc.key} className={`space-y-4 p-4 border rounded-xl bg-white ${files[doc.key] ? 'border-green-500 ring-2 ring-green-100' : 'border-green-200'} transition-all hover:shadow-md md:col-span-2 lg:col-span-3`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-bold text-slate-700">{doc.label} (Front & Back)</label>
                                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Merged to PDF</span>
                                                        </div>
                                                        {files[doc.key] && <CheckCircle className="text-green-500 h-5 w-5" />}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <span className="text-xs font-semibold text-slate-500 uppercase">Front Side</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                capture="environment"
                                                                onChange={(e) => handleMultipartChange(e, doc.key, 'front')}
                                                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <span className="text-xs font-semibold text-slate-500 uppercase">Back Side</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                capture="environment"
                                                                onChange={(e) => handleMultipartChange(e, doc.key, 'back')}
                                                                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-slate-400 italic mt-2">
                                                        * Uploading both sides will automatically merge them into a single PDF document.
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={doc.key} className={`space-y-2 p-4 border rounded-xl bg-white ${files[doc.key] ? 'border-green-500 ring-2 ring-green-100' : 'border-green-200'} transition-all hover:shadow-md`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-sm font-bold text-slate-700">{doc.label}</label>
                                                        {files[doc.key] && <CheckCircle className="text-green-500 h-5 w-5" />}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*,application/pdf"
                                                        capture="environment"
                                                        onChange={(e) => handleFileChange(e, doc.key)}
                                                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition-colors"
                                                    />
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            </section>

                            {/* Car Images Section for Sale */}
                            <section className="bg-purple-50/30 p-6 rounded-lg border border-purple-100">
                                <h3 className="text-xl font-bold text-purple-900 mb-6 flex items-center gap-2">
                                    <Upload className="text-purple-600" /> Car Images
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 p-4 border rounded-xl bg-white border-purple-200 transition-all hover:shadow-md">
                                        <label className="text-sm font-bold text-slate-700 block mb-2">Main Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(e) => handleFileChange(e, 'Main_Image')}
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2 p-4 border rounded-xl bg-white border-purple-200 transition-all hover:shadow-md">
                                        <label className="text-sm font-bold text-slate-700 block mb-2">Additional Images</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            multiple
                                            onChange={(e) => handleFileChange(e, 'Additional_Images')}
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition-colors"
                                        />
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
