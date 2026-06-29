import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyVerifications } from '../api/kycApi';
import StatusBadge from '../components/common/StatusBadge';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const data = await getMyVerifications();
      setVerifications(data.verifications || []);
    } catch (err) {
      toast.error('Failed to fetch verifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-gutter max-w-container-max mx-auto py-xl flex flex-col gap-lg flex-grow">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">My Verifications</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Track your KYC verification status.</p>
        </div>
        <Link 
          to="/upload" 
          className="bg-secondary text-on-secondary px-lg py-sm rounded font-label-md hover:opacity-90 transition-opacity flex items-center gap-xs"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Start New Verification
        </Link>
      </div>

      <div className="bg-surface-container-lowest border border-surface-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-xl text-center text-on-surface-variant">Loading...</div>
        ) : verifications.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant flex flex-col items-center gap-sm">
            <span className="material-symbols-outlined text-[48px] text-outline">description</span>
            <p>No verifications found. Start a new one!</p>
          </div>
        ) : (
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead className="bg-surface-bright text-on-surface-variant font-label-sm border-b border-surface-border">
              <tr>
                <th className="p-md font-medium">ID</th>
                <th className="p-md font-medium">Document Type</th>
                <th className="p-md font-medium">Date</th>
                <th className="p-md font-medium">Status</th>
                <th className="p-md font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((v) => (
                <tr key={v.id} className="border-b border-surface-border hover:bg-surface-container-low transition-colors">
                  <td className="p-md font-code text-on-surface">{v.id ? String(v.id).slice(-6) : ''}</td>
                  <td className="p-md text-on-surface capitalize">{v.documentType}</td>
                  <td className="p-md text-on-surface-variant">{new Date(v.createdAt).toLocaleDateString()}</td>
                  <td className="p-md"><StatusBadge status={v.status} /></td>
                  <td className="p-md">
                    <Link to={`/status/${v.id}`} className="text-secondary hover:underline font-label-sm font-medium">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
