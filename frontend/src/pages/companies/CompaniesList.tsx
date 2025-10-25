import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { companyService } from '../../services/companyService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Company } from '../../types';

export const CompaniesList: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAll();
      setCompanies(data || []);
    } catch (err) {
      console.error('Gagal memuat companies', err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(c =>
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.contactPerson ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q)
    );
  }, [companies, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus company ini?')) return;
    try {
      await companyService.remove(id);
      setCompanies(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Gagal menghapus company', err);
      alert('Gagal menghapus company');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-sm text-gray-600">Kelola daftar perusahaan (order by / deliver to)</p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search by name, contact, email or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-80"
            // show search icon inline if your Input supports it; else keep placeholder
          />
          <Link to="/companies/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Company
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">No companies found.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email / Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paged.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.address ?? ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.contactPerson ?? '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div>{c.email ?? '-'}</div>
                        <div className="text-xs text-gray-500">{c.phone ?? '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{c.isActive ? <span className="text-green-600">Yes</span> : <span className="text-red-600">No</span>}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => navigate(`/companies/${c.id}/edit`)} className="inline-flex items-center px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="inline-flex items-center px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filtered.length)} of {filtered.length} companies</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
            <div className="px-3 text-sm">{page} / {totalPages}</div>
            <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
};