import { useCallback } from 'react';
import { createRoot } from 'react-dom/client';

interface PrintOptions {
  title?: string;
  styles?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export const usePrint = () => {
  const printComponent = useCallback((
    component: React.ReactElement,
    options: PrintOptions = {}
  ) => {
    const {
      title = 'Impression',
      styles = '',
      onBeforePrint,
      onAfterPrint
    } = options;

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Impossible d\'ouvrir la fenêtre d\'impression. Veuillez autoriser les pop-ups.');
      return;
    }

    // Styles CSS pour l'impression
    const printStyles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #000;
          background: #fff;
        }
        
        .print-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20mm;
          background: #fff;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .print-container {
            margin: 0;
            padding: 15mm;
            max-width: none;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
          
          /* Éviter les coupures de page dans les éléments importants */
          .no-break {
            page-break-inside: avoid;
          }
          
          /* Forcer une nouvelle page */
          .page-break {
            page-break-before: always;
          }
          
          /* Masquer les éléments non imprimables */
          .no-print {
            display: none !important;
          }
        }
        
        /* Styles personnalisés */
        ${styles}
      </style>
    `;

    // Structure HTML de la page d'impression
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          ${printStyles}
        </head>
        <body>
          <div id="print-root"></div>
          <script>
            // Attendre que le contenu soit chargé avant d'imprimer
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            });
            
            // Fermer la fenêtre si l'impression est annulée
            window.addEventListener('afterprint', function() {
              window.close();
            });
          </script>
        </body>
      </html>
    `;

    // Écrire le contenu HTML dans la nouvelle fenêtre
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Attendre que le document soit prêt
    printWindow.addEventListener('load', () => {
      const printRoot = printWindow.document.getElementById('print-root');
      if (printRoot) {
        // Créer un root React dans la fenêtre d'impression
        const root = createRoot(printRoot);
        
        // Callback avant impression
        if (onBeforePrint) {
          onBeforePrint();
        }
        
        // Rendre le composant React
        root.render(component);
        
        // Callback après impression (approximatif)
        setTimeout(() => {
          if (onAfterPrint) {
            onAfterPrint();
          }
        }, 1000);
      }
    });

  }, []);

  const printHTML = useCallback((
    htmlContent: string,
    options: PrintOptions = {}
  ) => {
    const {
      title = 'Impression',
      styles = '',
      onBeforePrint,
      onAfterPrint
    } = options;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Impossible d\'ouvrir la fenêtre d\'impression. Veuillez autoriser les pop-ups.');
      return;
    }

    const printStyles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #000;
          background: #fff;
        }
        
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
        }
        
        ${styles}
      </style>
    `;

    const fullHTML = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          ${printStyles}
        </head>
        <body>
          ${htmlContent}
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            });
            
            window.addEventListener('afterprint', function() {
              window.close();
            });
          </script>
        </body>
      </html>
    `;

    if (onBeforePrint) {
      onBeforePrint();
    }

    printWindow.document.write(fullHTML);
    printWindow.document.close();

    setTimeout(() => {
      if (onAfterPrint) {
        onAfterPrint();
      }
    }, 1000);

  }, []);

  return {
    printComponent,
    printHTML
  };
};
