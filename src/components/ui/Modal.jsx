import React from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { cn } from '../../lib/utils';
import { useClickOutside } from '../../hooks/use-click-outside';

export function Modal({ isOpen, onClose, title, children, className }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className={cn(
                    "bg-white rounded-lg shadow-xl w-full max-w-lg relative animate-in zoom-in-95 duration-200 border border-border",
                    className
                )}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X size={18} />
                    </Button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export function ModalFooter({ children, className }) {
    return (
        <div className={cn("flex items-center justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-lg", className)}>
            {children}
        </div>
    );
}
