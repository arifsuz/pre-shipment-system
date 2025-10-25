import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, CheckCircle, Clock } from 'lucide-react';
import { shipmentService } from '../../services/shipmentService';
import { Button } from '../../components/ui/Button';
import { Layout } from '../../components/layout/Layout';
import type { Shipment } from '../../types';
import { MemoDetailView } from './MemoDetailView';

export const MemoDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [memo, setMemo] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line
  }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await shipmentService.getShipmentById(id!);
      setMemo(data);
    } catch (err) {
      console.error('Error loading memo:', err);
      alert('Error loading memo data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { color: string; icon: any; label: string }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
      IN_PROCESS: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'In Process' },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' }
    };
    return config[status] ?? config.DRAFT;
  };

  // helper: format date and currency
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

  // compute manual items totals
  const totals = useMemo(() => {
    const items = memo?.items ?? [];
    const totalQty = items.reduce((s, it) => s + Number(it.quantity ?? it.qty ?? 0), 0);
    const totalAmount = items.reduce((s, it) => {
      const t = Number(it.totalAmount ?? 0);
      // if totalAmount missing, try qty * pricePerPcs
      if (t > 0) return s + t;
      const qty = Number(it.quantity ?? it.qty ?? 0);
      const price = Number(it.pricePerPcs ?? (it as any).pricePerPc ?? 0);
      return s + qty * price;
    }, 0);
    return { totalQty, totalAmount };
  }, [memo?.items]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </Layout>
    );
  }

  if (!memo) {
    return (
      <Layout>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Memo not found</h3>
          <Button onClick={() => navigate('/shipments')} className="mt-4">Back</Button>
        </div>
      </Layout>
    );
  }

  const statusCfg = getStatusConfig(memo.status);

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Memo Detail</h1>
            <p className="text-sm text-gray-500">Order No: {memo.orderNo}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/shipments')}>Back</Button>
            {memo.status !== 'APPROVED' && (
              <Link to={`/shipments/${memo.id}/memo`}>
                <Button><Edit className="h-4 w-4 mr-2" />Edit Memo</Button>
              </Link>
            )}
          </div>
        </div>

        {/* reuse view component so list inline and page use same render */}
        <MemoDetailView memo={memo} />
      </div>
    </Layout>
  );
};