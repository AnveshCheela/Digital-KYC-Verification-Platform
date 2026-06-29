import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function MainLayout() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col">
      <nav className="bg-surface-container-lowest dark:bg-surface-container-high w-full top-0 sticky z-50 border-b border-surface-border dark:border-outline-variant">
        <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-16">
          <Link to="/" className="font-headline-md text-headline-md font-bold text-primary dark:text-on-primary-fixed">
            VerifyFlow
          </Link>
          <div className="hidden md:flex gap-lg items-center font-label-md text-label-md">
            {!isAuthenticated ? (
              <>
                <Link to="/features" className="text-on-surface-variant dark:text-outline hover:text-secondary dark:hover:text-secondary-fixed transition-colors">Features</Link>
                <Link to="/solutions" className="text-on-surface-variant dark:text-outline hover:text-secondary dark:hover:text-secondary-fixed transition-colors">Solutions</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-on-surface-variant dark:text-outline hover:text-secondary dark:hover:text-secondary-fixed transition-colors">Dashboard</Link>
                {isAdmin && (
                  <Link to="/admin" className="text-on-surface-variant dark:text-outline hover:text-secondary dark:hover:text-secondary-fixed transition-colors">Admin Area</Link>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-md">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="bg-secondary text-on-secondary px-md py-sm rounded font-label-md hover:opacity-90 transition-opacity">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="text-on-surface-variant dark:text-outline hover:text-secondary dark:hover:text-secondary-fixed font-label-md px-md py-sm">
                  Login
                </Link>
                <Link to="/register" className="bg-secondary text-on-secondary px-md py-sm rounded font-label-md hover:opacity-90 transition-opacity">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      <footer className="bg-surface-container-lowest dark:bg-surface-container-highest w-full border-t border-surface-border dark:border-outline-variant mt-auto">
        <div className="w-full py-xl px-gutter max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="font-label-md text-label-md font-bold text-primary dark:text-on-primary-fixed">
            VerifyFlow
          </div>
          <div className="flex gap-md font-body-sm text-body-sm">
            <span className="text-on-surface-variant dark:text-outline cursor-default">Privacy Policy</span>
            <span className="text-on-surface-variant dark:text-outline cursor-default">Terms of Service</span>
          </div>
          <div className="font-body-sm text-body-sm text-on-surface-variant dark:text-on-surface">
            © 2024 VerifyFlow Identity Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
