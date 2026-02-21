import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { patientAPI, appointmentAPI } from '../../services/api'
import { PageSpinner, StatusBadge, Empty, Pagination, ConfirmModal } from '../../components/common'
import toast from 'react-hot-toast'
import { Calendar, Search, X } from 'lucide-react'
import { format } from 'date-fns'

const STATUSES = ['ALL','PENDING','APPROVED','REJECTED','CANCELLED']

export default function PatientAppointments() {
  const [appointments, setAppts] = useState([])
  const [pagination, setPag]     = useState({})
  const [loading, setLoading]    = useState(true)
  const [status, setStatus]      = useState('ALL')
  const [page, setPage]          = useState(1)
  const [cancelTarget, setCancelTarget] = useState(null)

  const fetchAppts = (p = 1, s = status) => {
    setLoading(true)
    const params = { page: p, limit: 10, ...(s !== 'ALL' && { status: s }) }
    patientAPI.getAppointments(params)
      .then(r => { setAppts(r.data.data); setPag(r.data.pagination) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAppts() }, [])

  const handleStatusFilter = (s) => { setStatus(s); setPage(1); fetchAppts(1, s) }
  const handlePage = (p) => { setPage(p); fetchAppts(p) }

  const handleCancel = async () => {
    try {
      await appointmentAPI.cancel(cancelTarget)
      toast.success('Appointment cancelled.')
      fetchAppts(page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel')
    } finally {
      setCancelTarget(null)
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-subtitle">{pagination.total || 0} total appointments</p>
        </div>
        <Link to="/patient/search" className="btn-primary text-sm">
          <Search size={14} /> Find a Doctor
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => handleStatusFilter(s)}
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
        <Empty icon={Calendar} title="No appointments" message="Book your first appointment with a verified doctor." />
      ) : (
        <div className="space-y-3">
          {appointments.map(appt => (
            <div key={appt.id} className="card p-5 flex items-start sm:items-center gap-4 flex-col sm:flex-row">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                <Calendar size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="font-semibold text-slate-800">Dr. {appt.doctor?.user?.name}</p>
                  <StatusBadge status={appt.status} />
                </div>
                <p className="text-sm text-teal-600">{appt.doctor?.specialty}</p>
                <p className="text-sm text-slate-400 mt-0.5">
                  {format(new Date(appt.date), 'EEEE, MMMM d, yyyy')} at {appt.time}
                </p>
                {appt.notes && <p className="text-xs text-slate-400 mt-1 italic">"{appt.notes}"</p>}
              </div>
              {['PENDING','APPROVED'].includes(appt.status) && (
                <button
                  onClick={() => setCancelTarget(appt.id)}
                  className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 flex-shrink-0"
                >
                  <X size={14} /> Cancel
                </button>
              )}
            </div>
          ))}
          <Pagination page={page} pages={pagination.pages} onPage={handlePage} />
        </div>
      )}

      <ConfirmModal
        open={!!cancelTarget}
        title="Cancel appointment?"
        message="This action cannot be undone. The doctor will be notified."
        confirmLabel="Yes, cancel it"
        danger
        onConfirm={handleCancel}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  )
}