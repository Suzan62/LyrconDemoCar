import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, User, FileText, Smartphone, ArrowRight, Download, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { cn } from '../../lib/utils';

export default function KYCWorkflow() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [faceImage, setFaceImage] = useState(null);
    const videoRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            // Fallback for demo if no camera
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    useEffect(() => {
        if (step === 2 || step === 3) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [step]);

    const capturePhoto = (type) => {
        setLoading(true);
        // Simulate capture processing
        setTimeout(() => {
            const mockUrl = type === 'id'
                ? "https://placehold.co/600x400/png?text=Captured+ID"
                : "https://placehold.co/400x400/png?text=Face+Verified";

            if (type === 'id') setCapturedImage(mockUrl);
            else setFaceImage(mockUrl);

            setLoading(false);
            setStep(prev => prev + 1);
        }, 1000);
    };

    const Stepper = () => {
        const steps = [
            { num: 1, label: "Details", icon: User },
            { num: 2, label: "ID Scan", icon: FileText },
            { num: 3, label: "Face Verify", icon: Smartphone },
            { num: 4, label: "Complete", icon: CheckCircle2 },
        ];

        return (
            <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 -z-10 transition-all duration-300"
                    style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                />
                {steps.map((s) => (
                    <div key={s.num} className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                            step >= s.num
                                ? "border-green-500 bg-green-50 text-green-600"
                                : "border-gray-300 text-gray-400"
                        )}>
                            <s.icon size={20} />
                        </div>
                        <span className={cn(
                            "text-xs font-medium",
                            step >= s.num ? "text-foreground" : "text-muted-foreground"
                        )}>{s.label}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold">Mobile KYC Verification</h2>
                <p className="text-muted-foreground">Complete the steps to verify customer identity.</p>
            </div>

            <Stepper />

            <Card>
                <CardContent className="pt-6">
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-lg font-semibold">Customer Details</h3>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone Number</label>
                                    <input type="tel" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="+1 (555) 000-0000" />
                                </div>
                                <Button className="w-full mt-4" onClick={() => setStep(2)}>
                                    Continue to ID Scan <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 text-center animate-in fade-in">
                            <h3 className="text-lg font-semibold">Scan Government ID</h3>
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                                {/* Camera View */}
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 border-2 border-white/50 m-8 rounded-lg pointer-events-none">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white" />
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white" />
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white" />
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white" />
                                </div>
                                <Button
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full w-16 h-16 border-4 border-white bg-red-500 hover:bg-red-600 p-0"
                                    onClick={() => capturePhoto('id')}
                                    disabled={loading}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">Align ID within the frame and tap button to capture.</p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 text-center animate-in fade-in">
                            <h3 className="text-lg font-semibold">Face Verification</h3>
                            <div className="relative aspect-square max-w-sm mx-auto bg-black rounded-full overflow-hidden flex items-center justify-center border-4 border-blue-500">
                                {/* Camera View */}
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                <Button
                                    className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full w-16 h-16 border-4 border-white bg-blue-500 hover:bg-blue-600 p-0"
                                    onClick={() => capturePhoto('face')}
                                    disabled={loading}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">Center your face in the circle.</p>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 text-center animate-in zoom-in">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-green-700">Verification Successful!</h3>
                                <p className="text-muted-foreground">Identity verified with 98% confidence.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border rounded-md p-2">
                                    <img src={capturedImage} alt="ID" className="w-full h-auto rounded" />
                                    <span className="text-xs text-muted-foreground mt-1 block">ID Document</span>
                                </div>
                                <div className="border rounded-md p-2">
                                    <img src={faceImage} alt="Face" className="w-full h-auto rounded" />
                                    <span className="text-xs text-muted-foreground mt-1 block">Live Face</span>
                                </div>
                            </div>

                            <Button className="w-full gap-2" variant="outline">
                                <Download size={16} /> Download Compliance Report
                            </Button>

                            <Button variant="ghost" onClick={() => { setStep(1); setCapturedImage(null); setFaceImage(null); }}>
                                Start New Verification
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
