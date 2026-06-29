import { useEffect, useState } from 'react';
import { getAuditLogs } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getAuditLogs();
        setLogs(data.logs || data);
      } catch (err) {
        toast.error('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="w-full px-gutter max-w-container-max mx-auto py-xl flex-grow">
      <div className="mb-lg">
        <h1 className="font-headline-lg text-primary">Audit Logs</h1>
        <p className="font-body-md text-on-surface-variant">Immutable record of system actions and reviews.</p>
      </div>

      <div className="bg-surface-container-lowest border border-surface-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-xl text-center text-on-surface-variant">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm">
              <thead className="bg-surface-bright text-on-surface-variant font-label-sm border-b border-surface-border">
                <tr>
                  <th className="p-md font-medium">Timestamp</th>
                  <th className="p-md font-medium">Admin</th>
                  <th className="p-md font-medium">Action</th>
                  <th className="p-md font-medium">Verification ID</th>
                  <th className="p-md font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-surface-border hover:bg-surface-container-low transition-colors">
                    <td className="p-md text-on-surface-variant">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-md text-on-surface">{log.admin?.email || 'System'}</td>
                    <td className="p-md font-medium capitalize text-primary">{log.action}</td>
                    <td className="p-md font-code text-on-surface-variant">{log.verificationId ? log.verificationId.slice(-6) : '-'}</td>
                    <td className="p-md text-on-surface text-sm max-w-[200px] truncate" title={log.details}>
                      {log.details || '-'}
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
