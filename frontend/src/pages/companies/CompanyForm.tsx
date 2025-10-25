import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { companyService } from '../../services/companyService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Company } from '../../types';

export const CompanyForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<Partial<Company>>({
    name: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const all = await companyService.getAll();
        const c = all.find((x: Company) => x.id === id);
        if (c) setForm(c);
      } catch (err) {
        console.error(err);
        alert('Gagal mengambil data company');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleChange = (k: keyof Company, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !String(form.name).trim()) {
      alert('Nama company wajib diisi');
      return;
    }
    try {
      setLoading(true);
      if (isEdit && id) {
        await companyService.update(id, form as Partial<Company>);
        alert('Company updated');
      } else {
        await companyService.create(form as Omit<Company, 'id' | 'createdAt' | 'updatedAt'>);
        alert('Company created');
      }
      navigate('/companies');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 container-main mx-auto px-4">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/companies')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Company' : 'Create Company'}</h1>
          <p className="text-sm text-gray-600">{isEdit ? 'Perbarui informasi perusahaan' : 'Tambahkan perusahaan baru'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
        <div className="grid grid-cols-1 gap-4">
          <Input label="Name" required value={form.name ?? ''} onChange={(e) => handleChange('name', e.target.value)} />
          <Input label="Contact Person" value={form.contactPerson ?? ''} onChange={(e) => handleChange('contactPerson', e.target.value)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone ?? ''} onChange={(e) => handleChange('phone', e.target.value)} />
            <Input label="Email" type="email" value={form.email ?? ''} onChange={(e) => handleChange('email', e.target.value)} />
          </div>

          { /* insert inputs near existing phone/email fields */ }
          <Input label="Country" value={form.country ?? ''} onChange={(e) => handleChange('country', e.target.value)} />
          <Input label="Section" value={form.section ?? ''} onChange={(e) => handleChange('section', e.target.value)} />
          <Input label="Fax" value={form.fax ?? ''} onChange={(e) => handleChange('fax', e.target.value)} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            {/* textarea styled same as other inputs */}
            <textarea
              value={form.address ?? ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="input w-full h-28 resize-y rounded-md shadow-sm border border-gray-200 bg-white focus:border-primary-500 focus:ring-primary-500 px-3 py-2"
              placeholder="Alamat perusahaan"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="w-full md:w-1/3 bg-white border border-gray-200 rounded-md shadow-sm p-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="relative">
                {/* colored status indicator */}
                <span
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full
                        ${form.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                    aria-hidden
                />

                <select
                    value={String(form.isActive ?? true)}
                    onChange={(e) => handleChange('isActive', e.target.value === 'true')}
                    className="input w-full bg-white appearance-none pl-10 pr-10 rounded-md shadow-sm border border-gray-200
                                         hover:shadow-md transition-shadow duration-150 focus:border-primary-500 focus:ring-primary-500"
                    aria-label="Company status"
                >
                    <option value="" disabled>
                      — Select status —
                    </option>
                    <option value="true">Active company</option>
                    <option value="false">Inactive company</option>
                </select>

                {/* custom arrow */}
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate('/companies')}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};