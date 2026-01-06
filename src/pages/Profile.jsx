import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { User, Mail, Phone, MapPin, Camera, Save, ArrowLeft } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../store/slices/userSlice';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // Optional for feedback

export default function Profile() {
    const user = useSelector(state => state.auth.currentUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        location: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [profilePic, setProfilePic] = useState(null);
    const fileInputRef = useRef(null);

    // Fetch profile on mount
    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Pass email as query param for simplicity (in real app, use token)
                const email = user?.email || "admin@lyrcon.com";
                console.log("Fetching profile for:", email);
                const res = await fetch(`/api/profile?email=${email}`);
                if (res.ok) {
                    const data = await res.json();
                    console.log("Profile data received:", data);
                    setFormData(data);
                } else {
                    const errorText = await res.text();
                    console.error("Profile fetch failed:", res.status, errorText);
                    setError(`Failed to load profile: ${res.statusText}`);
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
                setError(`Network error: ${err.message}. Is backend running?`);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();


        // Load profile pic
        const storedPic = localStorage.getItem(`profilePic_${user?.email}`);
        if (storedPic) {
            setProfilePic(storedPic);
            dispatch(updateUserProfile({ profilePic: storedPic }));
        }
    }, [user, dispatch]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setProfilePic(base64String);
                localStorage.setItem(`profilePic_${user?.email}`, base64String);
                dispatch(updateUserProfile({ profilePic: base64String }));
                toast.success("Profile picture updated");
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleSave = async () => {
        // Simple Validation
        if (formData.phone && formData.phone.length < 10) {
            setError("Phone number is too short.");
            return;
        }

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const updatedUser = await res.json();
                dispatch(updateUserProfile(updatedUser.user)); // Update Redux
                toast.success("Profile updated successfully");
                setIsEditing(false);
                setError("");
            } else {
                setError("Failed to update profile");
            }
        } catch (err) {
            setError("Network error");
        }
    };

    const confirmDelete = async () => {
        try {
            const email = user?.email || "admin@lyrcon.com";
            const res = await fetch(`/api/profile?email=${email}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success("Account deleted successfully");
                dispatch(logout());
                navigate('/login');
            } else {
                const errorText = await res.text();
                toast.error(`Failed to delete account`);
                console.error("Delete failed:", errorText);
            }
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Network error during deletion");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error("Please fill in all password fields");
            return;
        }

        try {
            const email = user?.email || "admin@lyrcon.com";
            const res = await fetch('/api/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, ...passwordData })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setIsChangingPassword(false);
                setPasswordData({ currentPassword: "", newPassword: "" });
            } else {
                toast.error(data.message || "Failed to update password");
            }
        } catch (err) {
            toast.error("Network error");
        }
    };

    if (loading) return <div>Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                    <ArrowLeft size={24} />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
                    <p className="text-muted-foreground">Manage your account settings and preferences.</p>
                </div>
            </div>
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 h-full">
                    <CardHeader>
                        <CardTitle>Profile Picture</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <div
                            className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center relative overflow-hidden group border-4 border-white shadow-lg cursor-pointer"
                            onClick={triggerFileInput}
                        >
                            {profilePic ? (
                                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={80} className="text-gray-300" />
                            )}

                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white w-8 h-8" />
                                <span className="text-white text-xs absolute bottom-8 font-medium">Change</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        <div className="text-center">
                            <h3 className="font-medium text-lg">{formData.name}</h3>
                            <p className="text-sm text-muted-foreground">{formData.role || user?.role}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div className="flex flex-col gap-1">
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Update your personal details here.</CardDescription>
                            </div>
                            {!isEditing && (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                    Edit Details
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Full Name</label>
                                {isEditing ? (
                                    <input name="name" value={formData.name} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                ) : (
                                    <div className="p-2 bg-gray-50 rounded-md flex items-center gap-2"><User size={16} className="text-muted-foreground" /> {formData.name}</div>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Email Address</label>
                                {isEditing ? (
                                    <input name="email" value={formData.email} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                ) : (
                                    <div className="p-2 bg-gray-50 rounded-md flex items-center gap-2"><Mail size={16} className="text-muted-foreground" /> {formData.email}</div>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Phone Number</label>
                                {isEditing ? (
                                    <input name="phone" value={formData.phone} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                ) : (
                                    <div className="p-2 bg-gray-50 rounded-md flex items-center gap-2"><Phone size={16} className="text-muted-foreground" /> {formData.phone}</div>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Location</label>
                                {isEditing ? (
                                    <input name="location" value={formData.location} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                                ) : (
                                    <div className="p-2 bg-gray-50 rounded-md flex items-center gap-2"><MapPin size={16} className="text-muted-foreground" /> {formData.location}</div>
                                )}
                            </div>
                        </CardContent>
                        {isEditing && (
                            <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                            </CardFooter>
                        )}
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div className="flex flex-col gap-1">
                                <CardTitle>Security</CardTitle>
                                <CardDescription>Manage your password and security settings.</CardDescription>
                            </div>
                            {!isChangingPassword && (
                                <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                                    Change Password
                                </Button>
                            )}
                        </CardHeader>
                        {isChangingPassword && (
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                            </CardContent>
                        )}
                        {isChangingPassword && (
                            <CardFooter className="flex justify-end gap-2 border-t pt-4">
                                <Button variant="ghost" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                                <Button onClick={handlePasswordChange}>Update Password</Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                    <CardDescription>Manage your account status and access.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium">Delete Account</h4>
                        <p className="text-sm text-muted-foreground">Permanently remove your account and all data.</p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>Delete Account</Button>
                </CardContent>
            </Card>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Account"
                className="max-w-md"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm border border-red-100 flex items-start gap-3">
                        <div className="mt-0.5">⚠️</div>
                        <div>
                            <p className="font-bold">Warning: This action is irreversible.</p>
                            <p className="mt-1">
                                Your account, settings, and all associated data will be permanently removed.
                                You will not be able to recover this information.
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">
                        Please confirm that you would like to proceed with deleting your account (<strong>{user?.email}</strong>).
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 mt-6">
                    <Button data-testid="cancel-delete-btn" variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={confirmDelete}>Yes, Delete Account</Button>
                </div>
            </Modal>
        </div>
    );
}
