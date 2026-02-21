import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { doctorAPI } from '../../services/api'
import { PageSpinner, StatusBadge } from '../../components/common'
import { Calendar, Clock, CreditCard, TrendingUp, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export default function DoctorDashboard() {
  const { user }            = useAuth()
  const [appts, setAppts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [subInfo, setSubInfo] = useState(null)

  useEffect(() => {
    Promise.all([
      doctorAPI.getSubscriptionInfo().then(r => setSubInfo(r.data.data)),
      doctorAPI.getAppointments({ limit: 5 }).then(r => setAppts(r.data.data || [])),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const isActive   = subInfo?.subscriptionStatus === 'ACTIVE'
  const isPending  = subInfo?.subscriptionStatus === 'PENDING'
  const pending    = appts.filter(a => a.status === 'PENDING').length

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Welcome, Dr. {user?.name?.split(' ').slice(-1)[0]} 👋</h1>
        <p className="page-subtitle">Manage your practice and appointments.</p>
      </div>

      {/* Subscription banner */}
      {!isActive && (
        <div className={`rounded-2xl p-5 mb-6 border flex items-center justify-between gap-4 flex-wrap ${
          isPending ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
        }`}>
          <div>
            <p className={`font-semibold ${isPending ? 'text-amber-800' : 'text-red-800'}`}>
              {isPending ? '⏳ Payment under review' : '⚠️ Subscription required'}
            </p>
            <p className={`text-sm mt-0.5 ${isPending ? 'text-amber-600' : 'text-red-600'}`}>
              {isPending
                ? 'An admin will verify your payment and activate your account within 24 hours.'
                : 'Activate your subscription to go live and accept appointments.'}
            </p>
          </div>
          {!isPending && (
            <Link to="/doctor/subscription" className="btn-primary text-sm flex-shrink-0">
              Activate now <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <Calendar size={20} className="text-teal-500 mb-1" />
          <p className="stat-value">{appts.length}</p>
          <p className="stat-label">Appointments</p>
        </div>
        <div className="stat-card">
          <Clock size={20} className="text-amber-500 mb-1" />
          <p className="stat-value">{pending}</p>
          <p className="stat-label">Pending review</p>
        </div>
        <div className="stat-card">
          <TrendingUp size={20} className="text-blue-500 mb-1" />
          <p className="stat-value">{appts.filter(a => a.status === 'APPROVED').length}</p>
          <p className="stat-label">Confirmed</p>
        </div>
        <div className="stat-card">
          <CreditCard size={20} className={isActive ? 'text-teal-500' : 'text-red-400'} style={{marginBottom: 4}} />
          <p className={`stat-value text-xl ${isActive ? 'text-teal-600' : 'text-red-500'}`}>{subInfo?.subscriptionStatus}</p>
          <p className="stat-label">Subscription</p>
        </div>
      </div>

      {/* Recent appointments */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">Recent Appointments</h2>
          <Link to="/doctor/appointments" className="text-teal-600 text-sm font-medium hover:underline">View all</Link>
        </div>
        {appts.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">No appointments yet.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {appts.slice(0, 5).map(appt => (
              <div key={appt.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {appt.patient?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{appt.patient?.name}</p>
                  <p className="text-xs text-slate-400">{format(new Date(appt.date), 'MMM d, yyyy')} at {appt.time}</p>
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