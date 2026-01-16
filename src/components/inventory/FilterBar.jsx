import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Calendar, Search } from 'lucide-react';

export function FilterBar({ filters, setFilters, onSearch }) {

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Card className="mb-6 shadow-sm border-slate-200 overflow-visible">
            <CardContent className="p-6">
                <div className="flex flex-wrap items-end gap-4 lg:gap-6">

                    {/* Booking Date Range */}
                    {/* <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[320px]">
                        <label className="text-sm font-bold text-slate-800 uppercase">Booking Date</label>
                        <div className="flex flex-col xs:flex-row items-center gap-2">
                            <div className="flex flex-col gap-1 w-full flex-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">From:</span>
                                <Input
                                    type="date"
                                    name="dateFrom"
                                    value={filters.dateFrom || ''}
                                    onChange={handleChange}
                                    className="w-full h-10 text-xs border-slate-200 rounded-lg focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1 w-full flex-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">To:</span>
                                <Input
                                    type="date"
                                    name="dateTo"
                                    value={filters.dateTo || ''}
                                    onChange={handleChange}
                                    className="w-full h-10 text-xs border-slate-200 rounded-lg focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div> */}
                    <div className="flex flex-col gap-2 w-full">
                        <label className="text-sm font-bold text-slate-800 uppercase">Booking Date</label>
                        {/* Grid ensures the two inputs stay in two columns on all screen sizes */}
                        <div className="grid grid-cols-2 gap-2 w-full">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">From:</span>
                                <Input
                                    type="date"
                                    name="dateFrom"
                                    value={filters.dateFrom || ''}
                                    onChange={handleChange}
                                    // text-[10px] helps the date string fit better on small mobile screens
                                    className="w-full h-10 text-[10px] sm:text-xs border-slate-200 rounded-lg focus:ring-blue-500 px-1"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">To:</span>
                                <Input
                                    type="date"
                                    name="dateTo"
                                    value={filters.dateTo || ''}
                                    onChange={handleChange}
                                    className="w-full h-10 text-[10px] sm:text-xs border-slate-200 rounded-lg focus:ring-blue-500 px-1"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Delivery Status */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Delivery Status</label>
                        <select
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="status"
                            value={filters.status || 'All'}
                            onChange={handleChange}
                        >
                            <option value="All">All</option>
                            <option value="Pending">Pending</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Available">Available</option>
                        </select>
                    </div>

                    {/* Show Entries */}
                    <div className="flex flex-col gap-1 min-w-[100px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Show Entries</label>
                        <select
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="entries"
                            value={filters.entries || 10}
                            onChange={handleChange}
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>

                    {/* Global Search */}
                    <div className="flex flex-col gap-1 flex-[1.5] min-w-[200px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Search:</label>
                        <div className="relative">
                            <Input
                                placeholder=""
                                value={filters.search || ''}
                                name="search"
                                onChange={handleChange}
                                className="h-10 border-slate-200 rounded-lg pl-3 pr-10 focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search size={16} />
                            </div>
                        </div>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
