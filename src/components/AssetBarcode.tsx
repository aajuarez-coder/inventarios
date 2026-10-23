import React from 'react';
import { HardwareAsset } from '../types/inventory';
import { Printer, QrCode } from 'lucide-react';

interface AssetBarcodeProps {
  asset: HardwareAsset;
  compact?: boolean;
}

export const AssetBarcode: React.FC<AssetBarcodeProps> = ({ asset, compact = false }) => {
  // Generate deterministic bar widths based on assetTag characters
  const generateBars = (code: string) => {
    const bars: { width: number; space: number }[] = [];
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      bars.push({
        width: (charCode % 3) + 1.5,
        space: ((charCode * 3) % 4) + 1.5
      });
    }
    return bars;
  };

  const bars = generateBars(asset.assetTag + asset.serialNumber);

  const handlePrintLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta de Activo - ${asset.assetTag}</title>
          <style>
            body { font-family: monospace; padding: 20px; text-align: center; }
            .label { border: 2px dashed #000; padding: 16px; width: 320px; margin: 0 auto; border-radius: 8px; }
            .company { font-size: 11px; font-weight: bold; letter-spacing: 1px; color: #333; }
            .tag { font-size: 24px; font-weight: 900; margin: 6px 0; }
            .serial { font-size: 11px; color: #555; }
            .model { font-size: 10px; margin-top: 4px; color: #444; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label">
            <div class="company">PETROIL CORP • CONTROL DE ACTIVOS TI</div>
            <div class="tag">${asset.assetTag}</div>
            <div class="serial">S/N: ${asset.serialNumber}</div>
            <div class="model">${asset.brand} ${asset.model}</div>
            <div style="font-size: 9px; margin-top: 8px; color: #777;">PROPIEDAD DE LA EMPRESA - NO REMOVER</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 text-slate-100 font-mono text-xs shadow-xs">
        <QrCode className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-bold tracking-wider">{asset.assetTag}</span>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-slate-300 rounded-lg p-3 text-slate-900 shadow-sm relative group">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
          PETROIL TI • ACTIVO FIJO
        </span>
        <button
          onClick={handlePrintLabel}
          title="Imprimir etiqueta adhesiva"
          className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-slate-100"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="my-2 text-center">
        <p className="text-xl font-black font-mono tracking-widest text-slate-900">
          {asset.assetTag}
        </p>
        <p className="text-xs text-slate-500 font-mono">
          SERIE: <span className="font-semibold text-slate-800">{asset.serialNumber}</span>
        </p>
      </div>

      {/* SVG Barcode pattern */}
      <div className="flex justify-center items-center h-9 px-2 bg-slate-50 rounded border border-slate-200 overflow-hidden">
        <svg className="h-7 w-full max-w-[240px]" viewBox="0 0 200 40" preserveAspectRatio="none">
          <g fill="#0f172a">
            {bars.map((bar, idx) => {
              const xPos = idx * 11 + 4;
              return (
                <rect
                  key={idx}
                  x={xPos}
                  y="2"
                  width={bar.width * 1.5}
                  height="34"
                  rx="0.5"
                />
              );
            })}
          </g>
        </svg>
      </div>

      <div className="mt-2 text-center">
        <span className="text-[9px] text-slate-400 uppercase tracking-tight block">
          {asset.brand} - {asset.model} • INVENTARIO TI
        </span>
      </div>
    </div>
  );
};
