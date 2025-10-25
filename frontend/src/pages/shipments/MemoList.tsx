import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Download, Package } from 'lucide-react';
import { shipmentService } from '../../services/shipmentService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Layout } from '../../components/layout/Layout';
import type { Shipment } from '../../types';
import { MemoDetailView } from './MemoDetailView';

export const MemoList: React.FC = () => {
  const [memos, setMemos] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // inline detail state
  const [selectedMemo, setSelectedMemo] = useState<Shipment | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadMemos = async () => {
    try {
      setLoading(true);
      const res = await shipmentService.getMemos();
      // normalisasi response shape
      const data = res?.data ?? (res?.success ? res.data : res);
      const list = Array.isArray(data) ? data : [];
      setMemos(list);
      setTotalPages(1);
    } catch (err) {
      console.error('Error loading memos:', err);
      alert('Error loading memo data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemos();
  }, []);

  // open memo inline (fetch detail and show in-place)
  const openMemoInline = async (id: string) => {
    try {
      setLoadingDetail(true);
      const data = await shipmentService.getShipmentById(id);
      setSelectedMemo(data);
    } catch (err) {
      console.error('Error loading memo detail:', err);
      alert('Error loading memo detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedMemo(null);
  };

  const filtered = memos.filter(m =>
    (m.orderNo ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.memoNo ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.memoGoodsInfo ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      IN_PROCESS: { color: 'bg-yellow-100 text-yellow-800', label: 'In Process' },
      APPROVED: { color: 'bg-green-100 text-green-800', label: 'Approved' }
    };
    const cfg = statusConfig[status] ?? statusConfig.DRAFT;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Data Memo</h1>
            <p className="text-gray-600">Daftar memo shipment</p>
          </div>

          <div className="flex space-x-3">
            {/* removed Import Excel / New Shipment buttons for Memo list */}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search by Memo No, Order No, Info..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            <div />
            <div className="text-right">
              <Button variant="secondary"><Filter className="h-4 w-4 mr-2" /> Filters</Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : (
            <>
              {!selectedMemo ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memo / Order</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goods / Info</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map(m => (
                          <tr key={m.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{m.memoNo ?? '-'}</div>
                              <div className="text-sm text-gray-500">{m.orderNo ?? '-'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{m.goodsType ?? '-'}</div>
                              <div className="text-sm text-gray-500">{m.memoGoodsInfo ?? '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {m.items?.length ?? 0} items
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(m.status)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(m.updatedAt).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button onClick={() => openMemoInline(m.id)} className="text-blue-600 hover:text-blue-900">
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filtered.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No memos</h3>
                      <p className="mt-1 text-sm text-gray-500">Create shipment and add memo to see entries.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">Memo Detail</h2>
                      <div className="text-sm text-gray-500">{selectedMemo.orderNo}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={closeDetail}>Back to list</Button>
                      {selectedMemo.status !== 'APPROVED' && (
                        <Link to={`/shipments/${selectedMemo.id}/memo`}>
                          <Button><Edit className="h-4 w-4 mr-2" />Edit Memo</Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* reuse the same detail view so layout exactly matches MemoDetail page */}
                  <MemoDetailView memo={selectedMemo} />
                </div>
              )}

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <Button variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Previous</Button>
                  <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                  <Button variant="secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};