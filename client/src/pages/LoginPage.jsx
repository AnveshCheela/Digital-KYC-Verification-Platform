import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const user = await login(email, password);
      toast.success('Login successful!');
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-md">
      <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-xl w-full max-w-md">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-lg text-center">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface-variant">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="border border-outline-variant rounded p-sm bg-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              required 
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface-variant">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="border border-outline-variant rounded p-sm bg-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-secondary text-on-secondary py-sm rounded font-label-md mt-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-md text-center text-body-sm text-on-surface-variant">
          Don&apos;t have an account? <Link to="/register" className="text-secondary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
