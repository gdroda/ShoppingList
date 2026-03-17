import { Button } from '@/components/ui/button.js';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (listId: number) => void;
    listId: number;
}

export function ConfirmModal({ isOpen, onClose, onSubmit, listId }: ConfirmModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div onPointerDown={(e) => e.stopPropagation()} className="fixed inset-0 z-100 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 py-20 pointer-events-auto">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 transform transition-all">
                <h2>Are you sure you want to delete your list?</h2>

                <div className="flex gap-3 justify-end">
                    <Button onClick={() => onClose()}> Cancel</Button>
                    <Button onClick={() =>onSubmit(listId)}>Confirm</Button>
                </div>

            </div>
        </div>, document.body
    )
}