import React, { useMemo, useEffect, useState } from 'react';
import type { Shipment } from '../../types';
import { companyService } from '../../services/companyService';

export const MemoDetailView: React.FC<{ memo: Shipment }> = ({ memo }) => {
  const formatDate = (d?: string | null) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString();
  };
  const formatCurrency = (v?: number | null) => {
    if (v == null) return '-';
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // support both memo.orderBy and memo.order_by etc.
  const [orderBy, setOrderBy] = useState<any>(memo.orderBy ?? memo.order_by ?? null);
  // backend/types sometimes use 'deliverTo' or 'deliveryTo'
  const [deliveryTo, setDeliveryTo] = useState<any>(memo.deliverTo ?? memo.deliveryTo ?? memo.deliver_to ?? null);

  // helper to pick possible id fields
  const pickId = (obj: any, keys: string[]) => {
    if (!obj) return null;
    for (const k of keys) if (obj[k]) return obj[k];
    return null;
  };

  const normalizeCompany = (c: any) => {
    if (!c) return null;
    const contact = c.contact ?? c.contactPerson ?? {};
    return {
      id: c.id ?? c._id ?? c.companyId ?? c.company_id,
      companyName: c.companyName ?? c.name ?? c.company ?? c.company_name ?? c.companyName,
      address: c.address ?? c.addr ?? c.alamat ?? c.location?.address,
      country:
        c.country ??
        c.negara ??
        c.countryName ??
        c.country_code ??
        c.location?.country ??
        (contact && (contact.country || contact.negara)),
      attention:
        c.attention ??
        c.contactPerson ??
        c.contact_person ??
        contact?.name ??
        contact?.contactName,
      section: c.section ?? c.division ?? c.department ?? c.sectionName ?? contact?.section,
      phone: c.phone ?? c.telephone ?? c.telp ?? contact?.phone ?? contact?.tel,
      fax: c.fax ?? c.faxNumber ?? c.fax_no ?? contact?.fax,
      email: c.email ?? c.emailAddress ?? c.contactEmail ?? contact?.email,
      ...c
    };
  };

  useEffect(() => {
    let mounted = true;

    // initialize from memo (support different field names)
    setOrderBy(normalizeCompany(memo.orderBy ?? memo.order_by ?? memo.orderById ? memo.orderBy : memo.orderBy));
    setDeliveryTo(normalizeCompany(memo.deliverTo ?? memo.deliveryTo ?? memo.deliver_to ?? memo.deliverToId ? memo.deliverTo : memo.deliveryTo));

    const tryFetchCompany = async (id: string | number, setter: (c: any) => void, existing?: any) => {
      if (!id) return;
      try {
        let data: any = null;

        // prefer companyService.getAll (companyService in frontend provides getAll)
        if ((companyService as any).getCompanyById) {
          const res = await (companyService as any).getCompanyById(String(id));
          data = res?.data ?? res;
        } else if ((companyService as any).getById) {
          const res = await (companyService as any).getById(String(id));
          data = res?.data ?? res;
        } else {
          // fallback to getAll and find
          const all = await (companyService as any).getAll();
          const list = Array.isArray(all) ? all : all?.data ?? [];
          data = Array.isArray(list) ? list.find((x: any) => String(x.id) === String(id) || String(x._id) === String(id)) : null;
        }

        if (!data) return;

        const normalized = normalizeCompany(data);
        // merge existing (prefer full fetch for missing fields)
        const merged = { ...(existing ?? {}), ...(normalized ?? {}) };
        if (mounted) setter(merged);
      } catch (err) {
        console.error('Error fetching company', id, err);
      }
    };

    // try to detect orderBy id from various possible keys
    const orderById =
      pickId(memo, ['orderById', 'order_by_id', 'order_by', 'orderByCompanyId', 'order_by_company_id', 'soldToId', 'soldTo', 'orderBy']) ??
      pickId(memo.orderBy ?? memo.order_by ?? {}, ['id', '_id', 'companyId']);
    if ((!memo.orderBy && !memo.order_by) || (orderBy && (!orderBy.country || !orderBy.fax || !orderBy.section))) {
      if (orderById) tryFetchCompany(orderById, setOrderBy, orderBy);
    }

    const deliveryId =
      pickId(memo, ['deliverToId', 'deliver_to_id', 'deliveryToId', 'delivery_to_id', 'deliveryToCompanyId', 'consigneeId', 'deliverTo', 'deliver_to', 'deliverToId']) ??
      pickId(memo.deliverTo ?? memo.deliveryTo ?? {}, ['id', '_id', 'companyId']);
    if ((!memo.deliverTo && !memo.deliveryTo) || (deliveryTo && (!deliveryTo.country || !deliveryTo.fax || !deliveryTo.section))) {
      if (deliveryId) tryFetchCompany(deliveryId, setDeliveryTo, deliveryTo);
    }

    return () => {
      mounted = false;
    };
  }, [memo]);

  const totals = useMemo(() => {
    const items = memo?.items ?? [];
    const totalQty = items.reduce((s, it) => s + Number(it.quantity ?? it.qty ?? 0), 0);
    const totalAmount = items.reduce((s, it) => {
      const t = Number(it.totalAmount ?? 0);
      if (t > 0) return s + t;
      const qty = Number(it.quantity ?? it.qty ?? 0);
      const price = Number(it.pricePerPcs ?? (it as any).pricePerPc ?? 0);
      return s + qty * price;
    }, 0);
    return { totalQty, totalAmount };
  }, [memo?.items]);

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* 1-5 utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">1. Jenis barang yang di export</label>
          <div className="mt-1 text-sm text-gray-900">{memo.goodsType ?? '-'}</div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">2. Tipe barang berdasarkan tingkat bahaya</label>
          <div className="mt-1 text-sm text-gray-900">{memo.dangerLevel ?? '-'}</div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">3. Perlu izin khusus di tujuan</label>
          <div className="mt-1 text-sm text-gray-900">{memo.specialPermit ? 'Ya' : 'Tidak'}</div>
        </div>

        <div className="md:col-span-3">
          <label className="text-sm font-medium text-gray-500">4. Tujuan pengiriman (Destination)</label>
          <div className="mt-1 text-sm text-gray-900">{memo.destination ?? '-'}</div>
        </div>

        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">5. Jenis Invoice</label>
            <div className="mt-1 text-sm text-gray-900">{memo.invoiceType ?? '-'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">SAP Info</label>
            <div className="mt-1 text-sm text-gray-900">{memo.sapInfo ?? '-'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">TP No</label>
            <div className="mt-1 text-sm text-gray-900">{memo.tpNo ?? '-'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">TP Date</label>
            <div className="mt-1 text-sm text-gray-900">{formatDate(memo.tpDate as any)}</div>
          </div>
        </div>
      </div>

      {/* 6. Detail Barang */}
      <div>
        <label className="text-sm font-medium text-gray-500">6. Detail Barang</label>
        <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{memo.memoGoodsInfo ?? '-'}</div>
      </div>

      {/* 7. Detail Kemasan */}
      <div>
        <label className="text-sm font-medium text-gray-500">7. Detail Kemasan</label>
        <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{memo.packingDetails ?? '-'}</div>
      </div>

      {/* 8. Consignee & Destination (Order By / Delivery To) - side by side */}
      <label className="text-sm font-medium text-gray-500">8. Consignee & Destination (Order By / Delivery To)</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <div className="text-sm font-medium text-gray-600 mb-2">Order By (Sold To)</div>
          <div className="text-sm text-gray-900">
            <div><strong>Company Name :</strong> {orderBy?.companyName ?? orderBy?.name ?? '-'}</div>
            <div><strong>Address :</strong> {orderBy?.address ?? '-'}</div>
            <div><strong>Country :</strong> {orderBy?.country ?? '-'}</div>
            <div><strong>Attention :</strong> {orderBy?.attention ?? '-'}</div>
            <div><strong>Section :</strong> {orderBy?.section ?? '-'}</div>
            <div><strong>Phone :</strong> {orderBy?.phone ?? '-'}</div>
            <div><strong>Fax :</strong> {orderBy?.fax ?? '-'}</div>
            <div><strong>Email :</strong> {orderBy?.email ?? '-'}</div>
          </div>
        </div>

        <div className="border rounded p-4">
          <div className="text-sm font-medium text-gray-600 mb-2">Delivery To (Consignee)</div>
          <div className="text-sm text-gray-900">
            <div><strong>Company Name :</strong> {deliveryTo?.companyName ?? deliveryTo?.name ?? '-'}</div>
            <div><strong>Address :</strong> {deliveryTo?.address ?? '-'}</div>
            <div><strong>Country :</strong> {deliveryTo?.country ?? '-'}</div>
            <div><strong>Attention :</strong> {deliveryTo?.attention ?? '-'}</div>
            <div><strong>Section :</strong> {deliveryTo?.section ?? '-'}</div>
            <div><strong>Phone :</strong> {deliveryTo?.phone ?? '-'}</div>
            <div><strong>Fax :</strong> {deliveryTo?.fax ?? '-'}</div>
            <div><strong>Email :</strong> {deliveryTo?.email ?? '-'}</div>
          </div>
        </div>
      </div>

      {/* 9-13 fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">9. Port of Discharge</label>
          <div className="mt-1 text-sm text-gray-900">{memo.portOfDischarge ?? '-'}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">10. Cara Pengiriman</label>
          <div className="mt-1 text-sm text-gray-900">{memo.shipmentMethod ?? '-'}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">11. Cara Pembayaran Pengirim</label>
          <div className="mt-1 text-sm text-gray-900">{memo.paymentMethod ?? '-'}</div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500">12. Jenis Export</label>
          <div className="mt-1 text-sm text-gray-900">{memo.exportType ?? '-'}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">13. ETD Shipment</label>
          <div className="mt-1 text-sm text-gray-900">{formatDate(memo.etdShipment as any)}</div>
        </div>
      </div>

      {/* Detail Barang table */}
      <div>
        <h3 className="text-lg font-medium mb-2">Detail Barang (Manual Items)</h3>
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">No</th>
                <th className="px-3 py-2 text-left">Part No</th>
                <th className="px-3 py-2 text-left">Part Name</th>
                <th className="px-3 py-2 text-right">Qty (pcs)</th>
                <th className="px-3 py-2 text-right">Price / PCS (USD)</th>
                <th className="px-3 py-2 text-right">Total Amount (USD)</th>
                <th className="px-3 py-2 text-left">Packing Khusus</th>
              </tr>
            </thead>
            <tbody>
              {(memo.items || []).map((it: any, idx: number) => (
                <tr key={it.id ?? idx} className="border-b">
                  <td className="px-3 py-2">{it.no ?? idx + 1}</td>
                  <td className="px-3 py-2">{it.partNo ?? '-'}</td>
                  <td className="px-3 py-2">{it.partName ?? '-'}</td>
                  <td className="px-3 py-2 text-right">{Number(it.quantity ?? it.qty ?? 0)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(Number(it.pricePerPcs ?? (it as any).pricePerPc ?? 0))}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(Number(it.totalAmount ?? (Number(it.quantity ?? it.qty ?? 0) * Number(it.pricePerPcs ?? (it as any).pricePerPc ?? 0))))}</td>
                  <td className="px-3 py-2">{it.specialPacking ?? '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-sm font-medium">Total</td>
                <td className="px-3 py-2 text-right font-medium">{totals.totalQty}</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(totals.totalAmount)}</td>
                <td className="px-3 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};