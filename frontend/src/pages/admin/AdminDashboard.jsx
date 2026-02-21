import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { PageSpinner } from '../../components/common'
import { Users, Stethoscope, Calendar, ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getStats().then(r => setStats(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const cards = [
    { label: 'Total Users',        value: stats?.users?.total,             icon: Users,       color: 'bg-blue-50 text-blue-600',   link: '/admin/users' },
    { label: 'Active Doctors',     value: stats?.doctors?.active,          icon: Stethoscope, color: 'bg-teal-50 text-teal-600',   link: '/admin/users?role=DOCTOR' },
    { label: 'Total Appointments', value: stats?.appointments?.total,      icon: Calendar,    color: 'bg-violet-50 text-violet-600', link: '/admin/appointments' },
    { label: 'Pending Payments',   value: stats?.payments?.pendingReview,  icon: ShieldCheck, color: 'bg-amber-50 text-amber-600', link: '/admin/payments' },
  ]

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and management.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="stat-card hover:shadow-card-hover transition-shadow duration-200 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${color}`}>
              <Icon size={19} />
            </div>
            <p className="stat-value">{value ?? '—'}</p>
            <div className="flex items-center justify-between">
              <p className="stat-label">{label}</p>
              <ArrowRight size={13} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="font-display text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-500" /> Pending Verifications
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            <span className="font-bold text-slate-800 text-xl">{stats?.payments?.pendingReview}</span> payment submission{stats?.payments?.pendingReview !== 1 ? 's' : ''} awaiting your review.
          </p>
          <Link to="/admin/payments" className="btn-primary text-sm">Review payments</Link>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-teal-500" /> Appointment Activity
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            <span className="font-bold text-slate-800 text-xl">{stats?.appointments?.pending}</span> appointment{stats?.appointments?.pending !== 1 ? 's' : ''} pending doctor confirmation.
          </p>
          <Link to="/admin/appointments" className="btn-secondary text-sm">View appointments</Link>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users size={16} className="text-blue-500" /> Users
          </h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Patients', value: stats?.users?.patients },
              { label: 'Doctors',  value: stats?.users?.doctors },
              { label: 'Pending',  value: stats?.doctors?.pendingVerification },
            ].map(({ label, value }) => (
              <div key={label} className="text-center bg-slate-50 rounded-xl py-3">
                <p className="font-display text-xl font-bold text-slate-800">{value ?? 0}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <Link to="/admin/users" className="btn-secondary text-sm">Manage users</Link>
        </div>
      </div>
    </div>
  )
}