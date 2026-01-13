import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Car, DollarSign, Tag, ArrowUp } from 'lucide-react';

export function StatsCards({ stats }) {
    const { total = 0, sold = 0, unsold = 0 } = stats || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Cars</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{total}</h3>
                            <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-medium">
                                <ArrowUp size={14} />
                                <span>+2 New cars this month</span>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <Car size={24} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Sold</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{sold}</h3>
                            <div className="flex items-center gap-1 mt-2 text-slate-400 text-sm">
                                <span>{total > 0 ? Math.round((sold / total) * 100) : 0}% of Total Cars</span>
                            </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Unsold</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{unsold}</h3>
                            <div className="flex items-center gap-1 mt-2 text-slate-400 text-sm">
                                <span>{total > 0 ? Math.round((unsold / total) * 100) : 0}% of Total Cars</span>
                            </div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-red-600">
                            <Tag size={24} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
