import React, { useState, useRef, createContext, useContext } from 'react';
import { useClickOutside } from '../../hooks/use-click-outside';
import { cn } from '../../lib/utils';

const DropdownContext = createContext({
    close: () => { },
});

export function DropdownMenu({ trigger, children, align = 'right' }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useClickOutside(ref, () => setIsOpen(false));

    const close = () => setIsOpen(false);

    return (
        <DropdownContext.Provider value={{ close }}>
            <div className="relative inline-block text-left" ref={ref}>
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="cursor-pointer"
                >
                    {trigger}
                </div>

                {isOpen && (
                    <div
                        className={cn(
                            "absolute z-[100] mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95 duration-100",
                            align === 'right' ? "right-0 origin-top-right" : "left-0 origin-top-left"
                        )}
                        style={{ minWidth: '160px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            {children}
                        </div>
                    </div>
                )}
            </div>
        </DropdownContext.Provider>
    );
}

export function DropdownItem({ children, onClick, className, variant = 'default' }) {
    const { close } = useContext(DropdownContext);

    const handleClick = (e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
        close();
    };

    return (
        <button
            className={cn(
                "w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                variant === 'destructive' && "text-red-600 hover:bg-red-50 hover:text-red-700",
                className
            )}
            role="menuitem"
            onClick={handleClick}
        >
            {children}
        </button>
    );
}
