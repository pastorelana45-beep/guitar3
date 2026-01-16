
import JSZip from 'jszip';

const FILES_TO_EXPORT = [
  'index.html',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'sw.js',
  'metadata.json',
  'manifest.json',
  'package.json',
  'components/GuitarString.tsx',
  'components/Controls.tsx',
  'services/audioEngine.ts',
  'services/geminiService.ts',
  'services/exportService.ts'
];

export async function downloadSourceCode() {
  const zip = new JSZip();
  
  console.log("Inizio preparazione pacchetto sorgente offline-ready...");
  
  const loadingPromises = FILES_TO_EXPORT.map(async (path) => {
    try {
      const response = await fetch(`./${path}`);
      if (response.ok) {
        const content = await response.text();
        zip.file(path, content);
      } else {
        console.warn(`File non trovato per ZIP: ${path}`);
      }
    } catch (err) {
      console.error(`Errore nel recupero di ${path}:`, err);
    }
  });

  await Promise.all(loadingPromises);
  
  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `multistudio-pro-source-v1.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log("Download completato.");
  } catch (err) {
    console.error("Errore durante la generazione dello ZIP:", err);
    alert("Si è verificato un errore durante la generazione dello ZIP.");
  }
}
