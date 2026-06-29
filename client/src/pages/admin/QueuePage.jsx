import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQueue } from '../../api/adminApi';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

export default function QueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const data = await getQueue({ status: 'pending' });
      setQueue(data.queue || data.verifications || data);
    } catch (err) {
      toast.error('Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-gutter max-w-container-max mx-auto py-xl flex-grow">
      <div className="mb-lg">
        <h1 className="font-headline-lg text-primary">Review Queue</h1>
        <p className="font-body-md text-on-surface-variant">Pending verifications awaiting manual review.</p>
      </div>

      <div className="bg-surface-container-lowest border border-surface-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-xl text-center text-on-surface-variant">Loading queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant">No pending verifications.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm">
              <thead className="bg-surface-bright text-on-surface-variant font-label-sm border-b border-surface-border">
                <tr>
                  <th className="p-md font-medium">Request ID</th>
                  <th className="p-md font-medium">User</th>
                  <th className="p-md font-medium">Document Type</th>
                  <th className="p-md font-medium">Submitted</th>
                  <th className="p-md font-medium">Status</th>
                  <th className="p-md font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id} className="border-b border-surface-border hover:bg-surface-container-low transition-colors">
                    <td className="p-md font-code text-on-surface">{item.id ? String(item.id).slice(-6) : ''}</td>
                    <td className="p-md text-on-surface">{item.user?.email || 'Unknown'}</td>
                    <td className="p-md text-on-surface capitalize">{item.documentType}</td>
                    <td className="p-md text-on-surface-variant">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="p-md"><StatusBadge status={item.status} /></td>
                    <td className="p-md">
                      <Link to={`/admin/review/${item.id}`} className="bg-secondary text-on-secondary px-sm py-xs rounded font-label-sm hover:opacity-90">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
