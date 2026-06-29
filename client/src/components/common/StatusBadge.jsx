export default function StatusBadge({ status }) {
  let bg = 'bg-surface-variant';
  let text = 'text-on-surface-variant';
  
  if (status === 'pending') {
    bg = 'bg-warning/20';
    text = 'text-warning';
  } else if (status === 'verified' || status === 'approved') {
    bg = 'bg-success/20';
    text = 'text-success';
  } else if (status === 'rejected') {
    bg = 'bg-error/20';
    text = 'text-error';
  }

  return (
    <span className={`px-sm py-xxs rounded text-label-sm font-label-sm capitalize ${bg} ${text}`}>
      {status}
    </span>
  );
}
