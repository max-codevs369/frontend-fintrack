import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import AuthLayout from './ui/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ error: '', success: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: '' });
    setLoading(true);

    try {
      const res = await fetch('https://shifty-carey-pentahydroxy.ngrok-free.dev/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
      setStatus({ error: '', success: data.message });
    } catch (err) {
      setStatus({ error: err.message, success: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Lupa Kata Sandi" 
      subtitle="Masukkan email Anda, kami akan mengirimkan instruksi reset"
    >
      <Alert type="error" message={status.error} />
      <Alert type="success" message={status.success} />

      {!status.success && (
        <form onSubmit={handleSubmit} className="mt-2">
          <Input 
            label="Alamat Email" 
            type="email" 
            placeholder="nama@email.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            icon={faEnvelope}
            required
          />
          <div className="pt-2">
            <Button variant="primary" size="lg" isLoading={loading}>
              {loading ? 'Mengirim...' : 'Kirim Link Reset'}
            </Button>
          </div>
        </form>
      )}

      <p className="mt-8 text-center text-sm font-medium text-slate-500">
        <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-bold transition-all underline underline-offset-4">
          Kembali ke Login
        </Link>
      </p>
    </AuthLayout>
  );
}