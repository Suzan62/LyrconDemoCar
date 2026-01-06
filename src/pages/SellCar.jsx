import React from 'react';

// Using a clean white card layout as requested
export default function SellCar() {
    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Sell Old Car</h1>
            <div className="text-gray-500">
                <p>Form to sell an existing car will go here.</p>
                {/* Future implementation: Sale details form */}
            </div>
        </div>
    );
}
