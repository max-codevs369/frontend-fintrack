import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { faUser, faEnvelope, faLock, faEyeSlash, faEye } from '@fortawesome/free-solid-svg-icons';

import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import AuthLayout from './ui/AuthLayout';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: ''});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ error: '', success: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: '' });

    if (form.password.length < 6) {
      setStatus({ error: 'Password minimal 6 karakter', success: '' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://shifty-carey-pentahydroxy.ngrok-free.dev/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: form.name, 
          email: form.email, 
          password: form.password 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registrasi gagal');

      setStatus({ error: '', success: 'Akun berhasil dibuat! Mengalihkan ke login...' });
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setStatus({ error: err.message, success: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Buat Akun FinTrack" 
      subtitle="Bergabunglah dan mulai kendalikan keuangan Anda"
    >
      <Alert type="error" message={status.error} />
      <Alert type="success" message={status.success} />
      
      {!status.success && (
        <form onSubmit={handleSubmit} className="mt-2">
          <Input 
            label="Nama Lengkap" 
            placeholder="Contoh: Budi Santoso" 
            value={form.name} 
            onChange={e => setForm({...form, name: e.target.value})} 
            icon={faUser}
            required
          />
          
          <Input 
            label="Alamat Email" 
            type="email" 
            placeholder="nama@email.com" 
            value={form.email} 
            onChange={e => setForm({...form, email: e.target.value})} 
            icon={faEnvelope}
            required
          />
          
          <Input 
            label="Kata Sandi" 
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 6 karakter" 
            value={form.password} 
            onChange={e => setForm({...form, password: e.target.value})} 
            icon={faLock} 
            rightIcon={showPassword ? faEyeSlash : faEye}
            onRightIconClick={() => setShowPassword(!showPassword)}
            required
          />

          <div className="pt-2">
            <Button variant="primary" size="lg" isLoading={loading}>
              {loading ? 'Memproses...' : 'Daftar Akun'}
            </Button>
          </div>
        </form>
      )}
      
      <p className="mt-8 text-center text-sm font-medium text-slate-500">
        Sudah ada akun?{' '}
        <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-bold transition-all underline decoration-emerald-500/30 underline-offset-4 hover:decoration-emerald-500">
          Login sekarang
        </Link>
      </p>
    </AuthLayout>
  );
}