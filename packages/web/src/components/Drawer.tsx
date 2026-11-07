import { useEffect } from 'react';

export function Drawer({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-root" role="dialog" aria-modal="true">
      <button type="button" className="drawer-backdrop" aria-label="关闭" onClick={onClose} />
      <div className={`drawer-panel ${wide ? 'drawer-wide' : ''}`}>
        <header className="drawer-header">
          <h2 className="font-semibold text-base">{title}</h2>
          <button type="button" className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  );
}
