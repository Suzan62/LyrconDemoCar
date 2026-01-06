import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { DollarSign, ShoppingBag, Users, TrendingUp, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../components/ui/Button';
import { useSelector } from 'react-redux';

// Utility to download CSV
const downloadCSV = (data) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default function Dashboard() {
    const inventory = useSelector(state => state.inventory.items);

    const [dashboardStats, setDashboardStats] = React.useState({
        revenue: 0,
        carsSold: 0,
        loansApproved: 0
    });
    const [salesData, setSalesData] = React.useState([]);

    const [filteredSalesData, setFilteredSalesData] = React.useState([]);
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [dateRange, setDateRange] = React.useState({ start: '', end: '' });

    React.useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            if (res.ok) {
                const data = await res.json();
                setDashboardStats(data.stats);
                setSalesData(data.salesData);
                setFilteredSalesData(data.salesData);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        }
    };

    // Keep filter logic but ensure it defaults to full data
    React.useEffect(() => {
        if (!dateRange.start && !dateRange.end) {
            setFilteredSalesData(salesData);
        }
    }, [salesData]);

    // ... (Filter functions logic remains roughly same but need to ensure variable names match)

    const handleApplyFilter = () => {
        if (!dateRange.start || !dateRange.end) return;

        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);

        // Month map for mock data
        const monthMap = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };

        const filtered = salesData.filter(item => {
            const monthIndex = monthMap[item.name];
            // Assuming current year for the mock data for simplicity
            const currentYear = new Date().getFullYear();
            const itemDate = new Date(currentYear, monthIndex, 1);

            // Normalize start and end
            const normalizeStart = new Date(start.getFullYear(), start.getMonth(), 1);
            const normalizeEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0); // End of month

            return itemDate >= normalizeStart && itemDate <= normalizeEnd;
        });

        setFilteredSalesData(filtered);
        setIsFilterOpen(false);
    };

    const handleResetFilter = () => {
        setDateRange({ start: '', end: '' });
        setFilteredSalesData(salesData);
        setIsFilterOpen(false);
    };

    // Get recent sales from inventory (mock logic: treating 'Sold' items as recent sales)
    const recentSales = inventory.filter(c => c.status === 'Sold').slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center gap-2 relative">
                    <Button
                        variant="outline"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                    >
                        Custom Range
                    </Button>
                    {isFilterOpen && (
                        <div className="absolute top-12 right-0 bg-white border rounded-lg shadow-lg p-4 z-50 w-72">
                            <h4 className="font-semibold mb-2">Select Range</h4>
                            <div className="space-y-2 mb-4">
                                <div>
                                    <label className="text-xs text-gray-500">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded px-2 py-1 text-sm"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">End Date</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded px-2 py-1 text-sm"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={handleResetFilter}>Reset</Button>
                                <Button size="sm" onClick={handleApplyFilter}>Apply</Button>
                            </div>
                        </div>
                    )}
                    <Button className="gap-2" onClick={() => downloadCSV(salesData)}>
                        <Download size={16} /> Download Report
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${dashboardStats.revenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground flex items-center text-green-600">
                            <span className="font-bold mr-1">+20.1%</span> from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cars Sold</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{dashboardStats.carsSold}</div>
                        <p className="text-xs text-muted-foreground flex items-center text-green-600">
                            <span className="font-bold mr-1">+15%</span> from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Loans Approved</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{dashboardStats.loansApproved}</div>
                        <p className="text-xs text-muted-foreground flex items-center text-red-600">
                            <span className="font-bold mr-1">-4%</span> from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Forecasting</CardTitle>
                        <CardDescription>
                            AI-powered sales prediction for Q3 2024.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={filteredSalesData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#007bff" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#007bff" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="sales" stroke="#007bff" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} name="Historic Sales" />
                                <Area type="monotone" dataKey="prediction" stroke="#82ca9d" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPred)" strokeWidth={2} name="AI Prediction" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Sales Performance</CardTitle>
                        <CardDescription>
                            Recent 'Sold' transactions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentSales.length > 0 ? recentSales.map((sale, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{sale.year} {sale.make} {sale.model}</p>
                                        <p className="text-sm text-muted-foreground">
                                            VIN: {sale.id}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">+${sale.price.toLocaleString()}</div>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground py-8">No recent sales found.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
