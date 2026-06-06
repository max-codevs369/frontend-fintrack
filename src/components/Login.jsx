import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import AuthLayout from './ui/AuthLayout';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://shifty-carey-pentahydroxy.ngrok-free.dev/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');

      localStorage.setItem('token', data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Inventaris Keuangan" subtitle="Masuk untuk mengelola keuangan Anda">
      <Alert type="error" message={error} />
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input label="Alamat Email" type="email" placeholder="nama@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        <Input label="Kata Sandi" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        <div className="pt-2">
          <Button variant="primary" disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk ke Akun'}
          </Button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Belum punya akun? <Link to="/register" className="text-emerald-600 hover:text-emerald-500 font-semibold transition">Daftar sekarang</Link>
      </p>
    </AuthLayout>
  );
}
