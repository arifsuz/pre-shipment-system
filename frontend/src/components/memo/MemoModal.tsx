import React, { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { CreateShipmentData, Shipment } from '../../types';

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

type MemoData = {
  memoNo?: string;
  goodsType?: string; // 1. Jenis barang yang di export
  shipmentType?: string; // optional
  dangerLevel?: string; // 2.
  specialPermit?: boolean; // 3.
  destination?: string; // 4.
  invoiceType?: string; // 5.
  sapInfo?: string;
  tpNo?: string | null; // allow empty
  tpDate?: string | null; // allow empty
  packingDetails?: string; // 7. Detail Kemasan
  portOfDischarge?: string; // 9
  shipmentMethod?: string; // 10
  paymentMethod?: string; // 11
  exportType?: string; // 12
  etdShipment?: string; // 13
  orderBy?: Party;
  deliveryTo?: Party;
  memoGoodsInfo?: string; // 6. Detail Barang (text)
  manualItems: ManualItem[]; // items input manual (for memo)
};

interface Props {
  open: boolean;
  onClose: () => void;
  shipmentItems: Shipment['items'] | CreateShipmentData['items'];
  onSaveMemo: (memo: MemoData) => Promise<void>;
}

export const MemoModal: React.FC<Props> = ({ open, onClose, shipmentItems = [], onSaveMemo }) => {
  const toISOForServer = (dStr?: string | null) => {
    if (!dStr) return null;
    const dt = new Date(dStr);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  };

  const [memo, setMemo] = useState<MemoData>({
    memoNo: '',
    goodsType: '',
    shipmentType: '',
    dangerLevel: '',
    specialPermit: false,
    destination: '',
    invoiceType: '',
    sapInfo: '',
    tpNo: null,
    tpDate: null,
    packingDetails: '',
    portOfDischarge: '',
    shipmentMethod: '',
    paymentMethod: '',
    exportType: '',
    etdShipment: '',
    orderBy: {},
    deliveryTo: {},
    memoGoodsInfo: '',
    // manualItems start empty (user inputs memo items manually)
    manualItems: []
  });

  const [checked, setChecked] = useState(false);
  const [lastDiff, setLastDiff] = useState<{ key: string; shipmentQty: number; memoQty: number }[]>([]);

  const updateField = (k: keyof MemoData, v: any) => setMemo(prev => ({ ...prev, [k]: v }));
  const updatePartyField = (party: 'orderBy' | 'deliveryTo', field: keyof Party, v: any) =>
    setMemo(prev => ({ ...prev, [party]: { ...(prev[party] || {}), [field]: v } }));

  const addManualItem = () => {
    setMemo(prev => ({
      ...prev,
      manualItems: [...prev.manualItems, { no: prev.manualItems.length + 1, partNo: '', partName: '', qty: 1 }]
    }));
  };

  const removeManualItem = (idx: number) => {
    setMemo(prev => {
      const items = prev.manualItems.filter((_, i) => i !== idx).map((it, i) => ({ ...it, no: i + 1 }));
      return { ...prev, manualItems: items };
    });
  };

  const updateManualItem = (idx: number, k: keyof ManualItem, v: any) => {
    setMemo(prev => {
      const items = [...prev.manualItems];
      const next = { ...items[idx], [k]: v };
      if (k === 'pricePerPc' || k === 'qty') {
        next.totalAmount = Number(next.pricePerPc || 0) * Number(next.qty || 0);
      }
      items[idx] = next;
      return { ...prev, manualItems: items };
    });
  };

  const computeShipmentSummary = useMemo(() => {
    const map = new Map<string, number>();
    (shipmentItems || []).forEach((it: any) => {
      const key = `${String(it.partNo || '').trim().toLowerCase()}|${String(it.partName || '').trim().toLowerCase()}`;
      map.set(key, (map.get(key) || 0) + Number(it.quantity || it.qty || 0));
    });
    return map;
  }, [shipmentItems]);

  const computeMemoManualSummary = useMemo(() => {
    const map = new Map<string, number>();
    memo.manualItems.forEach(it => {
      const key = `${String(it.partNo || '').trim().toLowerCase()}|${String(it.partName || '').trim().toLowerCase()}`;
      map.set(key, (map.get(key) || 0) + Number(it.qty || 0));
    });
    return map;
  }, [memo.manualItems]);

  const diff = useMemo(() => {
    const keys = new Set<string>([...computeShipmentSummary.keys(), ...computeMemoManualSummary.keys()]);
    const rows: { key: string; shipmentQty: number; memoQty: number }[] = [];
    keys.forEach(k => {
      rows.push({ key: k, shipmentQty: computeShipmentSummary.get(k) || 0, memoQty: computeMemoManualSummary.get(k) || 0 });
    });
    return rows;
  }, [computeShipmentSummary, computeMemoManualSummary]);

  const totals = useMemo(() => {
    const totalQty = memo.manualItems.reduce((s, it) => s + Number(it.qty || 0), 0);
    const totalAmount = memo.manualItems.reduce((s, it) => s + Number(it.totalAmount || 0), 0);
    return { totalQty, totalAmount };
  }, [memo.manualItems]);

  const isMatch = diff.length > 0 && diff.every(r => r.shipmentQty === r.memoQty);

  const handleCheck = () => {
    setLastDiff(diff);
    setChecked(true);
  };

  const handleSave = async () => {
    if (!checked) {
      alert('Silakan cek data terlebih dahulu (Check Data).');
      return;
    }
    if (!isMatch) {
      alert('Data barang tidak cocok. Perbaiki dahulu atau simpan sebagai draft.');
      return;
    }
    // convert date fields to ISO before sending
    const payload = { ...memo, tpDate: toISOForServer(memo.tpDate), etdShipment: toISOForServer(memo.etdShipment) };
    await onSaveMemo(payload as any);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Input Memo Shipment</h3>
            <p className="text-sm text-gray-500">Lengkapi semua field memo sebelum melakukan validasi dan approve</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm text-gray-600">Close</button>
          </div>
        </div>

        <div className="p-5 space-y-6 max-h-[72vh] overflow-auto">
          {/* 1..4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">1. Jenis barang yang di export</label>
              <select className="input w-full" value={memo.goodsType ?? ''} onChange={(e) => updateField('goodsType', e.target.value)}>
                <option value="">-- pilih --</option>
                <option value="COMPONENT NON REGULER">COMPONENT NON REGULER</option>
                <option value="COMPONENT REGULER">COMPONENT REGULER</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">2. Tipe barang berdasarkan tingkat bahaya</label>
              <select className="input w-full" value={memo.dangerLevel ?? ''} onChange={(e) => updateField('dangerLevel', e.target.value)}>
                <option value="">-- pilih --</option>
                <option value="NON DG (Dangerous)">NON DG (Dangerous)</option>
                <option value="DG (Dangerous)">DG (Dangerous)</option>
              </select>
            </div>
          </div>

          {/* 5. Invoice / SAP / TP group */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">5. Jenis Invoice</label>
              <select className="input w-full" value={memo.invoiceType ?? ''} onChange={(e) => updateField('invoiceType', e.target.value)}>
                <option value="">-- pilih --</option>
                <option value="COMMERCIAL">COMMERCIAL</option>
                <option value="NON COMMERCIAL">NON COMMERCIAL</option>
              </select>
            </div>
            <Input label="SAP Info" value={memo.sapInfo ?? ''} onChange={(e) => updateField('sapInfo', e.target.value)} />
            <Input label="TP No (boleh kosong)" value={memo.tpNo ?? ''} onChange={(e) => updateField('tpNo', e.target.value || null)} />
            <Input label="TP Date (boleh kosong)" type="date" value={memo.tpDate ?? ''} onChange={(e) => updateField('tpDate', e.target.value || null)} />
          </div>

          {/* 6. Detail Barang (text) */}
          <div>
            <Input label="6. Detail Barang (kategori / jenis / fungsi)" value={memo.memoGoodsInfo ?? ''} onChange={(e) => updateField('memoGoodsInfo', e.target.value)} />
          </div>

          {/* 7. Detail Kemasan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">7. Detail Kemasan (Packing details)</label>
            <textarea value={memo.packingDetails ?? ''} onChange={(e) => updateField('packingDetails', e.target.value)} className="input w-full h-24" placeholder="Deskripsi kemasan / packing, dimensi, pcs per carton, dll." />
          </div>

          {/* 8. Consignee & Destination */}
          <div>
            <h4 className="text-sm font-medium mb-2">8. Consignee & Destination</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-3 bg-white">
                <div className="text-sm font-medium mb-2">Order By (Sold To)</div>
                <Input label="Company Name" value={memo.orderBy?.companyName ?? ''} onChange={(e) => updatePartyField('orderBy', 'companyName', e.target.value)} />
                <Input label="Address" value={memo.orderBy?.address ?? ''} onChange={(e) => updatePartyField('orderBy', 'address', e.target.value)} />
                <Input label="Country" value={memo.orderBy?.country ?? ''} onChange={(e) => updatePartyField('orderBy', 'country', e.target.value)} />
                <Input label="Attention" value={memo.orderBy?.attention ?? ''} onChange={(e) => updatePartyField('orderBy', 'attention', e.target.value)} />
                <Input label="Section" value={memo.orderBy?.section ?? ''} onChange={(e) => updatePartyField('orderBy', 'section', e.target.value)} />
                <Input label="Phone" value={memo.orderBy?.phone ?? ''} onChange={(e) => updatePartyField('orderBy', 'phone', e.target.value)} />
                <Input label="Fax" value={memo.orderBy?.fax ?? ''} onChange={(e) => updatePartyField('orderBy', 'fax', e.target.value)} />
                <Input label="Email" value={memo.orderBy?.email ?? ''} onChange={(e) => updatePartyField('orderBy', 'email', e.target.value)} />
              </div>

              <div className="border rounded-md p-3 bg-white">
                <div className="text-sm font-medium mb-2">Delivery To</div>
                <Input label="Company Name" value={memo.deliveryTo?.companyName ?? ''} onChange={(e) => updatePartyField('deliveryTo', 'companyName', e.target.value)} />
                <Input label="Address" value={memo.deliveryTo?.address ?? ''} onChange={(e) => updatePartyField('deliveryTo', 'address', e.target.value)} />
                <Input label="Country" value={memo.deliveryTo?.country ?? ''} onChange={(e) => updatePartyField('deliveryTo', 'country', e.target.value)} />
                <Input label="Attention" value={memo.deliveryTo?.attention ?? ''} onChange={(e) => updatePartyField('deliveryTo', 'attention', e.target.value)} />
                <Input label="Section" value={memo.deliveryTo?.section ?? ''} onChange={(e) => updatePartyField('deliveryTo', 'section', e.target.value)} />
                <Input label="Phone" value={memo.deliveryTo?.phone ?? ''} onChange={(e) => updatePartyField('deliveryTo', 'phone', e.target.value)} />
                <Input label="Fax" value={memo.deliveryTo?.fax ?? ''} onChange={(e) => updatePartyField('deliveryTo', 'fax', e.target.value)} />
                <Input label="Email" value={memo.deliveryTo?.email ?? ''} onChange={(e) => updatePartyField('deliveryTo', 'email', e.target.value)} />
              </div>
            </div>
          </div>

          {/* 9..13 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="9. Port of Discharge" value={memo.portOfDischarge ?? ''} onChange={(e) => updateField('portOfDischarge', e.target.value)} />
            <Input label="10. Cara Pengiriman" value={memo.shipmentMethod ?? ''} onChange={(e) => updateField('shipmentMethod', e.target.value)} />
            <Input label="11. Cara Pembayaran Pengirim" value={memo.paymentMethod ?? ''} onChange={(e) => updateField('paymentMethod', e.target.value)} />
            <Input label="12. Jenis Export" value={memo.exportType ?? ''} onChange={(e) => updateField('exportType', e.target.value)} />
            <Input label="13. ETD Shipment" type="date" value={memo.etdShipment ?? ''} onChange={(e) => updateField('etdShipment', e.target.value)} />
          </div>

          {/* Manual items input (user inputs memo item list here) */}
          <div>
            <h4 className="text-sm font-medium mb-2">Data Barang (input manual sesuai memo PDF)</h4>
            <div className="overflow-auto border rounded-md">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">No</th>
                    <th className="px-3 py-2 text-left">Part No</th>
                    <th className="px-3 py-2 text-left">Part Name</th>
                    <th className="px-3 py-2 text-right">Qty (pcs)</th>
                    <th className="px-3 py-2 text-right">Price / PCS (USD)</th>
                    <th className="px-3 py-2 text-right">Total Amount (USD)</th>
                    <th className="px-3 py-2 text-left">Packing Khusus</th>
                    <th className="px-3 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memo.manualItems.map((it, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2">{it.no}</td>
                      <td className="px-3 py-2"><input className="input" value={it.partNo} onChange={(e) => updateManualItem(idx, 'partNo', e.target.value)} /></td>
                      <td className="px-3 py-2"><input className="input" value={it.partName} onChange={(e) => updateManualItem(idx, 'partName', e.target.value)} /></td>
                      <td className="px-3 py-2 text-right"><input className="input text-right" type="number" value={it.qty} onChange={(e) => updateManualItem(idx, 'qty', Number(e.target.value))} /></td>
                      <td className="px-3 py-2 text-right"><input className="input text-right" type="number" value={it.pricePerPc ?? 0} onChange={(e) => updateManualItem(idx, 'pricePerPc', Number(e.target.value))} /></td>
                      <td className="px-3 py-2 text-right">{(it.totalAmount ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-2"><input className="input" value={it.specialPacking ?? ''} onChange={(e) => updateManualItem(idx, 'specialPacking', e.target.value)} /></td>
                      <td className="px-3 py-2 text-center"><button type="button" onClick={() => removeManualItem(idx)} className="text-sm text-red-600">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-3 py-2 font-medium">Total</td>
                    <td className="px-3 py-2 text-right font-medium">{totals.totalQty}</td>
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2 text-right font-medium">{totals.totalAmount.toFixed(2)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <button type="button" onClick={addManualItem} className="text-sm text-primary-600 underline">+ Add item</button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleCheck} className="inline-flex items-center px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm">Check Data</button>
                {checked && (
                  <div className={`text-sm ${isMatch ? 'text-green-600' : 'text-red-600'}`}>
                    {isMatch ? 'Items match' : 'Items do NOT match'}
                  </div>
                )}
              </div>
            </div>

            {checked && (
              <div className="mt-3 bg-gray-50 rounded-md p-3">
                <div className="max-h-40 overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-xs text-gray-500">
                      <tr>
                        <th className="text-left px-2">Part</th>
                        <th className="text-right px-2">Shipment Qty</th>
                        <th className="text-right px-2">Memo Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastDiff.map((r, i) => (
                        <tr key={i} className={r.shipmentQty !== r.memoQty ? 'bg-red-50' : ''}>
                          <td className="px-2">{r.key.split('|').map(s => s || '-').join(' / ')}</td>
                          <td className="px-2 text-right">{r.shipmentQty}</td>
                          <td className="px-2 text-right">{r.memoQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!checked || !isMatch} onClick={handleSave}>Save Memo & Approve</Button>
        </div>
      </div>
    </div>
  );
};