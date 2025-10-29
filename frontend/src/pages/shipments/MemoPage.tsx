import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { shipmentService } from '../../services/shipmentService';
import { companyService } from '../../services/companyService';
import type { Shipment, Company } from '../../types';

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
  id?: string;
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

  // NEW: detect whether any memo input exists (so Draft button can be enabled even if unchecked)
  const hasAnyMemoInput = useMemo(() => {
    const partyHasValue = (p: Party) => !!p && Object.values(p).some(v => v !== undefined && v !== null && String(v).trim() !== '');
    return !!(
      memoNo ||
      goodsType ||
      dangerLevel ||
      specialPermit ||
      destination ||
      invoiceType ||
      sapInfo ||
      tpNo ||
      tpDate ||
      packingDetails ||
      portOfDischarge ||
      shipmentMethod ||
      paymentMethod ||
      exportType ||
      etdShipment ||
      detailBarang ||
      manualItems.length > 0 ||
      partyHasValue(orderBy) ||
      partyHasValue(deliveryTo)
    );
  }, [memoNo, goodsType, dangerLevel, specialPermit, destination, invoiceType, sapInfo, tpNo, tpDate, packingDetails, portOfDischarge, shipmentMethod, paymentMethod, exportType, etdShipment, detailBarang, manualItems, orderBy, deliveryTo]);

  // NEW: derive current action based on whether admin has checked and whether items match
  const currentAction = useMemo<'DRAFT' | 'IN_PROCESS' | 'APPROVED' | null>(() => {
    if (!hasAnyMemoInput) return null;
    if (!checked) return 'DRAFT';
    return isMatch ? 'APPROVED' : 'IN_PROCESS';
  }, [hasAnyMemoInput, checked, isMatch]);

  // UPDATED: saveMemo now handles DRAFT / IN_PROCESS / APPROVED semantics
  const saveMemo = async (statusAfterSave: 'DRAFT' | 'IN_PROCESS' | 'APPROVED') => {
    if (!id) return;
    try {
      setSaving(true);
      const payload = buildMemoPayload();

      if (statusAfterSave === 'APPROVED') {
        // publish memo and set shipment status to APPROVED
        await shipmentService.publishMemo(id, {
          ...payload,
          setShipmentStatus: 'APPROVED'
        });
        alert('Memo saved and shipment approved');
        // redirect to Data Shipment page
        navigate('/shipments');
      } else if (statusAfterSave === 'IN_PROCESS') {
        // save draft and set shipment status to IN_PROCESS
        await shipmentService.updateShipmentMemo(id, payload);
        await shipmentService.updateShipmentStatus(id, 'IN_PROCESS');
        alert('Memo saved as In Process');
        // redirect to Data Shipment page
        navigate('/shipments');
      } else {
        // DRAFT: save draft but keep shipment.status as DRAFT (do NOT change status)
        await shipmentService.updateShipmentMemo(id, payload);
        alert('Memo saved as Draft');
        // redirect to Data Shipment page
        navigate('/shipments');
      }
    } catch (err) {
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Gagal menyimpan memo';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  // autosave helpers
  const autosaveTimer = useRef<number | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);

  // load existing memo draft (if any)
  useEffect(() => {
    let mounted = true;
    if (!id) return;
    (async () => {
      try {
        const res: any = await shipmentService.getShipmentMemo(id);
        if (!mounted || !res) return;
        // backend returns { success: true, data: memo }
        const memo = res.data ?? res;
        if (!memo) return;

        if (memo.memoNo) setMemoNo(memo.memoNo);
        if (memo.goodsType) setGoodsType(memo.goodsType);
        if (memo.dangerLevel) setDangerLevel(memo.dangerLevel);
        if (memo.specialPermit !== undefined) setSpecialPermit(Boolean(memo.specialPermit));
        if (memo.destination) setDestination(memo.destination);
        if (memo.invoiceType) setInvoiceType(memo.invoiceType);
        if (memo.sapInfo) setSapInfo(memo.sapInfo);
        if (memo.tpNo !== undefined) setTpNo(memo.tpNo);
        if (memo.tpDate) setTpDate(toDateInput(memo.tpDate) || null);
        if (memo.packingDetails) setPackingDetails(memo.packingDetails);
        if (memo.portOfDischarge) setPortOfDischarge(memo.portOfDischarge);
        if (memo.shipmentMethod) setShipmentMethod(memo.shipmentMethod);
        if (memo.paymentMethod) setPaymentMethod(memo.paymentMethod);
        if (memo.exportType) setExportType(memo.exportType);
        if (memo.etdShipment) setEtdShipment(toDateInput(memo.etdShipment) || null);

        if (memo.orderBy) setOrderBy(memo.orderBy);
        if (memo.deliveryTo) setDeliveryTo(memo.deliveryTo);

        // manualItems stored in memo.manualItems (structured) or memoGoodsInfo (fallback JSON)
        if (Array.isArray(memo.manualItems) && memo.manualItems.length) {
          setManualItems(memo.manualItems.map((it: any, i: number) => ({
            no: it.no ?? i + 1,
            partNo: it.partNo ?? '',
            partName: it.partName ?? '',
            qty: Number(it.qty ?? it.quantity ?? 0),
            pricePerPc: it.pricePerPc ?? undefined,
            totalAmount: it.totalAmount ?? undefined,
            specialPacking: it.specialPacking ?? undefined
          })));
        } else if (memo.memoGoodsInfo) {
          try {
            const parsed = JSON.parse(memo.memoGoodsInfo);
            if (Array.isArray(parsed)) {
              setManualItems(parsed.map((it: any, i: number) => ({
                no: it.no ?? i + 1,
                partNo: it.partNo ?? '',
                partName: it.partName ?? '',
                qty: Number(it.qty ?? it.quantity ?? 0),
                pricePerPc: it.pricePerPc ?? undefined,
                totalAmount: it.totalAmount ?? undefined,
                specialPacking: it.specialPacking ?? undefined
              })));
              setDetailBarang('');
            } else {
              setDetailBarang(String(memo.memoGoodsInfo));
            }
          } catch {
            setDetailBarang(String(memo.memoGoodsInfo));
          }
        }
      } catch (err) {
        // silent
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // build memo payload helper
  const buildMemoPayload = useCallback(() => ({
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
    manualItems
  }), [memoNo, goodsType, dangerLevel, specialPermit, destination, invoiceType, sapInfo, tpNo, tpDate, packingDetails, portOfDischarge, shipmentMethod, paymentMethod, exportType, etdShipment, orderBy, deliveryTo, detailBarang, manualItems]);

  // autosave debounce
  useEffect(() => {
    if (!id) return;
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    autosaveTimer.current = window.setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        const payload = buildMemoPayload();
        await shipmentService.updateShipmentMemo(id, payload);
        setLastAutoSavedAt(new Date().toISOString());
      } catch (err) {
        console.error('Autosave memo failed', err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 1200);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };
  }, [id, buildMemoPayload]);

  // flush on unload/unmount using keepalive fetch
  const flushAutosave = useCallback(async () => {
    if (!id) return;
    try {
      const payload = buildMemoPayload();
      await fetch(`/api/shipments/${id}/memo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (err) {
      // ignore
    }
  }, [id, buildMemoPayload]);

  useEffect(() => {
    return () => { flushAutosave(); };
  }, [flushAutosave]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      flushAutosave();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [flushAutosave]);

  // handle Cancel -> delete memo draft then navigate back
  const handleCancel = async () => {
    if (!id) return navigate('/shipments');
    try {
      await shipmentService.deleteShipmentMemo(id);
    } catch (err) {
      // ignore delete errors
    } finally {
      navigate(`/shipments/${id}`);
    }
  };

  // load company list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await companyService.getAll();
        if (mounted) setCompanies(list);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const [companies, setCompanies] = useState<Company[]>([]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Input Memo Shipment</h1>
          <p className="text-sm text-gray-500">Shipment: {shipment?.orderNo ?? id}</p>
        </div>
        <div>
          <Button variant="secondary" onClick={() => { flushAutosave(); navigate('/shipments'); }}>Back</Button>
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
            <select
              className="input w-full mb-2"
              value={orderBy.id ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return setOrderBy({});
                if (val === '__manual__') return setOrderBy({});
                const c = companies.find(x => String(x.id) === val);
                if (c) {
                  // normalize company object into Party
                  setOrderBy({
                    id: String((c as any).id ?? (c as any)._id ?? ''),
                    companyName: (c as any).companyName ?? (c as any).name ?? (c as any).company ?? '',
                    address: (c as any).address ?? '',
                    country: (c as any).country ?? '',
                    attention: (c as any).attention ?? '',
                    section: (c as any).section ?? '',
                    phone: (c as any).phone ?? (c as any).telephone ?? '',
                    fax: (c as any).fax ?? '',
                    email: (c as any).email ?? ''
                  });
                }
              }}
            >
              <option value="">-- pilih company / manual --</option>
              {companies.map(c => (
                <option key={String((c as any).id ?? '')} value={String((c as any).id ?? '')}>
                  {((c as any).companyName ?? (c as any).name ?? (c as any).company) || String((c as any).id)}
                </option>
              ))}
              <option value="__manual__">-- Manual input --</option>
            </select>
            <Input label="Company Name" value={orderBy.companyName ?? ''} onChange={(e) => setOrderBy({...orderBy, id: undefined, companyName: e.target.value})} />
            <Input label="Address" value={orderBy.address ?? ''} onChange={(e) => setOrderBy({...orderBy, id: undefined, address: e.target.value})} />
            <Input label="Country" value={orderBy.country ?? ''} onChange={(e) => setOrderBy({...orderBy, id: undefined, country: e.target.value})} />
            <Input label="Attention" value={orderBy.attention ?? ''} onChange={(e) => setOrderBy({...orderBy, id: undefined, attention: e.target.value})} />
            <Input label="Section" value={orderBy.section ?? ''} onChange={(e) => setOrderBy({...orderBy, id: undefined, section: e.target.value})} />
            <Input label="Phone" value={orderBy.phone ?? ''} onChange={(e) => setOrderBy({...orderBy, id: undefined, phone: e.target.value})} />
            <Input label="Fax" value={orderBy.fax ?? ''} onChange={(e) => setOrderBy({...orderBy, id: undefined, fax: e.target.value})} />
            <Input label="Email" value={orderBy.email ?? ''} onChange={(e) => setOrderBy({...orderBy, id: undefined, email: e.target.value})} />
          </div>

          <div className="border p-3 rounded">
            <div className="font-medium mb-2">Delivery To</div>
            <select
              className="input w-full mb-2"
              value={deliveryTo.id ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return setDeliveryTo({});
                if (val === '__manual__') return setDeliveryTo({});
                const c = companies.find(x => String(x.id) === val);
                if (c) {
                  setDeliveryTo({
                    id: String((c as any).id ?? (c as any)._id ?? ''),
                    companyName: (c as any).companyName ?? (c as any).name ?? '',
                    address: (c as any).address ?? '',
                    country: (c as any).country ?? '',
                    attention: (c as any).attention ?? '',
                    section: (c as any).section ?? '',
                    phone: (c as any).phone ?? '',
                    fax: (c as any).fax ?? '',
                    email: (c as any).email ?? ''
                  });
                }
              }}
            >
              <option value="">-- pilih company / manual --</option>
              {companies.map(c => (
                <option key={String((c as any).id ?? '')} value={String((c as any).id ?? '')}>
                  {((c as any).companyName ?? (c as any).name ?? (c as any).company) || String((c as any).id)}
                </option>
              ))}
              <option value="__manual__">-- Manual input --</option>
            </select>
            <Input label="Company Name" value={deliveryTo.companyName ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, id: undefined, companyName: e.target.value})} />
            <Input label="Address" value={deliveryTo.address ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, id: undefined, address: e.target.value})} />
            <Input label="Country" value={deliveryTo.country ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, id: undefined, country: e.target.value})} />
            <Input label="Attention" value={deliveryTo.attention ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, id: undefined, attention: e.target.value})} />
            <Input label="Section" value={deliveryTo.section ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, id: undefined, section: e.target.value})} />
            <Input label="Phone" value={deliveryTo.phone ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, id: undefined, phone: e.target.value})} />
            <Input label="Fax" value={deliveryTo.fax ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, id: undefined, fax: e.target.value})} />
            <Input label="Email" value={deliveryTo.email ?? ''} onChange={(e) => setDeliveryTo({...deliveryTo, id: undefined, email: e.target.value})} />
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
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>

          <Button
            disabled={!currentAction}
            onClick={() => currentAction && saveMemo(currentAction)}
            loading={saving}
          >
            {currentAction === 'APPROVED' ? 'Save Memo & Approve' :
             currentAction === 'IN_PROCESS' ? 'Simpan Draft Memo (In Process)' :
             'Simpan Draft Memo (Draft)'}
          </Button>
        </div>
      </div>
    </div>
  );
};