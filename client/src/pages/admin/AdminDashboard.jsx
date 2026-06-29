import { useEffect, useState } from 'react';
import { getStats } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="w-full px-gutter max-w-container-max mx-auto py-xl flex-grow">
      <h1 className="font-headline-xl text-primary mb-xl">Admin Dashboard</h1>
      
      {loading ? (
        <div className="text-on-surface-variant">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md">
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-lg flex flex-col gap-sm shadow-sm">
            <span className="font-label-md text-on-surface-variant">Total Requests</span>
            <span className="font-headline-xl text-primary">{stats.total || 0}</span>
          </div>
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-lg flex flex-col gap-sm shadow-sm">
            <span className="font-label-md text-warning">Pending</span>
            <span className="font-headline-xl text-warning">{stats.pending || 0}</span>
          </div>
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-lg flex flex-col gap-sm shadow-sm">
            <span className="font-label-md text-success">Verified</span>
            <span className="font-headline-xl text-success">{stats.verified || 0}</span>
          </div>
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-lg flex flex-col gap-sm shadow-sm">
            <span className="font-label-md text-error">Rejected</span>
            <span className="font-headline-xl text-error">{stats.rejected || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}
