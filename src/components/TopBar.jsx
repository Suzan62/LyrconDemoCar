import React, { useState } from 'react';
import { Bell, Search, User, ChevronRight, X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { useLocation, Link } from 'react-router-dom';
import { Card } from './ui/Card';
import { useSelector } from 'react-redux';

export default function TopBar() {
    const location = useLocation();
    const { profile } = useSelector(state => state.user);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'New Inquiry', message: 'Customer John Doe requested a quote.', time: '2 min ago', read: false },
        { id: 2, title: 'Vehicle Sold', message: 'Honda Civic (INV-004) marked as sold.', time: '1 hour ago', read: false },
        { id: 3, title: 'Low Inventory', message: 'Only 2 SUVs remaining in stock.', time: '5 hours ago', read: true },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const getBreadcrumbs = (pathname) => {
        const path = pathname.split('/').filter(Boolean)[0];

        switch (path) {
            case undefined:
                return [{ label: 'Dashboard', path: '/' }];
            case 'inventory':
                return [{ label: 'Inventory', path: null }, { label: 'All New Cars', path: '/inventory' }];
            case 'add-car':
                return [{ label: 'Inventory', path: null }, { label: 'Add New Car', path: '/add-car' }];
            case 'purchase-old-car':
                return [{ label: 'Inventory', path: null }, { label: 'Purchase Old Car', path: '/purchase-old-car' }];
            case 'sell-old-car':
                return [{ label: 'Inventory', path: null }, { label: 'Sell Old Car', path: '/sell-old-car' }];
            case 'kyc':
                return [{ label: 'Mobile KYC', path: '/kyc' }];
            case 'profile':
                return [{ label: 'Profile', path: '/profile' }];
            case 'settings':
                return [{ label: 'Settings', path: '/settings' }];
            case 'inquiries':
                // Check if sub-route
                if (pathname.includes('create')) {
                    return [{ label: 'Inquiries', path: '/inquiries' }, { label: 'New Inquiry', path: pathname }];
                }
                return [{ label: 'Inquiries', path: '/inquiries' }];
            case 'vehicle':
                return [{ label: 'Inventory', path: '/inventory' }, { label: 'Vehicle Details', path: pathname }];
            case 'insurances':
                if (pathname.includes('add')) {
                    return [{ label: 'Insurances', path: '/insurances' }, { label: 'Add Insurance', path: pathname }];
                }
                return [{ label: 'Insurances', path: '/insurances' }];
            default:
                return [{ label: path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard', path: pathname }];
        }
    };

    const breadcrumbs = getBreadcrumbs(location.pathname);

    return (
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 relative z-10 w-full box-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden whitespace-nowrap">
                {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2">
                        {index > 0 && <ChevronRight size={14} />}
                        <span className={index === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
                            {crumb.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <div className="relative w-64 hidden md:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search global..."
                        className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                        )}
                    </Button>

                    {/* Notification Dropdown */}
                    {isNotificationsOpen && (
                        <div className="absolute right-0 top-12 w-80 bg-white border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                            <div className="flex items-center justify-between p-3 border-b bg-slate-50">
                                <span className="font-semibold text-sm">Notifications ({unreadCount})</span>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                                )}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                                        onClick={() => markAsRead(n.id)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-sm ${!n.read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{n.title}</span>
                                            <span className="text-[10px] text-slate-400">{n.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-500">{n.message}</p>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No notifications
                                    </div>
                                )}
                            </div>
                            <div className="p-2 border-t text-center">
                                <Link to="/notifications" className="text-xs text-primary font-medium hover:underline" onClick={() => setIsNotificationsOpen(false)}>
                                    View All Activity
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
                {/* User Profile */}
                <Link to="/profile" className="flex items-center gap-3 pl-4 border-l cursor-pointer hover:bg-slate-50 p-1 rounded-md transition-colors">
                    <div className={`h-9 w-9 rounded-full ${profile?.profilePic ? '' : 'bg-blue-100'} flex items-center justify-center text-blue-600 overflow-hidden`}>
                        {profile?.profilePic ? (
                            <img src={profile.profilePic} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={18} />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-700">{profile?.name || "Admin User"}</p>
                        <p className="text-xs text-slate-500">{profile?.role || "Manager"}</p>
                    </div>
                </Link>
            </div>
        </header>
    );
}
