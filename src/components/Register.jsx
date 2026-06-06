import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import AuthLayout from './ui/AuthLayout';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState({ error: '', success: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: '' });
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registrasi gagal');

      setStatus({ error: '', success: data.message });
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setStatus({ error: err.message, success: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Buat Akun Baru" subtitle="Mulai catat keuangan Anda sekarang">
      <Alert type="error" message={status.error} />
      <Alert type="success" message={status.success} />
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input label="Nama Lengkap" placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <Input label="Alamat Email" type="email" placeholder="nama@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        <Input label="Kata Sandi" type="password" placeholder="Minimal 6 karakter" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        <div className="pt-2">
          <Button variant="primary" disabled={loading}>{loading ? 'Mendaftar...' : 'Daftar Akun'}</Button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Sudah ada akun? <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-semibold transition">Login saja</Link>
      </p>
    </AuthLayout>
  );
}
