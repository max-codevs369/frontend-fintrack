import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

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
      if (!res.ok) throw new Error(data.error || 'Email atau kata sandi tidak sesuai.');

      localStorage.setItem('token', data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Selamat Datang Kembali" 
      subtitle="Masuk ke akun FinTrack Anda untuk melanjutkan"
    >
      <Alert type="error" message={error} />
      
      <form onSubmit={handleSubmit} className="mt-2">
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
          type="password" 
          placeholder="••••••••" 
          value={form.password} 
          onChange={e => setForm({...form, password: e.target.value})} 
          icon={faLock}
          required
        />
        
        <div className="flex items-center justify-end mb-6 -mt-2">
          <a href="#" className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
            Lupa kata sandi?
          </a>
        </div>

        <div className="pt-2">
          <Button variant="primary" size="lg" isLoading={loading}>
            {loading ? 'Memverifikasi...' : 'Masuk ke Akun'}
          </Button>
        </div>
      </form>
      
      <p className="mt-8 text-center text-sm font-medium text-slate-500">
        Belum punya akun?{' '}
        <Link to="/register" className="text-emerald-600 hover:text-emerald-500 font-bold transition-all relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-500 hover:after:w-full after:transition-all after:duration-300">
          Daftar sekarang
        </Link>
      </p>
    </AuthLayout>
  );
}