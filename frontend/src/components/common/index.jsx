// ── StatusBadge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    ACTIVE:    'badge-active',
    INACTIVE:  'badge-inactive',
    PENDING:   'badge-pending',
    APPROVED:  'badge-approved',
    REJECTED:  'badge-rejected',
    CANCELLED: 'badge-cancelled',
  }
  return <span className={map[status] || 'badge badge-inactive'}>{status}</span>
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' }
  return (
    <div className={`${sizes[size]} border-2 border-teal-600 border-t-transparent rounded-full animate-spin`} />
  )
}

// ── PageSpinner ───────────────────────────────────────────────────────────────
export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner size="md" />
    </div>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center mb-4">
          <Icon size={26} />
        </div>
      )}
      <p className="font-display text-lg font-semibold text-slate-700 mb-1">{title}</p>
      {message && <p className="text-slate-400 text-sm mb-5 max-w-xs">{message}</p>}
      {action}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
            p === page
              ? 'bg-teal-600 text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────
export function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-sm shadow-modal animate-slide-up">
        <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger text-sm py-2 px-4' : 'btn-primary text-sm py-2 px-4'}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}