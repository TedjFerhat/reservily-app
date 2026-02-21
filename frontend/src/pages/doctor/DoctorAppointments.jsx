import { useState, useEffect } from 'react'
import { doctorAPI, appointmentAPI } from '../../services/api'
import { PageSpinner, StatusBadge, Empty, Pagination, ConfirmModal } from '../../components/common'
import toast from 'react-hot-toast'
import { Calendar, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

const STATUSES = ['ALL','PENDING','APPROVED','REJECTED','CANCELLED']

export default function DoctorAppointments() {
  const [appointments, setAppts] = useState([])
  const [pagination, setPag]     = useState({})
  const [loading, setLoading]    = useState(true)
  const [status, setStatus]      = useState('ALL')
  const [page, setPage]          = useState(1)
  const [actionTarget, setActionTarget] = useState(null) // {id, action: 'approve'|'reject'}

  const fetchAppts = (p = 1, s = status) => {
    setLoading(true)
    const params = { page: p, limit: 10, ...(s !== 'ALL' && { status: s }) }
    doctorAPI.getAppointments(params)
      .then(r => { setAppts(r.data.data || []); setPag(r.data.pagination || {}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAppts() }, [])

  const handleFilter = (s) => { setStatus(s); setPage(1); fetchAppts(1, s) }
  const handlePage   = (p) => { setPage(p); fetchAppts(p) }

  const handleAction = async () => {
    try {
      if (actionTarget.action === 'approve') {
        await appointmentAPI.approve(actionTarget.id)
        toast.success('Appointment approved!')
      } else {
        await appointmentAPI.reject(actionTarget.id)
        toast.success('Appointment rejected.')
      }
      fetchAppts(page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionTarget(null)
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Appointments</h1>
        <p className="page-subtitle">{pagination.total || 0} total</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => handleFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
              status === s
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : appointments.length === 0 ? (
        <Empty icon={Calendar} title="No appointments" message="Appointments from patients will appear here." />
      ) : (
        <div className="space-y-3">
          {appointments.map(appt => (
            <div key={appt.id} className="card p-5 flex items-start sm:items-center gap-4 flex-col sm:flex-row">
              <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold flex-shrink-0">
                {appt.patient?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800">{appt.patient?.name}</p>
                  <StatusBadge status={appt.status} />
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {format(new Date(appt.date), 'EEEE, MMMM d, yyyy')} at <span className="font-mono">{appt.time}</span>
                </p>
                {appt.notes && <p className="text-xs text-slate-400 mt-1 italic">"{appt.notes}"</p>}
              </div>
              {appt.status === 'PENDING' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setActionTarget({ id: appt.id, action: 'approve' })}
                    className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-800 px-3 py-1.5 rounded-lg hover:bg-teal-50 border border-teal-200 transition-all"
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    onClick={() => setActionTarget({ id: appt.id, action: 'reject' })}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-200 transition-all"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          <Pagination page={page} pages={pagination.pages} onPage={handlePage} />
        </div>
      )}

      <ConfirmModal
        open={!!actionTarget}
        title={actionTarget?.action === 'approve' ? 'Approve this appointment?' : 'Reject this appointment?'}
        message={actionTarget?.action === 'approve'
          ? 'The patient will be notified that their appointment is confirmed.'
          : 'The patient will be notified that their appointment has been rejected.'
        }
        confirmLabel={actionTarget?.action === 'approve' ? 'Yes, approve' : 'Yes, reject'}
        danger={actionTarget?.action === 'reject'}
        onConfirm={handleAction}
        onClose={() => setActionTarget(null)}
      />
    </div>
  )
}