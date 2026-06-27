import { useEffect } from 'react';

export default function Modal({ open, onClose, children, maxWidth = '720px' }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[rgba(15,23,42,0.45)] flex items-start justify-center z-[100] px-5 py-10 overflow-y-auto backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full shadow-2xl animate-[pop_.25s_ease]"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}
