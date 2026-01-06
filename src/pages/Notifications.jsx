import React from 'react';
import { Bell, Check, Clock, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = React.useState([
        { id: 1, title: 'New Inquiry', message: 'Customer John Doe requested a quote.', time: '2 min ago', read: false },
        { id: 2, title: 'Vehicle Sold', message: 'Honda Civic (INV-004) marked as sold.', time: '1 hour ago', read: false },
        { id: 3, title: 'Low Inventory', message: 'Only 2 SUVs remaining in stock.', time: '5 hours ago', read: true },
        { id: 4, title: 'System Update', message: 'Maintenance scheduled for tonight.', time: '1 day ago', read: true },
        { id: 5, title: 'New Registration', message: 'User Jane Smith joined the platform.', time: '2 days ago', read: true },
    ]);

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
                        <p className="text-muted-foreground">Stay updated with latest activities.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleMarkAllRead}>
                        <Check size={16} /> Mark all read
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="text-primary" size={20} />
                        <CardTitle>All Activity</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${!notification.read ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-slate-100'}`}
                            >
                                <div className={`p-2 rounded-full ${!notification.read ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                    <Bell size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-sm font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {notification.title}
                                        </h4>
                                        <span className="flex items-center gap-1 text-xs text-slate-400">
                                            <Clock size={12} /> {notification.time}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
