import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Edit } from 'lucide-react';

export default function ViewInquiry() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [inquiry, setInquiry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInquiry = async () => {
            try {
                const response = await fetch(`/api/inquiries/${id}`);
                if (!response.ok) throw new Error('Inquiry not found');
                const data = await response.json();
                setInquiry(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInquiry();
    }, [id]);

    if (loading) return <div className="p-8 text-center">Loading inquiry details...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!inquiry) return <div className="p-8 text-center">Inquiry not found.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/inquiries')} className="mr-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h2 className="text-xl md:text-3xl font-bold tracking-tight">Inquiry Details</h2>
                        <div className="text-sm text-muted-foreground">ID: #{inquiry.id}</div>
                    </div>
                </div>
                <Button
                    onClick={() => navigate('/inquiries/create', { state: { inquiry } })}
                    className="flex items-center gap-2"
                >
                    <Edit size={16} /> Edit Inquiry
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-lg">{inquiry.customer}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Contact Method</label>
                            <p className="text-lg capitalize">{inquiry.contactMethod}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-lg">{inquiry.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-lg">{inquiry.customerPhone}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Inquiry Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Vehicle of Interest</label>
                            <p className="text-lg">{inquiry.vehicle}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Source</label>
                            <p className="text-lg capitalize">{inquiry.source}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${inquiry.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                                }`}>
                                {inquiry.status?.toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Date Created</label>
                            <p className="text-lg">{inquiry.date}</p>
                        </div>
                    </div>
                    <div className="pt-4">
                        <label className="text-sm font-medium text-muted-foreground">Additional Notes</label>
                        <p className="mt-1 p-3 bg-slate-50 rounded-md whitespace-pre-wrap">
                            {inquiry.notes || "No additional notes found."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
