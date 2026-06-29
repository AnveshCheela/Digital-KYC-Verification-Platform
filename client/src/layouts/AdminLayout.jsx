import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Queue', path: '/admin/queue' },
    { name: 'Audit Logs', path: '/admin/audit-logs' },
  ];

  if (!isAdmin) return null;

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col">
      <nav className="bg-surface-container-lowest dark:bg-surface-container-high w-full top-0 sticky z-50 border-b border-surface-border dark:border-outline-variant">
        <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-16">
          <Link to="/admin" className="font-headline-md text-headline-md font-bold text-primary dark:text-on-primary-fixed flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary">admin_panel_settings</span>
            VerifyFlow Admin
          </Link>
          <div className="hidden md:flex gap-lg items-center font-label-md text-label-md">
            {navLinks.map(link => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`transition-colors ${
                  location.pathname === link.path 
                    ? 'text-secondary dark:text-secondary-fixed border-b-2 border-secondary dark:border-secondary-fixed pb-1' 
                    : 'text-on-surface-variant dark:text-outline hover:text-secondary dark:hover:text-secondary-fixed'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-md">
            <Link to="/dashboard" className="text-on-surface-variant text-sm hover:text-secondary">Exit Admin</Link>
            <button onClick={handleLogout} className="bg-secondary text-on-secondary px-md py-sm rounded font-label-md hover:opacity-90 transition-opacity">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
