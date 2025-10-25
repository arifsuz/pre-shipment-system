// frontend/src/pages/shipments/ShipmentForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft, Upload } from 'lucide-react';
import { ExcelUpload } from '../../components/upload/ExcelUpload';
import { shipmentService } from '../../services/shipmentService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { CreateShipmentData, Shipment } from '../../types';
import { MemoModal } from '../../components/memo/MemoModal';

export const ShipmentForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [showExcelUpload, setShowExcelUpload] = useState(false); // added
    const [formData, setFormData] = useState<CreateShipmentData>({
        shippingMark: '',
        orderNo: '',
        caseNo: '',
        destination: '',
        model: '',
        productionMonth: new Date().toISOString().split('T')[0],
        caseSize: '',
        grossWeight: 0,
        netWeight: 0,
        // rackNo can be string or string[] (handled in UI below)
        rackNo: '',
        items: [{ no: 1, boxNo: '', partNo: '', partName: '', quantity: 1, remark: '' }]
    });
    const [showMemoModal, setShowMemoModal] = useState(false);
    const [showConfirmBeforeSave, setShowConfirmBeforeSave] = useState(false);

    // Rack No helpers
    const addRackNo = (value = '') => {
      setFormData(prev => {
        const r = prev.rackNo;
        if (Array.isArray(r)) {
          return { ...prev, rackNo: [...r, value] };
        }
        // convert single string to array
        return { ...prev, rackNo: r ? [String(r), value] : [value] };
      });
    };

    const updateRackNo = (index: number, value: string) => {
      setFormData(prev => {
        const r = Array.isArray(prev.rackNo) ? [...prev.rackNo] : [String(prev.rackNo || '')];
        r[index] = value;
        return { ...prev, rackNo: r };
      });
    };

    const removeRackNo = (index: number) => {
      setFormData(prev => {
        if (!Array.isArray(prev.rackNo)) return { ...prev, rackNo: '' };
        const r = prev.rackNo.filter((_, i) => i !== index);
        return { ...prev, rackNo: r.length === 1 ? r[0] : r };
      });
    };

    const setRackNoString = (value: string) => {
      setFormData(prev => ({ ...prev, rackNo: value }));
    };

    const convertSingleToList = () => {
      setFormData(prev => {
        const r = prev.rackNo;
        if (Array.isArray(r)) return prev;
        const arr = String(r || '').split(',').map(s => s.trim()).filter(Boolean);
        return { ...prev, rackNo: arr.length ? arr : [''] };
      });
    };

    useEffect(() => {
        if (isEdit && id) {
            loadShipment();
        }
    }, [isEdit, id]);

    const loadShipment = async () => {
        try {
            const shipment = await shipmentService.getShipmentById(id!);
            setFormData({
                shippingMark: shipment.shippingMark,
                orderNo: shipment.orderNo,
                caseNo: shipment.caseNo,
                destination: shipment.destination,
                model: shipment.model,
                productionMonth: shipment.productionMonth.split('T')[0],
                caseSize: shipment.caseSize,
                grossWeight: shipment.grossWeight,
                netWeight: shipment.netWeight,
                rackNo: Array.isArray(shipment.rackNo) ? shipment.rackNo.join(', ') : (shipment.rackNo || ''),
                items: shipment.items?.map(item => ({
                    no: item.no,
                    boxNo: item.boxNo,
                    partNo: item.partNo,
                    partName: item.partName,
                    quantity: item.quantity,
                    remark: item.remark || ''
                })) || []
            });
        } catch (error) {
            console.error('Error loading shipment:', error);
            alert('Error loading shipment data');
        }
    };

    // ganti handleSubmit menjadi buka konfirmasi dulu
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // validasi ringan
        if (!formData.shippingMark || !formData.orderNo || !formData.caseNo) {
            alert('Please fill in all required fields');
            return;
        }
        // buka konfirmasi: apakah mau input memo atau save draft
        setShowConfirmBeforeSave(true);
    };

    // dipanggil jika user pilih Save to Draft
    const saveDraft = async () => {
        setShowConfirmBeforeSave(false);
        setLoading(true);
        try {
            if (isEdit && id) {
                await shipmentService.updateShipment(id, formData);
            } else {
                await shipmentService.createShipment(formData);
            }
            navigate('/shipments');
        } catch (err) {
            console.error(err);
            alert('Error saving draft');
        } finally {
            setLoading(false);
        }
    };

    // dipanggil saat user pilih Input Memo → jika belum ada shipment buat dulu lalu buka halaman memo
    const openMemo = async () => {
      setShowConfirmBeforeSave(false);
      setLoading(true);
      try {
        let createdId = id;
        if (!isEdit || !id) {
          // create shipment first, include minimal fields
          const created = await shipmentService.createShipment(formData);
          createdId = created.id;
        } else {
          // ensure latest save
          if (id) await shipmentService.updateShipment(id, formData);
        }

        // navigate to memo page and pass current form data as state so memo page can reference original items
        navigate(`/shipments/${createdId}/memo`, { state: { formData } });
      } catch (err) {
        console.error(err);
        alert('Gagal membuka Memo. Pastikan shipment tersimpan.');
      } finally {
        setLoading(false);
      }
    };

    // onSaveMemo dari modal: simpan memo fields ke shipment, lalu set status APPROVED
    const handleSaveMemo = async (memoData: any) => {
        setShowMemoModal(false);
        setLoading(true);
        try {
            // gabungkan memo fields ke payload (backend akan menyimpan memo fields yang ada di schema: memoNo, shipmentType, ...)
            const payload = {
                ...formData,
                memoNo: memoData.memoNo,
                shipmentType: memoData.shipmentType,
                dangerLevel: memoData.dangerLevel,
                specialPermit: memoData.specialPermit,
                invoiceType: memoData.invoiceType,
                purpose: memoData.purpose,
                sapInfo: memoData.sapInfo,
                tpNo: memoData.tpNo,
                tpDate: memoData.tpDate,
                portOfDischarge: memoData.portOfDischarge,
                shipmentMethod: memoData.shipmentMethod,
                paymentMethod: memoData.paymentMethod,
                exportType: memoData.exportType,
                etdShipment: memoData.etdShipment
            };

            let createdId = id;
            if (isEdit && id) {
                await shipmentService.updateShipment(id, payload);
            } else {
                const created = await shipmentService.createShipment(payload);
                createdId = created.id;
            }

            // set status APPROVED (backend will enforce rules)
            if (createdId) {
                await shipmentService.updateShipmentStatus(createdId, 'APPROVED');
            }

            navigate('/shipments');
        } catch (err) {
            console.error(err);
            alert('Error saving memo / approving shipment');
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                { no: prev.items.length + 1, boxNo: '', partNo: '', partName: '', quantity: 1, remark: '' }
            ]
        }));
    };

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            setFormData(prev => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index).map((item, idx) => ({
                    ...item,
                    no: idx + 1
                }))
            }));
        }
    };

    const updateItem = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    return (
        <>
            {/* Excel Upload modal */}
            {showExcelUpload && (
                <ExcelUpload
                    onDataParsed={(data) => {
                        setFormData(data);
                        setShowExcelUpload(false);
                    }}
                    onCancel={() => setShowExcelUpload(false)}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/shipments')}
                        className="flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    {!isEdit && (
                        <Button
                            variant="secondary"
                            onClick={() => setShowExcelUpload(true)}
                            className="flex items-center"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Import from Excel
                        </Button>
                    )}

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEdit ? 'Edit Shipment' : 'Create New Shipment'}
                        </h1>
                        <p className="text-gray-600">
                            {isEdit ? 'Update shipment details' : 'Add new pre-shipment entry'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Input
                            label="Shipping Mark"
                            value={formData.shippingMark}
                            onChange={(e) => setFormData(prev => ({ ...prev, shippingMark: e.target.value }))}
                            required
                        />
                        <Input
                            label="Order No"
                            value={formData.orderNo}
                            onChange={(e) => setFormData(prev => ({ ...prev, orderNo: e.target.value }))}
                            required
                        />
                        <Input
                            label="Case No"
                            value={formData.caseNo}
                            onChange={(e) => setFormData(prev => ({ ...prev, caseNo: e.target.value }))}
                            required
                        />
                        <Input
                            label="Destination"
                            value={formData.destination}
                            onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                            required
                        />
                        <Input
                            label="Model"
                            value={formData.model}
                            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                            required
                        />
                        <Input
                            label="Production Month"
                            type="date"
                            value={formData.productionMonth}
                            onChange={(e) => setFormData(prev => ({ ...prev, productionMonth: e.target.value }))}
                            required
                        />
                        <Input
                            label="Case Size"
                            value={formData.caseSize}
                            onChange={(e) => setFormData(prev => ({ ...prev, caseSize: e.target.value }))}
                            required
                        />
                        <Input
                            label="Gross Weight (KGS)"
                            type="number"
                            step="0.01"
                            value={formData.grossWeight}
                            onChange={(e) => setFormData(prev => ({ ...prev, grossWeight: parseFloat(e.target.value) }))}
                            required
                        />
                        <Input
                            label="Net Weight (KGS)"
                            type="number"
                            step="0.01"
                            value={formData.netWeight}
                            onChange={(e) => setFormData(prev => ({ ...prev, netWeight: parseFloat(e.target.value) }))}
                            required
                        />
                        {/* Rack No: single input OR list */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rack No</label>
                          {Array.isArray(formData.rackNo) ? (
                            <div className="space-y-2">
                              {formData.rackNo.map((r, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Input
                                    value={r}
                                    onChange={(e) => updateRackNo(idx, e.target.value)}
                                    placeholder={`Rack No ${idx + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeRackNo(idx)}
                                    className="text-red-600 hover:text-red-900 px-2"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                              <div>
                                <button
                                  type="button"
                                  onClick={() => addRackNo('')}
                                  className="text-sm text-primary-600 underline"
                                >
                                  + Add rack no
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                value={String(formData.rackNo || '')}
                                onChange={(e) => setRackNoString(e.target.value)}
                                placeholder="Rack No"
                              />
                              <button
                                type="button"
                                onClick={convertSingleToList}
                                className="text-sm text-primary-600 underline"
                                title="Convert to list"
                              >
                                Convert to list
                              </button>
                            </div>
                          )}
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Items</h2>
                        <Button type="button" variant="secondary" onClick={addItem}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {formData.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 border border-gray-200 rounded-lg">
                                <div className="col-span-1 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">{item.no}</span>
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        label="Box No"
                                        value={item.boxNo}
                                        onChange={(e) => updateItem(index, 'boxNo', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-span-3">
                                    <Input
                                        label="Part No"
                                        value={item.partNo}
                                        onChange={(e) => updateItem(index, 'partNo', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-span-3">
                                    <Input
                                        label="Part Name"
                                        value={item.partName}
                                        onChange={(e) => updateItem(index, 'partName', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        label="Quantity"
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="col-span-1 flex items-center justify-center pt-6">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/shipments')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {isEdit ? 'Update Shipment' : 'Create Shipment'}
                    </Button>
                </div>
            </form>

            {/* simple confirm popup (choose memo or save draft) */}
            {showConfirmBeforeSave && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-200 p-5">
                    <h3 className="text-lg font-medium">Simpan Shipment</h3>
                    <p className="text-sm text-gray-500 mt-2">Apakah data ini sudah memiliki Memo Shipment Export Component?</p>
                    <div className="mt-4 flex justify-end gap-3">
                      <Button variant="secondary" onClick={() => setShowConfirmBeforeSave(false)}>Cancel</Button>
                      <Button onClick={saveDraft}>Save to Draft</Button>
                      <Button onClick={openMemo}>Input Memo</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Memo modal */}
              <MemoModal
                open={showMemoModal}
                onClose={() => setShowMemoModal(false)}
                shipmentItems={formData.items}
                onSaveMemo={handleSaveMemo}
              />
        </>
    );
};