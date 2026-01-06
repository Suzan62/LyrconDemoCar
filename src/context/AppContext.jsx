import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // Inventory State
    const [inventory, setInventory] = useState([
        { id: "INV-001", make: "Tesla", model: "Model 3", year: 2023, price: 32900, mileage: "12k", status: "Available", profitability: 92, predictedMargin: "+12%" },
        { id: "INV-002", make: "Ford", model: "Mustang", year: 2021, price: 28500, mileage: "25k", status: "Pending", profitability: 78, predictedMargin: "+8%" },
        { id: "INV-003", make: "BMW", model: "3 Series", year: 2022, price: 41200, mileage: "18k", status: "Available", profitability: 88, predictedMargin: "+15%" },
        { id: "INV-004", make: "Honda", model: "Civic", year: 2024, price: 24100, mileage: "5k", status: "Negotiation", profitability: 65, predictedMargin: "+5%" },
        { id: "INV-005", make: "Audi", model: "Q5", year: 2020, price: 35800, mileage: "32k", status: "Available", profitability: 85, predictedMargin: "+10%" },
        { id: "INV-006", make: "Toyota", model: "Camry", year: 2022, price: 22000, mileage: "40k", status: "Sold", profitability: 70, predictedMargin: "+7%" },
    ]);

    const addVehicle = (vehicle) => {
        setInventory(prev => [vehicle, ...prev]);
    };

    const updateVehicle = (id, updatedData) => {
        setInventory(prev => prev.map(car => car.id === id ? { ...car, ...updatedData } : car));
    };

    const deleteVehicle = (id) => {
        setInventory(prev => prev.filter(car => car.id !== id));
    };

    // User Profile State
    const [userProfile, setUserProfile] = useState({
        name: "Admin User",
        role: "Manager",
        email: "admin@lyrcon.com",
        phone: "+1 (555) 123-4567",
        location: "New York, NY"
    });

    const updateUserProfile = (newData) => {
        setUserProfile(prev => ({ ...prev, ...newData }));
    };

    // Dashboard Stats (Simulated)
    const [dashboardStats] = useState({
        carsSold: 12,
        revenue: 485000,
        loansApproved: 8
    });

    const value = {
        inventory,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        userProfile,
        updateUserProfile,
        dashboardStats
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
