import React, { useRef, useState, useEffect } from 'react';
import { XMarkIcon, PrinterIcon, ArrowDownTrayIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAlert } from '../context/AlertContext.tsx';
import Portal from './Portal.tsx';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const { showAlert } = useAlert();
  
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        const modalElement = modalRef.current;
        if(modalElement) {
            const { innerWidth, innerHeight } = window;
            const { offsetWidth, offsetHeight } = modalElement;
            setPosition({
                x: (innerWidth - offsetWidth) / 2,
                y: 50 // Start near top
            });
        }
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
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
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
            setDownloadMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-content-wrapper');
    if (!printContent) {
      console.error('Could not find element to print.');
      return;
    }

    const isBadge = title.toLowerCase().includes('badge');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
        console.error('Could not access iframe document.');
        document.body.removeChild(iframe);
        return;
    }
    
    doc.open();
    doc.write('<html><head><title>Imprimer</title>');
    
    const styles = document.head.querySelectorAll('style, link[rel="stylesheet"]');
    styles.forEach(style => {
      doc.head.appendChild(style.cloneNode(true));
    });
    
    let printStyles = `
        @media print { 
            body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
            } 
        }
    `;

    if (isBadge) {
        printStyles += `
            @media print {
                @page {
                    size: 85.6mm 54mm; /* Credit card size */
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                }
                #printable-content-wrapper {
                    display: block;
                    width: 100%;
                    height: 100%;
                }
                #student-badge-content, #personnel-badge-content {
                    width: 100% !important;
                    height: 100% !important;
                    box-shadow: none !important;
                    border: none !important;
                    border-radius: 0 !important;
                    margin: 0 !important;
                    transform: scale(1.02); /* Slight scale to bleed edges */
                }
            }
        `;
    }

    doc.write(`<style>${printStyles}</style>`);

    doc.write('</head><body>');
    doc.write(printContent.innerHTML);
    doc.write('</body></html>');
    doc.close();

    const tryPrint = () => {
        if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        } else {
            console.error('Iframe content window not available.');
             document.body.removeChild(iframe);
        }
    };
    
    if (iframe.contentWindow) {
        iframe.contentWindow.onload = () => {
            setTimeout(tryPrint, 250);
        };
    } else {
         setTimeout(tryPrint, 500);
    }
  };

  const handleDownloadPDF = () => {
    const wrapper = document.getElementById('printable-content-wrapper');
    if (!wrapper || !wrapper.firstChild) {
      showAlert("Erreur", "Impossible de trouver le contenu du document à télécharger.");
      return;
    }

    const element = wrapper.firstChild as HTMLElement;
    const lowerCaseTitle = title.toLowerCase();
    const isLandscape = lowerCaseTitle.includes('attestation') && !lowerCaseTitle.includes('de travail');
    const isBadge = lowerCaseTitle.includes('badge');
    const filename = `${title.replace(/ /g, '_')}.pdf`;
    
    let opt: any;

    if (isBadge) {
        // Center on A4 for easy printing and cutting
        opt = {
            margin: [1, 1, 1, 1], // Centering margins
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 4, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
    } else {
        opt = {
            margin: 0,
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait' }
        };
    }
    (window as any).html2pdf().from(element).set(opt).save();
  };
  
  const handleDownloadPNG = () => {
    const wrapper = document.getElementById('printable-content-wrapper');
    if (!wrapper || !wrapper.firstChild) {
      showAlert("Erreur", "Impossible de trouver le contenu à télécharger.");
      return;
    }

    const node = wrapper.firstChild as HTMLElement;
    const isBadge = title.toLowerCase().includes('badge');

    const options: any = { pixelRatio: 2, useCORS: true, cacheBust: true };
    
    if (isBadge) {
        options.width = 638;
        options.height = 1013;
        delete options.pixelRatio;
    }
    
    showAlert("Génération en cours...", "La création de votre image PNG est en cours. Cela peut prendre quelques instants.");

    (window as any).htmlToImage.toPng(node, options)
    .then((dataUrl: string) => {
      const link = document.createElement('a');
      link.download = `${title.replace(/ /g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    })
    .catch((error: any) => {
      console.error("Erreur lors de la génération du PNG:", error);
      let message = "Une erreur est survenue lors de la création de l'image. Assurez-vous que les images du document sont accessibles et que votre connexion internet est stable.";
      if (error instanceof Error) {
          message += ` Détail: ${error.message}`;
      }
      showAlert("Erreur", message);
    });
  };

  const handleDownload = () => {
    const isBadge = title.toLowerCase().includes('badge');
    if (isBadge) {
      handleDownloadPNG();
    } else {
      handleDownloadPDF();
    }
  };
  
  const handleDownloadAs = (format: 'pdf' | 'png') => {
      if (format === 'pdf') {
          handleDownloadPDF();
      } else {
          handleDownloadPNG();
      }
      setDownloadMenuOpen(false);
  };

  return (
    <Portal>
      <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50" 
          aria-modal="true" 
          role="dialog" 
          onClick={onClose}
      >
        <div 
          ref={modalRef}
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          className="absolute bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[95vh]" 
          onClick={e => e.stopPropagation()}
        >
          <header 
              onMouseDown={handleMouseDown}
              className="flex-shrink-0 flex justify-between items-center p-4 border-b border-pgs-border-light dark:border-pgs-border-dark cursor-move"
          >
            <h3 className="text-xl font-semibold">{title}</h3>
            <div className="flex items-center space-x-2">
                <div className="flex rounded-lg shadow-sm" ref={downloadRef}>
                    <button
                        onClick={handleDownload}
                        className="flex items-center bg-green-600 text-white pl-3 pr-4 py-1.5 rounded-l-lg hover:bg-green-700 transition-colors text-sm"
                        title="Télécharger au format par défaut (PDF pour documents, PNG pour badges)"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Télécharger
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                            className="bg-green-700 text-white px-2 py-1.5 h-full rounded-r-lg hover:bg-green-800 transition-colors"
                            aria-label="Choisir le format de téléchargement"
                        >
                            <ChevronDownIcon className="h-5 w-5" />
                        </button>
                        {downloadMenuOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-pgs-border-light dark:border-pgs-border-dark">
                                <button onClick={() => handleDownloadAs('pdf')} className="w-full text-left flex items-center px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">PDF</button>
                                <button onClick={() => handleDownloadAs('png')} className="w-full text-left flex items-center px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">PNG</button>
                            </div>
                        )}
                    </div>
                </div>
              <button
                  onClick={handlePrint}
                  className="flex items-center bg-pgs-blue text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm cursor-pointer"
              >
                  <PrinterIcon className="h-5 w-5 mr-2" />
                  Imprimer
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            <div id="printable-content-wrapper">
              {children}
            </div>
          </main>
        </div>
      </div>
    </Portal>
  );
};

export default DocumentViewer;