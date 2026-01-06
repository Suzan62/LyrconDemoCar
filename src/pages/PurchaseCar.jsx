import React from 'react';

// Using a clean white card layout as requested
export default function PurchaseCar() {
    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Purchase Old Car</h1>
            <div className="text-gray-500">
                <p>Form to purchase an existing car will go here.</p>
                {/* Future implementation: Purchase details form */}
            </div>
        </div>
    );
}
