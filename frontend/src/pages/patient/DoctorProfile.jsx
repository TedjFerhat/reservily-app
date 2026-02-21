import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doctorAPI } from '../../services/api'
import { PageSpinner } from '../../components/common'
import { useAuth } from '../../contexts/AuthContext'
import { MapPin, DollarSign, Clock, Calendar, ArrowLeft, Stethoscope } from 'lucide-react'

const DAY_ORDER = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
const DAY_SHORT = { MONDAY:'Mon',TUESDAY:'Tue',WEDNESDAY:'Wed',THURSDAY:'Thu',FRIDAY:'Fri',SATURDAY:'Sat',SUNDAY:'Sun' }

export default function DoctorProfile() {
  const { id }          = useParams()
  const { user }        = useAuth()
  const navigate        = useNavigate()
  const [doc, setDoc]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    doctorAPI.getById(id).then(r => setDoc(r.data.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center"><PageSpinner /></div>
  if (!doc) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-2xl text-slate-900 mb-2">Doctor not found</p>
        <Link to="/" className="text-teal-600 hover:underline">Return home</Link>
      </div>
    </div>
  )

  const sortedAvail = [...(doc.availability || [])].sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek))

  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Top nav */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost text-sm p-2">
            <ArrowLeft size={17} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <Stethoscope size={13} className="text-white" />
            </div>
            <span className="font-display text-base font-semibold text-slate-900">Reservily</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Profile card */}
            <div className="card p-6 text-center">
              <div className="w-20 h-20 rounded-3xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-4 font-display text-3xl font-bold">
                {doc.user?.name?.charAt(0)}
              </div>
              <h1 className="font-display text-xl font-bold text-slate-900">Dr. {doc.user?.name}</h1>
              <p className="text-teal-600 font-medium text-sm mt-0.5">{doc.specialty}</p>
              <p className="text-slate-400 text-sm flex items-center justify-center gap-1 mt-1">
                <MapPin size={12} /> {doc.city}
              </p>
            </div>

            {/* Stats */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5"><DollarSign size={14} />Consultation</span>
                <span className="font-semibold text-slate-800">${doc.price}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5"><Clock size={14} />Experience</span>
                <span className="font-semibold text-slate-800">{doc.experience} years</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5"><Calendar size={14} />Availability</span>
                <span className="font-semibold text-slate-800">{sortedAvail.length} day{sortedAvail.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Book button */}
            {user?.role === 'PATIENT' && sortedAvail.length > 0 && (
              <Link to={`/patient/book/${doc.id}`} className="btn-primary w-full justify-center py-3">
                Book Appointment
              </Link>
            )}
            {!user && (
              <Link to="/login" className="btn-primary w-full justify-center py-3">
                Sign in to Book
              </Link>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* About */}
            {doc.bio && (
              <div className="card p-6">
                <h2 className="font-display text-lg font-semibold text-slate-900 mb-3">About</h2>
                <p className="text-slate-600 text-sm leading-relaxed">{doc.bio}</p>
              </div>
            )}

            {/* Clinic */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-slate-900 mb-3">Clinic</h2>
              <p className="text-slate-600 text-sm flex items-start gap-2">
                <MapPin size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
                {doc.clinicAddress}
              </p>
            </div>

            {/* Availability */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Weekly Schedule</h2>
              {sortedAvail.length === 0 ? (
                <p className="text-slate-400 text-sm">No availability set.</p>
              ) : (
                <div className="space-y-2">
                  {sortedAvail.map(slot => (
                    <div key={slot.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50">
                      <span className="text-sm font-medium text-slate-700">{DAY_SHORT[slot.dayOfWeek]}</span>
                      <span className="text-sm text-teal-600 font-mono">{slot.startTime} – {slot.endTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}