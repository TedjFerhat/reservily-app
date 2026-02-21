import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { PageSpinner, StatusBadge, Empty, Pagination } from '../../components/common'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'

const STATUSES = ['ALL','PENDING','APPROVED','REJECTED','CANCELLED']

export default function AdminAppointments() {
  const [appointments, setAppts] = useState([])
  const [pagination, setPag]     = useState({})
  const [loading, setLoading]    = useState(true)
  const [status, setStatus]      = useState('ALL')
  const [page, setPage]          = useState(1)

  const fetchAppts = (p = 1, s = status) => {
    setLoading(true)
    const params = { page: p, limit: 15, ...(s !== 'ALL' && { status: s }) }
    adminAPI.getAppointments(params)
      .then(r => { setAppts(r.data.data || []); setPag(r.data.pagination || {}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAppts() }, [])

  const handleFilter = (s) => { setStatus(s); setPage(1); fetchAppts(1, s) }
  const handlePage   = (p) => { setPage(p); fetchAppts(p) }

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">All Appointments</h1>
        <p className="page-subtitle">{pagination.total || 0} platform-wide</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => handleFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
              status === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : appointments.length === 0 ? (
        <Empty icon={Calendar} title="No appointments" message="No appointments match the selected filter." />
      ) : (
        <>
          <div className="card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Doctor</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {appointments.map(appt => (
                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{appt.patient?.name}</p>
                        <p className="text-xs text-slate-400">{appt.patient?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">Dr. {appt.doctor?.user?.name}</p>
                        <p className="text-xs text-teal-600">{appt.doctor?.specialty}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-700">{format(new Date(appt.date), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-slate-400 font-mono">{appt.time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={appt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={pagination.pages} onPage={handlePage} />
        </>
      )}
    </div>
  )
}