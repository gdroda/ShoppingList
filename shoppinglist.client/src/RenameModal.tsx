import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.js';

interface NameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
    currentValue: string
}

export function NameModal({ isOpen, onClose, onSubmit, currentValue }: NameModalProps) {
    const [inputValue, setInputValue] = useState(currentValue || '');

    useEffect(() => {
        if (isOpen) {
            setInputValue(currentValue);
        }
    }, [isOpen, currentValue]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 py-20">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 transform transition-all">
                <h2>Change Title</h2>
                <input
                    autoFocus
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter title..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 transition-all mb-6"
                />

                <div className="flex gap-3 justify-end">
                    <Button onClick={() => { onClose(); setInputValue(''); }}> Cancel</Button>
                    <Button onClick={() => { onSubmit(inputValue); setInputValue(''); } }>Confirm</Button>
                </div>

            </div>
        </div>
    )
}