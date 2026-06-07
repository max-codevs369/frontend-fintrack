import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import AuthLayout from './ui/AuthLayout';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [status, setStatus] = useState({ error: '', success: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: '' });

    if (password.length < 6) {
      setStatus({ error: 'Password minimal 6 karakter', success: '' });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ error: 'Konfirmasi password tidak cocok', success: '' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://shifty-carey-pentahydroxy.ngrok-free.dev/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mereset password');

      setStatus({ error: '', success: 'Password berhasil diperbarui!' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setStatus({ error: err.message, success: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Atur Sandi Baru" 
      subtitle="Masukkan kata sandi baru untuk akun FinTrack Anda"
    >
      <Alert type="error" message={status.error} />
      <Alert type="success" message={status.success} />

      <form onSubmit={handleSubmit} className="mt-2">
        <Input 
          label="Kata Sandi Baru" 
          type="password" 
          placeholder="Minimal 6 karakter" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          icon={faLock}
          required
        />
        
        <Input 
          label="Konfirmasi Kata Sandi" 
          type="password" 
          placeholder="Ulangi kata sandi baru" 
          value={confirmPassword} 
          onChange={e => setConfirmPassword(e.target.value)} 
          icon={faLock}
          required
        />

        <div className="pt-2">
          <Button variant="primary" size="lg" isLoading={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Sandi Baru'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}