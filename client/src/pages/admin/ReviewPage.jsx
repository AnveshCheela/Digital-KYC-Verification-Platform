import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewVerification } from '../../api/adminApi';
import { getVerificationStatus } from '../../api/kycApi';
import toast from 'react-hot-toast';

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const data = await getVerificationStatus(id);
        setVerification(data);
      } catch (err) {
        toast.error('Failed to load verification data');
        navigate('/admin/queue');
      } finally {
        setLoading(false);
      }
    };
    fetchVerification();
  }, [id, navigate]);

  const handleAction = async (action) => {
    if (action === 'rejected' && !notes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }
    try {
      setSubmitting(true);
      await reviewVerification(id, action, notes);
      toast.success(`Verification ${action} successfully`);
      navigate('/admin/queue');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-xl text-center">Loading...</div>;
  if (!verification) return <div className="p-xl text-center">Not found</div>;

  const imageUrl = `http://localhost:5000/${verification.documentUrl}`;

  return (
    <div className="w-full px-gutter max-w-container-max mx-auto py-xl flex-grow">
      <div className="mb-lg flex justify-between items-center">
        <div>
          <h1 className="font-headline-lg text-primary">Review Verification</h1>
          <p className="font-code text-on-surface-variant text-sm mt-xs">ID: {verification.id}</p>
        </div>
        <button onClick={() => navigate('/admin/queue')} className="text-secondary font-label-md hover:underline">
          Back to Queue
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Document Image */}
        <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-lg flex flex-col gap-sm shadow-sm">
          <h2 className="font-headline-md text-primary border-b border-surface-border pb-sm">Document Image</h2>
          <div className="bg-surface-container flex items-center justify-center rounded-lg overflow-hidden min-h-[300px]">
            {verification.documentUrl ? (
              <img src={imageUrl} alt="KYC Document" className="max-w-full max-h-[600px] object-contain" />
            ) : (
              <span className="text-on-surface-variant">No image available</span>
            )}
          </div>
        </div>

        {/* Details & Actions */}
        <div className="flex flex-col gap-lg">
          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-lg flex flex-col gap-md shadow-sm">
            <h2 className="font-headline-md text-primary border-b border-surface-border pb-sm">User Details</h2>
            <div className="grid grid-cols-2 gap-sm font-body-sm">
              <span className="text-on-surface-variant font-label-sm">User Email:</span>
              <span className="text-on-surface">{verification.user?.email || 'N/A'}</span>
              
              <span className="text-on-surface-variant font-label-sm">User Name:</span>
              <span className="text-on-surface">{verification.user?.fullName || 'N/A'}</span>
              
              <span className="text-on-surface-variant font-label-sm">Document Type:</span>
              <span className="text-on-surface capitalize">{verification.documentType}</span>
              
              <span className="text-on-surface-variant font-label-sm">Submitted At:</span>
              <span className="text-on-surface">{new Date(verification.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-lg flex flex-col gap-md shadow-sm">
            <h2 className="font-headline-md text-primary border-b border-surface-border pb-sm">Decision</h2>
            <textarea
              className="w-full border border-outline-variant rounded p-sm bg-surface focus:outline-none focus:border-secondary font-body-sm min-h-[100px]"
              placeholder="Add notes (required for rejection)..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className="flex gap-md mt-sm">
              <button 
                onClick={() => handleAction('approved')}
                disabled={submitting}
                className="flex-1 bg-success text-on-error px-md py-sm rounded font-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Approve
              </button>
              <button 
                onClick={() => handleAction('rejected')}
                disabled={submitting}
                className="flex-1 bg-error text-on-error px-md py-sm rounded font-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
