import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend } from 'recharts';

import { Loader2, AlertCircle } from 'lucide-react';

const SalesForecastChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/ml/forecast')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load forecast');
                return res.json();
            })
            .then(resData => {
                if (resData.status === 'insufficient_data') {
                    // friendly empty state
                    setData([]);
                    setLoading(false);
                    return;
                }
                if (resData.status === 'error') {
                    throw new Error(resData.message);
                }

                // Merge history and forecast
                const history = resData.history.map(item => ({
                    ...item,
                    type: 'history',
                    sales: item.sales,
                    prediction: null,
                    range: [item.sales, item.sales] // Flatten range for history
                }));

                const forecast = resData.forecast.map(item => ({
                    ...item,
                    type: 'forecast',
                    sales: null,
                    prediction: item.prediction,
                    range: [item.lower_bound, item.upper_bound]
                }));

                setData([...history, ...forecast]);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[350px] border rounded-lg bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Training AI Model...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[350px] border border-red-200 bg-red-50 rounded-lg text-red-600">
                <AlertCircle className="h-10 w-10 mb-2" />
                <p className="font-medium">Forecast Unavailable</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (data.length === 0 && !loading && !error) {
        return (
            <div className="flex flex-col items-center justify-center h-[350px] border rounded-lg bg-slate-50 text-slate-500">
                <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                <p className="font-medium">Insufficient Data for Forecasting</p>
                <p className="text-xs max-w-[250px] text-center mt-1">We need at least 10 months of sales history to generate AI predictions.</p>
            </div>
        );
    }


    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(val) => `₹${val / 1000}k`} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        formatter={(value, name) => {
                            if (name === "Confidence Interval") {
                                return [`Min: ₹${value[0].toLocaleString()}, Max: ₹${value[1].toLocaleString()}`, "Confidence"];
                            }
                            return [`₹${value.toLocaleString()}`, name === 'sales' ? 'Actual Sales' : 'Forecast'];
                        }}
                        labelStyle={{ color: '#333' }}
                    />
                    <Legend />

                    {/* Confidence Interval Area */}
                    <Area
                        type="monotone"
                        dataKey="range"
                        stroke="none"
                        fill="#93c5fd"
                        fillOpacity={0.3}
                        name="Confidence Interval"
                    />

                    {/* Historical Sales Line */}
                    <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Actual Sales"
                        connectNulls
                    />

                    {/* Forecast Line */}
                    <Line
                        type="monotone"
                        dataKey="prediction"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4 }}
                        name="AI Forecast"
                        connectNulls
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesForecastChart;
