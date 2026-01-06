import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, UserPlus, Edit3 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function AddUser() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    console.log("AddUser Rendered. ID:", id, "EditMode:", isEditMode);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'User' // Default
    });

    useEffect(() => {
        if (isEditMode) {
            fetchUser();
        }
    }, [id]);

    const fetchUser = async () => {
        try {
            const singleRes = await fetch(`/api/users/${id}`);
            if (singleRes.ok) {
                const data = await singleRes.json();
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    password: '', // Don't show password
                    role: data.role || 'User'
                });
            } else {
                toast.error("Failed to fetch user details");
                navigate('/users');
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            toast.error("Name and Email are required");
            return;
        }

        if (!isEditMode && !formData.password) {
            toast.error("Password is required for new users");
            return;
        }

        setLoading(true);
        try {
            const url = isEditMode ? `/api/users/${id}` : '/api/users';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(isEditMode ? "User updated successfully!" : "User added successfully!");
                navigate('/users');
            } else {
                toast.error(data.message || "Failed to save user");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" onClick={() => navigate('/users')} className="shrink-0">
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">{isEditMode ? 'Edit User' : 'Add New User'}</h1>
                    <p className="text-sm text-slate-500">{isEditMode ? 'Update user details and permissions.' : 'Create a new user account with specific permissions.'}</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-md">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            {isEditMode ? <Edit3 className="h-5 w-5 text-blue-600" /> : <UserPlus className="h-5 w-5 text-blue-600" />}
                        </div>
                        <CardTitle className="text-base font-semibold text-slate-700">{isEditMode ? 'Edit User Details' : 'User Details'}</CardTitle>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">Email Address <span className="text-red-500">*</span></label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@example.com"
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">Password {!isEditMode && <span className="text-red-500">*</span>}</label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={isEditMode ? "Leave blank to keep unchanged" : "Create a secure password"}
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-slate-700">Role <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="flex h-10 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                >
                                    <option value="User">User (Standard Access)</option>
                                    <option value="Manager">Manager (limited Access)</option>
                                    <option value="Admin">Admin (Full Access)</option>
                                    <option value="Insurance">Insurance (Insurance Module Only)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 py-4">
                        <Button type="button" variant="outline" onClick={() => navigate('/users')}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                            {loading ? (isEditMode ? "Updating..." : "Adding...") : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> {isEditMode ? "Update User" : "Add User"}
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
