import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { patientAPI } from '../../services/api'
import { PageSpinner, StatusBadge } from '../../components/common'
import { Calendar, Search, Clock, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export default function PatientDashboard() {
  const { user }        = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientAPI.getAppointments({ limit: 5 })
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const upcoming = data?.data?.filter(a => ['PENDING','APPROVED'].includes(a.status)) || []
  const total    = data?.pagination?.total || 0

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Hello, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Manage your health appointments in one place.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/patient/search" className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow duration-200 group">
          <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
            <Search size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">Find a Doctor</p>
            <p className="text-sm text-slate-400">Search by specialty or city</p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
        </Link>

        <Link to="/patient/appointments" className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow duration-200 group">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
            <Calendar size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">My Appointments</p>
            <p className="text-sm text-slate-400">{total} total appointments</p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
        </Link>
      </div>

      {/* Upcoming appointments */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">Upcoming Appointments</h2>
          <Link to="/patient/appointments" className="text-teal-600 text-sm font-medium hover:underline">View all</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Clock size={28} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No upcoming appointments.</p>
            <Link to="/patient/search" className="btn-primary text-sm mt-4 inline-flex">
              Book your first appointment
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {upcoming.map(appt => (
              <div key={appt.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <Calendar size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">Dr. {appt.doctor?.user?.name}</p>
                  <p className="text-sm text-slate-400">{appt.doctor?.specialty} · {format(new Date(appt.date), 'MMM d, yyyy')} at {appt.time}</p>
                </div>
                <StatusBadge status={appt.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}