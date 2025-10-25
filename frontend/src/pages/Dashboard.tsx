// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { statsService, type DashboardStats } from '../services/statsService';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await statsService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed load stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadRecent = async (status?: string | null) => {
    try {
      setLoadingRecent(true);
      // backend supports ?status & limit
      const params: any = { page: 1, limit: 6 };
      if (status && status !== 'ALL') params.status = status;
      const res = await api.get('/shipments', { params });
      // try read data.shipments or data.data.shipments depending backend wrapper
      const shipments = res.data?.data?.shipments ?? res.data?.data?.shipments ?? res.data?.shipments ?? res.data;
      setRecent(shipments || []);
    } catch (err) {
      console.error('Failed load recent', err);
      setRecent([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadRecent(null);
  }, []);

  useEffect(() => {
    loadRecent(filterStatus);
  }, [filterStatus]);

  const cards = [
    { title: 'Total Shipments', value: stats?.totalShipments ?? 0, icon: Package, color: 'bg-blue-500', status: null },
    { title: 'Approved', value: stats?.approved ?? 0, icon: CheckCircle, color: 'bg-green-500', status: 'APPROVED' },
    { title: 'In Process', value: stats?.inProcess ?? 0, icon: Clock, color: 'bg-yellow-500', status: 'IN_PROCESS' },
    { title: 'Draft', value: stats?.draft ?? 0, icon: AlertCircle, color: 'bg-gray-500', status: 'DRAFT' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview dari data real-time</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const selected = filterStatus === card.status;
          return (
            <button
              key={card.title}
              onClick={() => {
                setFilterStatus(card.status ?? null);
              }}
              className={`text-left group bg-white rounded-xl shadow-lg border border-gray-200 p-5 transform hover:-translate-y-1 transition-all duration-150 flex items-center gap-4 ${
                selected ? 'ring-2 ring-primary-400' : ''
              }`}
            >
              <div className={`p-3 rounded-lg ${card.color} text-white`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                {/* simple progress line */}
                <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (card.value / Math.max(1, stats?.totalShipments ?? 1)) * 100)}%` }}
                    className="h-1 bg-gradient-to-r from-primary-400 to-primary-600 transition-width"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent Shipments (interactive) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Recent Shipments {filterStatus ? `- ${filterStatus}` : ''}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => { setFilterStatus(null); }} className="text-sm text-primary-600 hover:underline">Clear Filter</button>
            <button onClick={() => navigate('/shipments')} className="text-sm text-gray-600 hover:underline">View All</button>
          </div>
        </div>

        <div className="p-4">
          {loadingRecent ? (
            <div className="text-center py-8">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No shipments</div>
          ) : (
            <ul className="space-y-3">
              {recent.map((s: any) => (
                <li
                  key={s.id}
                  className="p-3 rounded-md border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/shipments/${s.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{s.orderNo || s.shippingMark || '—'}</p>
                      <p className="text-sm text-gray-500">{s.caseNo ? `Case: ${s.caseNo}` : s.destination}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{new Date(s.createdAt).toLocaleDateString()}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${s.status === 'APPROVED' ? 'bg-green-100 text-green-700' : s.status === 'IN_PROCESS' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};