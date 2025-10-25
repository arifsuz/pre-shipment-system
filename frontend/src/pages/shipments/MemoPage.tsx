import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { shipmentService } from '../../services/shipmentService';
import type { Shipment } from '../../types';

type ManualItem = {
  no: number;
  partNo: string;
  partName: string;
  qty: number;
  pricePerPc?: number;
  totalAmount?: number;
  specialPacking?: string;
};

type Party = {
  companyName?: string;
  address?: string;
  country?: string;
  attention?: string;
  section?: string;
  phone?: string;
  fax?: string;
  email?: string;
};

export const MemoPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const loc = useLocation();
  const initialForm = (loc.state as any)?.formData || {};
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);

  // memo fields
  const [memoNo, setMemoNo] = useState('');
  const [goodsType, setGoodsType] = useState('');
  const [dangerLevel, setDangerLevel] = useState('');
  const [specialPermit, setSpecialPermit] = useState(false);
  const [destination, setDestination] = useState('');
  const [invoiceType, setInvoiceType] = useState('');
  const [sapInfo, setSapInfo] = useState('');
  const [tpNo, setTpNo] = useState<string | null>(null);
  const [tpDate, setTpDate] = useState<string | null>(null);
  const [packingDetails, setPackingDetails] = useState('');
  const [portOfDischarge, setPortOfDischarge] = useState('');
  const [shipmentMethod, setShipmentMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [exportType, setExportType] = useState('');
  const [etdShipment, setEtdShipment] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<Party>({});
  const [deliveryTo, setDeliveryTo] = useState<Party>({});
  const [detailBarang, setDetailBarang] = useState('');
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);

  const [checked, setChecked] = useState(false);
  const [diffRows, setDiffRows] = useState<{ key: string; shipmentQty: number; memoQty: number }[]>([]);
  const [saving, setSaving] = useState(false);

  // refs to manual item rows so we can focus / highlight
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [highlightKey, setHighlightKey] = useState<string | null>(null);

  const toDateInput = (d: any): string | null => {
    if (!d) return null;
    const dt = typeof d === 'string' ? new Date(d) : d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString().slice(0, 10); // yyyy-MM-dd
  };

  const toISOForServer = (dStr?: string | null) => {
    if (!dStr) return null;
    const dt = new Date(dStr);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  };

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const s = await shipmentService.getShipmentById(id);
        setShipment(s);
        // normalize any date fields for the form inputs
        setTpDate(toDateInput((s as any).tpDate) || null);
        setEtdShipment(toDateInput((s as any).etdShipment) || null);
      } catch (err) {
        console.error(err);
        alert('Gagal load shipment');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // if we were navigated with formData (from create), normalize date fields too
  useEffect(() => {
    if (!initialForm) return;
    setTpDate(toDateInput(initialForm.tpDate) || null);
    setEtdShipment(toDateInput(initialForm.etdShipment) || null);
  }, [initialForm]);

  // manual items helpers
  const addItem = () => setManualItems(prev => [...prev, { no: prev.length + 1, partNo: '', partName: '', qty: 1 }]);
  const removeItem = (idx: number) => setManualItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, no: i + 1 })));
  const updateItem = (idx: number, k: keyof ManualItem, v: any) =>
    setManualItems(prev => {
      const items = [...prev];
      items[idx] = { ...items[idx], [k]: v };
      if (k === 'pricePerPc' || k === 'qty') {
        items[idx].totalAmount = Number(items[idx].pricePerPc || 0) * Number(items[idx].qty || 0);
      }
      return items;
    });

  const getKeyFromItem = (it: { partNo?: string; partName?: string }) =>
    `${String(it.partNo || '').trim().toLowerCase()}|${String(it.partName || '').trim().toLowerCase()}`;

  const computeShipmentSummary = useMemo(() => {
    const map = new Map<string, number>();
    const src = shipment?.items || (initialForm?.items ?? []);
    src.forEach((it: any) => {
      const key = `${String(it.partNo || '').trim().toLowerCase()}|${String(it.partName || '').trim().toLowerCase()}`;
      map.set(key, (map.get(key) || 0) + Number(it.quantity || it.qty || 0));
    });
    return map;
  }, [shipment, initialForm]);

  const computeMemoSummary = useMemo(() => {
    const map = new Map<string, number>();
    manualItems.forEach(it => {
      const key = getKeyFromItem(it);
      map.set(key, (map.get(key) || 0) + Number(it.qty || 0));
    });
    return map;
  }, [manualItems]);

  const buildDiff = () => {
    const keys = new Set<string>([...computeShipmentSummary.keys(), ...computeMemoSummary.keys()]);
    const rows: { key: string; shipmentQty: number; memoQty: number }[] = [];
    keys.forEach(k => rows.push({ key: k, shipmentQty: computeShipmentSummary.get(k) || 0, memoQty: computeMemoSummary.get(k) || 0 }));
    return rows;
  };

  const handleCheck = () => {
    const rows = buildDiff();
    setDiffRows(rows);
    setChecked(true);
    // clear previous highlight
    setHighlightKey(null);
  };

  const reCheck = () => {
    const rows = buildDiff();
    setDiffRows(rows);
    setChecked(true);
  };

  const firstMismatchKey = () => diffRows.find(r => r.shipmentQty !== r.memoQty)?.key ?? null;

  const focusFirstMismatch = () => {
    const key = firstMismatchKey();
    if (!key) return;
    const el = rowRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightKey(key);
      // clear highlight after 2s
      setTimeout(() => setHighlightKey(null), 2000);
    } else {
      // not found in manual items - inform admin
      alert('Baris memo yang bermasalah tidak ditemukan pada daftar item memo. Silakan tambahkan atau perbaiki item yang sesuai.');
    }
  };

  const isMatch = diffRows.length > 0 && diffRows.every(r => r.shipmentQty === r.memoQty);

  const saveMemo = async (statusAfterSave: 'APPROVED' | 'IN_PROCESS') => {
    if (!id) return alert('Shipment id missing');
    if (!checked) return alert('Silakan Check Data terlebih dahulu');
    setSaving(true);
    try {
      const payload: any = {
        memoNo,
        goodsType,
        dangerLevel,
        specialPermit,
        destination,
        invoiceType,
        sapInfo,
        tpNo,
        tpDate: toISOForServer(tpDate),
        packingDetails,
        portOfDischarge,
        shipmentMethod,
        paymentMethod,
        exportType,
        etdShipment: toISOForServer(etdShipment),
        orderBy,
        deliveryTo,
        memoGoodsInfo: detailBarang,
        manualItems // backend may persist
      };
      await shipmentService.updateShipmentMemo(id, payload);
      await shipmentService.updateShipmentStatus(id, statusAfterSave);
      alert(statusAfterSave === 'APPROVED' ? 'Memo saved and shipment approved' : 'Memo saved as in-process');
      navigate('/shipments');
    } catch (err) {
      console.error(err);
      // show server response if present
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Gagal menyimpan memo';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Input Memo Shipment</h1>
          <p className="text-sm text-gray-500">Shipment: {shipment?.orderNo ?? id}</p>
        </div>
        <div>
          <Button variant="secondary" onClick={() => navigate('/shipments')}>Back</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {/* top fields (1..5) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">1. Jenis barang yang di export</label>
            <select className="input w-full" value={goodsType} onChange={(e) => setGoodsType(e.target.value)}>
              <option value="">-- pilih --</option>
              <option value="COMPONENT NON REGULER">COMPONENT NON REGULER</option>
              <option value="COMPONENT REGULER">COMPONENT REGULER</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">2. Tipe barang berdasarkan tingkat bahaya</label>
            <select className="input w-full" value={dangerLevel} onChange={(e) => setDangerLevel(e.target.value)}>
              <option value="">-- pilih --</option>
              <option value="NON DG (Dangerous)">NON DG (Dangerous)</option>
              <option value="DG (Dangerous)">DG (Dangerous)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">3. Apakah diperlukan izin khusus di negara tujuan</label>
            <select value={String(Boolean(specialPermit))} onChange={(e) => setSpecialPermit(e.target.value === 'true')} className="input w-full">
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <Input label="4. Tujuan pengiriman barang export" value={destination} onChange={(e) => setDestination(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">5. Jenis Invoice</label>
            <select className="input w-full" value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
              <option value="">-- pilih --</option>
              <option value="COMMERCIAL">COMMERCIAL</option>
              <option value="NON COMMERCIAL">NON COMMERCIAL</option>
            </select>
          </div>
          <Input label="SAP Info" value={sapInfo} onChange={(e) => setSapInfo(e.target.value)} />
          <Input label="TP No (boleh kosong)" value={tpNo ?? ''} onChange={(e) => setTpNo(e.target.value || null)} />
          <Input label="TP Date (boleh kosong)" type="date" value={tpDate ?? ''} onChange={(e) => setTpDate(e.target.value || null)} />
        </div>

        {/* 6,7,8,9..13 */}
        <Input label="6. Detail Barang (kategori / jenis / fungsi)" value={detailBarang} onChange={(e) => setDetailBarang(e.target.value)} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">7. Detail Kemasan (Packing details)</label>
          <textarea className="input w-full h-24" value={packingDetails} onChange={(e) => setPackingDetails(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-3 rounded">
            <div className="font-medium mb-2">Order By (Sold To)</div>
            <Input label="Company Name" value={orderBy.companyName ?? ''} onChange={(e) => setOrderBy({...orderBy, companyName: e.target.value})} />
            <Input label="Address" value={orderBy.address ?? ''} onChange={(e) => setOrderBy({...orderBy, address: e.target.value})} />
            <Input label="Country" value={orderBy.country ?? ''} onChange={(e) => setOrderBy({...orderBy, country: e.target.value})} />
            <Input label="Attention" value={orderBy.attention ?? ''} onChange={(e) => setOrderBy({...orderBy, attention: e.target.value})} />
            <Input label="Section" value={orderBy.section ?? ''} onChange={(e) => setOrderBy({...orderBy, section: e.target.value})} />
            <Input label="Phone" value={orderBy.phone ?? ''} onChange={(e) => setOrderBy({...orderBy, phone: e.target.value})} />
            <Input label="Fax" value={orderBy.fax ?? ''} onChange={(e) => setOrderBy({...orderBy, fax: e.target.value})} />
            <Input label="Email" value={orderBy.email ?? ''} onChange={(e) => setOrderBy({...orderBy, email: e.target.value})} />
          </div>

          <div className="border p-3 rounded">
            <div className="font-medium mb-2">Delivery To</div>
            <Input label="Company Name" value={deliveryTo.companyName ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, companyName: e.target.value})} />
            <Input label="Address" value={deliveryTo.address ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, address: e.target.value})} />
            <Input label="Country" value={deliveryTo.country ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, country: e.target.value})} />
            <Input label="Attention" value={deliveryTo.attention ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, attention: e.target.value})} />
            <Input label="Section" value={deliveryTo.section ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, section: e.target.value})} />
            <Input label="Phone" value={deliveryTo.phone ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, phone: e.target.value})} />
            <Input label="Fax" value={deliveryTo.fax ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, fax: e.target.value})} />
            <Input label="Email" value={deliveryTo.email ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, email: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="9. Port of Discharge" value={portOfDischarge} onChange={(e) => setPortOfDischarge(e.target.value)} />
          <Input label="10. Cara Pengiriman" value={shipmentMethod} onChange={(e) => setShipmentMethod(e.target.value)} />
          <Input label="11. Cara Pembayaran Pengirim" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
          <Input label="12. Jenis Export" value={exportType} onChange={(e) => setExportType(e.target.value)} />
          <Input label="13. ETD Shipment" type="date" value={etdShipment ?? ''} onChange={(e) => setEtdShipment(e.target.value || null)} />
        </div>

        {/* Manual items input */}
        <div>
          <h3 className="font-medium mb-2">Data Barang (input manual sesuai memo PDF)</h3>
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th className="px-3 py-2">No</th>
                  <th className="px-3 py-2">Part No</th>
                  <th className="px-3 py-2">Part Name</th>
                  <th className="px-3 py-2 text-right">Qty (pcs)</th>
                  <th className="px-3 py-2">Packing Khusus</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {manualItems.map((it, idx) => {
                  const rowKey = getKeyFromItem(it);
                  return (
                    <tr
                      key={idx}
                      ref={(el) => { rowRefs.current[rowKey] = el; }}
                      className={`border-b ${highlightKey === rowKey ? 'ring-2 ring-yellow-300 bg-yellow-50' : ''}`}
                    >
                      <td className="px-3 py-2">{it.no}</td>
                      <td className="px-3 py-2">
                        <input className="input" value={it.partNo} onChange={(e) => updateItem(idx, 'partNo', e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="input" value={it.partName} onChange={(e) => updateItem(idx, 'partName', e.target.value)} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input className="input text-right" type="number" value={it.qty} onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="input" value={it.specialPacking ?? ''} onChange={(e) => updateItem(idx, 'specialPacking', e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-600">Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <button type="button" onClick={addItem} className="text-primary-600 underline">+ Add item</button>
            <div className="flex items-center gap-3">
              <button onClick={handleCheck} className="px-3 py-1.5 bg-gray-100 rounded">Check Data</button>
              {checked && <div className={`text-sm ${isMatch ? 'text-green-600' : 'text-red-600'}`}>{isMatch ? 'Items match' : 'Items do NOT match'}</div>}
            </div>
          </div>

          {/* interactive diff panel */}
          {checked && (
            <div className="mt-3 bg-gray-50 p-3 rounded max-h-48 overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Perbedaan Items (Shipment vs Memo)</div>
                <div className="flex gap-2">
                  <button onClick={focusFirstMismatch} className="px-2 py-1 bg-yellow-100 rounded text-sm">Perbaiki</button>
                  <button onClick={reCheck} className="px-2 py-1 bg-gray-100 rounded text-sm">Re-Check</button>
                </div>
              </div>

              <table className="min-w-full text-sm">
                <thead className="text-xs text-gray-500">
                  <tr>
                    <th className="text-left px-2">Part</th>
                    <th className="text-right px-2">Shipment Qty</th>
                    <th className="text-right px-2">Memo Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {diffRows.map((r, i) => (
                    <tr key={i} className={r.shipmentQty !== r.memoQty ? 'bg-red-50' : ''}>
                      <td className="px-2">{r.key.split('|').map(s => s || '-').join(' / ')}</td>
                      <td className="px-2 text-right">{r.shipmentQty}</td>
                      <td className="px-2 text-right">{r.memoQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" onClick={() => navigate(`/shipments/${id}`)}>Cancel</Button>
          <Button disabled={!checked} onClick={() => saveMemo(isMatch ? 'APPROVED' : 'IN_PROCESS') } loading={saving}>
            {isMatch ? 'Save Memo & Approve' : 'Simpan Draft Memo (In Process)'}
          </Button>
        </div>
      </div>
    </div>
  );
};