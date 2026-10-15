/**
 * QrSheet.jsx — the printable table cards: the place's name, the table, its
 * QR code (opens the menu for that table), and the short code to type at
 * allinkigali.rw/table when a phone can't scan, in Kinyarwanda, English and
 * French. Opens as a preview over the page; Print gives six cards per A4
 * page, ready to cut and put in table stands.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import Button from '../../../components/common/Button';
import { tableUrl, codePageLabel } from './tableLink';

export default function QrSheet({ placeName, tables, onClose }) {
  const [images, setImages] = useState({});
  useEffect(() => {
    let live = true;
    Promise.all(tables.map((tb) => QRCode.toDataURL(tableUrl(tb.qrToken), { margin: 1, width: 480, errorCorrectionLevel: 'M' }).then((src) => [tb.id, src])))
      .then((pairs) => { if (live) setImages(Object.fromEntries(pairs)); });
    return () => { live = false; };
  }, [tables]);
  const ready = tables.every((tb) => images[tb.id]);

  return createPortal(
    <div className="qr-overlay">
      <style>{CSS}</style>
      <div className="qr-bar">
        <b style={{ flex: 1 }}>{tables.length} table card{tables.length === 1 ? '' : 's'} · cut along the dashed lines</b>
        <Button onClick={() => window.print()} disabled={!ready}>{ready ? 'Print' : 'Preparing…'}</Button>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
      <div className="qr-sheet">
        {tables.map((tb) => (
          <div key={tb.id} className="qr-card">
            <div className="qr-place">{placeName}</div>
            <div className="qr-table">{tb.label}</div>
            <div className="qr-scan"><b>Sikana utumize</b> · Scan to order · Scannez pour commander</div>
            {images[tb.id] ? <img className="qr-img" src={images[tb.id]} alt={`QR code for ${tb.label}`} /> : <div className="qr-img" />}
            <div className="qr-or">Nta kamera? · No camera? · Pas de caméra ? → <b>{codePageLabel}</b></div>
            <div className="qr-code">{tb.shortCode}</div>
            <div className="qr-brand">Ku Meza · allinkigali</div>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}

const CSS = `
.qr-overlay { position: fixed; inset: 0; z-index: 400; background: #F2F4F7; overflow-y: auto; }
.qr-bar { position: sticky; top: 0; z-index: 1; display: flex; gap: 10px; align-items: center; padding: 12px 20px; background: #FFFFFF; border-bottom: 2px solid #378ADD; color: #042C53; font-size: 14px; }
.qr-sheet { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; padding: 20px; max-width: 1100px; margin: 0 auto; }
.qr-card { background: #fff; color: #111; border: 1px solid rgba(4,44,83,0.12); border-radius: 12px; padding: 18px 14px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; font-family: Inter, Arial, sans-serif; }
.qr-place { font-size: 14px; font-weight: 700; color: #444; }
.qr-table { font-size: 30px; font-weight: 900; line-height: 1.1; }
.qr-scan { font-size: 12px; color: #333; }
.qr-scan b { font-size: 14px; color: #111; }
.qr-img { width: 180px; height: 180px; }
.qr-or { font-size: 11px; color: #555; }
.qr-code { font-family: ui-monospace, Consolas, monospace; font-size: 24px; font-weight: 800; letter-spacing: 3px; }
.qr-brand { font-size: 10px; color: #999; }
@media print {
  @page { size: A4; margin: 10mm; }
  body > *:not(.qr-overlay) { display: none !important; }
  html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
  .qr-overlay { position: static; background: #fff; overflow: visible; }
  .qr-bar { display: none; }
  .qr-sheet { grid-template-columns: 1fr 1fr; gap: 5mm; padding: 0; max-width: none; }
  .qr-card { height: 86mm; justify-content: center; border: 1px dashed #999; border-radius: 3mm; padding: 3mm; gap: 1.5mm; break-inside: avoid; page-break-inside: avoid; }
  .qr-img { width: 44mm; height: 44mm; }
  .qr-table { font-size: 22pt; }
  .qr-place { font-size: 11pt; }
  .qr-code { font-size: 16pt; }
}`;
