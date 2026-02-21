import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Calendar, Search, Settings, LogOut,
  CreditCard, Clock, Users, ShieldCheck, Menu, X,
  ChevronRight, Stethoscope
} from 'lucide-react'

const navConfig = {
  PATIENT: [
    { to: '/patient',              icon: LayoutDashboard, label: 'Dashboard',     end: true },
    { to: '/patient/search',       icon: Search,          label: 'Find Doctors' },
    { to: '/patient/appointments', icon: Calendar,        label: 'Appointments' },
    { to: '/patient/settings',     icon: Settings,        label: 'Settings' },
  ],
  DOCTOR: [
    { to: '/doctor',               icon: LayoutDashboard, label: 'Dashboard',     end: true },
    { to: '/doctor/appointments',  icon: Calendar,        label: 'Appointments' },
    { to: '/doctor/availability',  icon: Clock,           label: 'Availability' },
    { to: '/doctor/subscription',  icon: CreditCard,      label: 'Subscription' },
    { to: '/doctor/settings',      icon: Settings,        label: 'Settings' },
  ],
  ADMIN: [
    { to: '/admin',                icon: LayoutDashboard, label: 'Dashboard',     end: true },
    { to: '/admin/users',          icon: Users,           label: 'Users' },
    { to: '/admin/payments',       icon: ShieldCheck,     label: 'Payments' },
    { to: '/admin/appointments',   icon: Calendar,        label: 'Appointments' },
  ],
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate          = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = navConfig[user?.role] || []

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const roleLabel = {
    PATIENT: 'Patient',
    DOCTOR:  'Doctor',
    ADMIN:   'Admin',
  }[user?.role] || ''

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-100
        flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <Stethoscope size={16} className="text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-slate-900">Reservily</span>
          </NavLink>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50">
            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-scroll space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-teal-50 text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
              `}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 w-full transition-all duration-150"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 lg:px-8 gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb area - could be enhanced */}
          <div className="flex-1" />

          {/* Doctor subscription warning */}
          {user?.role === 'DOCTOR' && user?.subscriptionStatus === 'INACTIVE' && (
            <NavLink
              to="/doctor/subscription"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <CreditCard size={13} />
              Activate Subscription
              <ChevronRight size={13} />
            </NavLink>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}