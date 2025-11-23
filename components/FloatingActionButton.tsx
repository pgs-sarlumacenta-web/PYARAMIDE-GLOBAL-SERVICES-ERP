import React from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';

interface FloatingActionButtonProps {
    onClick: () => void;
    title: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, title }) => {
    return (
        <button
            onClick={onClick}
            title={title}
            aria-label={title}
            className="fixed bottom-8 right-8 z-40 h-16 w-16 rounded-full bg-pgs-red text-white shadow-lg flex items-center justify-center transform transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pgs-red"
        >
            <PlusIcon className="h-8 w-8" />
        </button>
    );
};

export default FloatingActionButton;
