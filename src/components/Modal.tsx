import React, { useRef, useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Portal from './Portal.tsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  zIndex?: string;
  blocking?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, zIndex = 'z-50', blocking = true }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
        const modalElement = modalRef.current;
        if(modalElement) {
            const { innerWidth, innerHeight } = window;
            const { offsetWidth, offsetHeight } = modalElement;
            setPosition({
                x: (innerWidth - offsetWidth) / 2,
                y: (innerHeight - offsetHeight) / 2,
            });
        }
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current) {
        setIsDragging(true);
        setOffset({
            x: e.clientX - modalRef.current.offsetLeft,
            y: e.clientY - modalRef.current.offsetTop
        });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && modalRef.current) {
        e.preventDefault();
        setPosition({
            x: e.clientX - offset.x,
            y: e.clientY - offset.y
        });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset]);


  if (!isOpen) return null;

  return (
    <Portal>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 ${zIndex}`} 
        style={{ pointerEvents: blocking ? 'auto' : 'none' }}
        onClick={blocking ? onClose : undefined}
        aria-modal="true" 
        role="dialog"
      >
        <div 
          ref={modalRef}
          style={{ left: `${position.x}px`, top: `${position.y}px`, pointerEvents: 'auto' }}
          className="absolute bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 transform transition-all" 
          onClick={e => e.stopPropagation()}
        >
          <div 
              ref={headerRef}
              onMouseDown={handleMouseDown}
              className="flex justify-between items-center p-6 pb-4 border-b border-pgs-border-light dark:border-pgs-border-dark cursor-move"
          >
            <h3 className="text-xl font-semibold text-pgs-text-light dark:text-pgs-text-dark">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Modal;
