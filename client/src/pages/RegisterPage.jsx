import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await register(fullName, email, password);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-md">
      <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-xl w-full max-w-md">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-lg text-center">Create Account</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-on-surface-variant">Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="border border-outline-variant rounded p-sm bg-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              required 
            />
          </div>
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
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-md text-center text-body-sm text-on-surface-variant">
          Already have an account? <Link to="/login" className="text-secondary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
