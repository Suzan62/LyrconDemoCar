import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Car,
    PlusCircle,
    ScanLine,
    ChevronLeft,
    ChevronRight,
    Settings,
    LogOut,
    UserCheck,
    ChevronDown,
    ShoppingCart,
    Banknote,
    FileQuestion,
    List,
    Plus,
    DollarSign,
    Shield,
    Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Modal, ModalFooter } from './ui/Modal';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isInquiriesOpen, setIsInquiriesOpen] = useState(false);
    const [isFinancesOpen, setIsFinancesOpen] = useState(false);
    const [isInsuranceOpen, setIsInsuranceOpen] = useState(false);
    const [isUsersOpen, setIsUsersOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const dispatch = useDispatch();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
        } catch (error) {
            console.error("Logout API failed", error);
        }
        dispatch(logout());
        setIsLogoutModalOpen(false);
    };

    // Unified active state check for all inventory-related paths
    const isInventoryActive = [
        '/inventory',
        '/add-car',
        '/purchase-old-car',
        '/sell-old-car',
        '/vehicle'
    ].some(path => location.pathname.startsWith(path));

    return (
        <>
            <div className={cn(
                "h-screen bg-white border-r border-border flex flex-col transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}>
                <div className="p-4 flex items-center justify-between border-b border-border h-16">
                    {!collapsed && <span className="font-bold text-xl text-primary">DemoCar</span>}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn("ml-auto", collapsed && "mx-auto")}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </Button>
                </div>

                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                    {/* Dashboard */}
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            collapsed && "justify-center px-2"
                        )}
                    >
                        <LayoutDashboard size={20} />
                        {!collapsed && <span>Dashboard</span>}
                    </NavLink>

                    {/* Inventory Collapsible */}
                    <div>
                        <button
                            onClick={() => !collapsed && setIsInventoryOpen(!isInventoryOpen)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium",
                                isInventoryActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Car size={20} />
                                {!collapsed && <span>Inventory</span>}
                            </div>
                            {!collapsed && <ChevronDown size={16} className={cn("transition-transform", isInventoryOpen && "rotate-180")} />}
                        </button>

                        {/* Inventory Submenu */}
                        {!collapsed && isInventoryOpen && (
                            <div className="ml-9 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                                <NavLink
                                    to="/inventory"
                                    end
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <List size={16} /> All Inventory
                                </NavLink>
                                <NavLink
                                    to="/add-car"
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <PlusCircle size={16} /> New Car
                                </NavLink>
                                <NavLink
                                    to="/purchase-old-car"
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <ShoppingCart size={16} /> Purchase Old
                                </NavLink>
                                <NavLink
                                    to="/sell-old-car"
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <Banknote size={16} /> Sell Old
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Inquiries Collapsible */}
                    <div>
                        <button
                            onClick={() => !collapsed && setIsInquiriesOpen(!isInquiriesOpen)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <FileQuestion size={20} />
                                {!collapsed && <span>Inquiries</span>}
                            </div>
                            {!collapsed && <ChevronDown size={16} className={cn("transition-transform", isInquiriesOpen && "rotate-180")} />}
                        </button>

                        {/* Submenu */}
                        {!collapsed && isInquiriesOpen && (
                            <div className="ml-9 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                                <NavLink
                                    to="/inquiries"
                                    end
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <List size={16} /> All Inquiries
                                </NavLink>
                                <NavLink
                                    to="/inquiries/create"
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <Plus size={16} /> New Inquiry
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Finances Collapsible */}
                    <div>
                        <button
                            onClick={() => !collapsed && setIsFinancesOpen(!isFinancesOpen)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <DollarSign size={20} />
                                {!collapsed && <span>Finances</span>}
                            </div>
                            {!collapsed && <ChevronDown size={16} className={cn("transition-transform", isFinancesOpen && "rotate-180")} />}
                        </button>

                        {/* Submenu */}
                        {!collapsed && isFinancesOpen && (
                            <div className="ml-9 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                                <NavLink
                                    to="/finance"
                                    end
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <List size={16} /> All Finances
                                </NavLink>
                                <NavLink
                                    to="/finance/create"
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <PlusCircle size={16} /> Add Finance
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Insurances Collapsible */}
                    <div>
                        <button
                            onClick={() => !collapsed && setIsInsuranceOpen(!isInsuranceOpen)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Shield size={20} />
                                {!collapsed && <span>Insurances</span>}
                            </div>
                            {!collapsed && <ChevronDown size={16} className={cn("transition-transform", isInsuranceOpen && "rotate-180")} />}
                        </button>

                        {/* Submenu */}
                        {!collapsed && isInsuranceOpen && (
                            <div className="ml-9 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                                <NavLink
                                    to="/insurances"
                                    end
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <List size={16} /> All Insurances
                                </NavLink>
                                <NavLink
                                    to="/insurances/add"
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <PlusCircle size={16} /> Add Insurance
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Users Collapsible */}
                    <div>
                        <button
                            onClick={() => !collapsed && setIsUsersOpen(!isUsersOpen)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Users size={20} />
                                {!collapsed && <span>Users</span>}
                            </div>
                            {!collapsed && <ChevronDown size={16} className={cn("transition-transform", isUsersOpen && "rotate-180")} />}
                        </button>

                        {/* Submenu */}
                        {!collapsed && isUsersOpen && (
                            <div className="ml-9 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                                <NavLink
                                    to="/users"
                                    end
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <List size={16} /> All Users
                                </NavLink>
                                <NavLink
                                    to="/users/create"
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                        isActive ? "text-primary font-medium bg-blue-50" : "text-slate-500 hover:text-slate-800"
                                    )}
                                >
                                    <PlusCircle size={16} /> New User
                                </NavLink>
                            </div>
                        )}
                    </div>


                    {/* Other Links */}
                    <NavLink
                        to="/kyc"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            collapsed && "justify-center px-2"
                        )}
                    >
                        <ScanLine size={20} />
                        {!collapsed && <span>Mobile KYC</span>}
                    </NavLink>

                </nav >

                <div className="p-2 border-t border-border space-y-1">
                    <NavLink
                        to="/settings"
                        className={({ isActive }) => cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            collapsed && "justify-center px-2"
                        )}
                    >
                        <Settings size={20} />
                        {!collapsed && <span>Settings</span>}
                    </NavLink>
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium text-red-500 hover:bg-red-50",
                            collapsed && "justify-center px-2"
                        )}>
                        <LogOut size={20} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </div >

            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title="Confirm Logout"
            >
                <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <LogOut className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900">Are you surely want to log out?</h4>
                        <p className="text-sm text-gray-500 mt-1">You will be redirected to the login screen.</p>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsLogoutModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Logout
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}
