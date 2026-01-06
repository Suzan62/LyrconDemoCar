import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ToggleLeft, Bell, Lock, Globe } from 'lucide-react';

export default function Settings() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Manage your display and notification settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                        <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive daily summaries</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-16">On</Button>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                        <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Language</p>
                                <p className="text-sm text-muted-foreground">English (US)</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm">Change</Button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Privacy Mode</p>
                                <p className="text-sm text-muted-foreground">Hide sensitive data in dashboard</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-16">Off</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
