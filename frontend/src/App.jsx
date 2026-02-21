import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Layouts
import DashboardLayout from './components/layout/DashboardLayout'

// Public pages
import LandingPage    from './pages/LandingPage'
import LoginPage      from './pages/auth/LoginPage'
import RegisterPage   from './pages/auth/RegisterPage'

// Patient pages
import PatientDashboard   from './pages/patient/PatientDashboard'
import SearchDoctors      from './pages/patient/SearchDoctors'
import DoctorProfile      from './pages/patient/DoctorProfile'
import BookAppointment    from './pages/patient/BookAppointment'
import PatientAppointments from './pages/patient/PatientAppointments'
import PatientSettings    from './pages/patient/PatientSettings'

// Doctor pages
import DoctorDashboard    from './pages/doctor/DoctorDashboard'
import DoctorAvailability from './pages/doctor/DoctorAvailability'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import DoctorSubscription from './pages/doctor/DoctorSubscription'
import DoctorSettings     from './pages/doctor/DoctorSettings'

// Admin pages
import AdminDashboard     from './pages/admin/AdminDashboard'
import AdminUsers         from './pages/admin/AdminUsers'
import AdminPayments      from './pages/admin/AdminPayments'
import AdminAppointments  from './pages/admin/AdminAppointments'

// Guards
function RequireAuth({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/unauthorized" replace />
  return children
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to={getDashboard(user.role)} replace />
  return children
}

function getDashboard(role) {
  if (role === 'ADMIN')   return '/admin'
  if (role === 'DOCTOR')  return '/doctor'
  return '/patient'
}

function PageLoader() {
  return (
    <div className="fixed inset-0 bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" style={{borderWidth: 3}} />
        <p className="text-slate-500 text-sm font-body">Loading Reservily…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/doctors/:id" element={<DoctorProfile />} />

        {/* Patient */}
        <Route path="/patient" element={<RequireAuth role="PATIENT"><DashboardLayout /></RequireAuth>}>
          <Route index                  element={<PatientDashboard />} />
          <Route path="search"          element={<SearchDoctors />} />
          <Route path="book/:doctorId"  element={<BookAppointment />} />
          <Route path="appointments"    element={<PatientAppointments />} />
          <Route path="settings"        element={<PatientSettings />} />
        </Route>

        {/* Doctor */}
        <Route path="/doctor" element={<RequireAuth role="DOCTOR"><DashboardLayout /></RequireAuth>}>
          <Route index                element={<DoctorDashboard />} />
          <Route path="availability"  element={<DoctorAvailability />} />
          <Route path="appointments"  element={<DoctorAppointments />} />
          <Route path="subscription"  element={<DoctorSubscription />} />
          <Route path="settings"      element={<DoctorSettings />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth role="ADMIN"><DashboardLayout /></RequireAuth>}>
          <Route index                element={<AdminDashboard />} />
          <Route path="users"         element={<AdminUsers />} />
          <Route path="payments"      element={<AdminPayments />} />
          <Route path="appointments"  element={<AdminAppointments />} />
        </Route>

        <Route path="/unauthorized" element={
          <div className="min-h-screen bg-cream flex items-center justify-center">
            <div className="text-center">
              <h1 className="font-display text-4xl text-slate-900 mb-2">403</h1>
              <p className="text-slate-500">You don't have access to this page.</p>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}