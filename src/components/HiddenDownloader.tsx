import React, { useEffect, useRef } from 'react';
import { useAlert } from '../context/AlertContext.tsx';

interface HiddenDownloaderProps {
  content: React.ReactNode;
  format: 'pdf' | 'png';
  title: string;
  onComplete: () => void;
}

const HiddenDownloader: React.FC<HiddenDownloaderProps> = ({ content, format, title, onComplete }) => {
    const { showAlert } = useAlert();
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const download = async () => {
            const node = contentRef.current?.firstChild as HTMLElement;
            
            if (!node) {
                showAlert("Erreur", "Le contenu du document n'a pas pu être trouvé pour le téléchargement.");
                onComplete();
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                if (format === 'pdf') {
                    const filename = `${title.replace(/ /g, '_')}.pdf`;
                    const isLandscape = title.toLowerCase().includes('emploi du temps');

                    const opt = {
                        margin: 0,
                        filename,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'in', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait' }
                    };
                    await (window as any).html2pdf().from(node).set(opt).save();
                } else { // png
                    const dataUrl = await (window as any).htmlToImage.toPng(node, { pixelRatio: 2, useCORS: true, cacheBust: true });
                    const link = document.createElement('a');
                    link.download = `${title.replace(/ /g, '_')}.png`;
                    link.href = dataUrl;
                    link.click();
                }
            } catch (error) {
                console.error(`Erreur lors du téléchargement en ${format}:`, error);
                let message = "Une erreur est survenue lors de la création du fichier. Vérifiez votre connexion internet et que les images externes sont accessibles.";
                if (error instanceof Error) {
                    message += ` Détail: ${error.message}`;
                }
                showAlert("Erreur de téléchargement", message);
            } finally {
                onComplete();
            }
        };
        
        download();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
            <div ref={contentRef}>{content}</div>
        </div>
    );
};

export default HiddenDownloader;