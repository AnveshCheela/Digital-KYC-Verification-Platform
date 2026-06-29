import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVerificationStatus } from '../api/kycApi';
import StatusBadge from '../components/common/StatusBadge';
import toast from 'react-hot-toast';

export default function StatusPage() {
  const { id } = useParams();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval;
    const fetchStatus = async () => {
      try {
        const data = await getVerificationStatus(id);
        setVerification(data);
        // Stop polling if status is terminal
        if (data.status === 'verified' || data.status === 'approved' || data.status === 'rejected') {
          clearInterval(interval);
        }
      } catch (err) {
        toast.error('Failed to fetch status');
        clearInterval(interval);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return <div className="flex-grow flex items-center justify-center p-xl">Loading...</div>;
  }

  if (!verification) {
    return <div className="flex-grow flex items-center justify-center p-xl">Verification not found</div>;
  }

  return (
    <div className="w-full px-gutter max-w-[640px] mx-auto py-xl flex flex-col items-center flex-grow">
      <div className="w-full mb-lg text-center">
        <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">Verification Status</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Real-time status of your request.</p>
      </div>

      <div className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-lg md:p-xl shadow-[0_4px_12px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-lg">
          <div className="flex justify-between items-center pb-md border-b border-surface-border">
            <span className="font-label-md text-on-surface-variant">Request ID</span>
            <span className="font-code text-primary">{verification.id}</span>
          </div>
          <div className="flex justify-between items-center pb-md border-b border-surface-border">
            <span className="font-label-md text-on-surface-variant">Document Type</span>
            <span className="font-label-md text-primary capitalize">{verification.documentType}</span>
          </div>
          <div className="flex justify-between items-center pb-md border-b border-surface-border">
            <span className="font-label-md text-on-surface-variant">Status</span>
            <StatusBadge status={verification.status} />
          </div>
          {verification.notes && (
            <div className="flex flex-col gap-xs pb-md border-b border-surface-border">
              <span className="font-label-md text-on-surface-variant">Admin Notes</span>
              <p className="font-body-md text-on-surface">{verification.notes}</p>
            </div>
          )}

          <div className="flex justify-center mt-md">
            <Link to="/dashboard" className="text-secondary hover:underline font-label-md">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
