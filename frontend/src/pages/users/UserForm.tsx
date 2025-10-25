import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { userService, type CreateUserData } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { User } from '../../types';

export const UserForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<Partial<CreateUserData & { isActive?: boolean }>>({
    email: '',
    nama: '',
    username: '',
    password: '',
    role: 'VIEWER',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const all = await userService.getAllUsers();
        const u = all.find((x: User) => x.id === id);
        // User type may not declare isActive; access it defensively
        if (u) setForm({ email: u.email, nama: u.nama, username: u.username, role: u.role as any, isActive: (u as any).isActive });
      } catch (err) {
        console.error(err);
        alert('Gagal mengambil data user');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleChange = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !String(form.nama).trim()) {
      alert('Nama wajib diisi');
      return;
    }
    if (!form.email || !String(form.email).trim()) {
      alert('Email wajib diisi');
      return;
    }
    try {
      setLoading(true);
      if (isEdit && id) {
        // include isActive in the allowed payload shape
        const updateData: Partial<User & { password?: string } & { isActive?: boolean }> = {
          nama: String(form.nama),
          email: String(form.email),
          username: String(form.username || ''),
          role: String(form.role) as User['role'],
          isActive: Boolean(form.isActive)
        };
        if (form.password && String(form.password).trim()) updateData.password = String(form.password);
        await userService.updateUser(id, updateData);
        alert('User updated');
      } else {
        await userService.createUser({
          nama: String(form.nama),
          email: String(form.email),
          username: String(form.username || ''),
          password: String(form.password || 'password'),
          role: (form.role as any) ?? 'VIEWER'
        });
        alert('User created');
      }
      navigate('/users');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 container-main mx-auto px-4">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit User' : 'Create User'}</h1>
          <p className="text-sm text-gray-600">{isEdit ? 'Perbarui akun' : 'Tambahkan akun baru'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
        <div className="grid grid-cols-1 gap-4">
          <Input label="Name" required value={form.nama ?? ''} onChange={(e) => handleChange('nama', e.target.value)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Email" type="email" required value={form.email ?? ''} onChange={(e) => handleChange('email', e.target.value)} />
            <Input label="Username" required value={form.username ?? ''} onChange={(e) => handleChange('username', e.target.value)} />
          </div>

          <div>
            <Input
              label={isEdit ? 'Password (kosong = tidak diubah)' : 'Password'}
              type="password"
              value={form.password ?? ''}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder={isEdit ? 'Kosongkan jika tidak ingin mengganti' : 'Password akun'}
              autoComplete="new-password"
            />
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <label className="block text-sm font-medium text-gray-700">
                Role
                <select
                    value={form.role ?? 'VIEWER'}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full mt-1 p-2 bg-transparent outline-none"
                >
                    <option value="ADMIN" title="Administrator — penuh akses ke semua fitur">Admin — Full access</option>
                    <option value="VIEWER" title="Viewer — hanya melihat, tidak dapat mengubah">Viewer — Read-only</option>
                </select>
            </label>

            <label className="block text-sm font-medium text-gray-700">
                Status
                <select
                    value={String(form.isActive ?? true)}
                    onChange={(e) => handleChange('isActive', e.target.value === 'true')}
                    className="w-full mt-1 p-2 bg-transparent outline-none"
                    aria-label="Status"
                >
                    <option value="true" title="Akun aktif — dapat digunakan">🟢 Active</option>
                    <option value="false" title="Akun nonaktif — akses dibatasi">🔴 Inactive</option>
                </select>
            </label>
        </div>

          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate('/users')}>Cancel</Button>
            <Button type="submit" loading={loading}>{isEdit ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
};