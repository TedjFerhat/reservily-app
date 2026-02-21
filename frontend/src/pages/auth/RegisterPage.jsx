import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Stethoscope, UserRound, Briefcase, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { authAPI } from '../../services/api'

const SPECIALTIES = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'General Practice', 'Gynecology', 'Neurology', 'Oncology',
  'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Urology'
]

export default function RegisterPage() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [role, setRole]         = useState(params.get('role')?.toUpperCase() === 'DOCTOR' ? 'DOCTOR' : 'PATIENT')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    specialty: '', city: '', clinicAddress: '', price: '', experience: '', bio: '',
  })

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role }
      if (role === 'DOCTOR') {
        Object.assign(payload, {
          specialty: form.specialty,
          city: form.city,
          clinicAddress: form.clinicAddress,
          price: parseFloat(form.price),
          experience: parseInt(form.experience),
          bio: form.bio || undefined,
        })
      }

      await authAPI.register(payload)
      // Auto login after registration
      const data = await login({ email: form.email, password: form.password })
      toast.success(role === 'DOCTOR'
        ? 'Account created! Please complete your subscription to go live.'
        : `Welcome, ${data.user.name}!`
      )
      navigate(role === 'DOCTOR' ? '/doctor/subscription' : '/patient', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.errors?.[0] || err.response?.data?.message || 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-lg mx-auto animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Stethoscope size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-slate-900">Reservily</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
          <p className="text-slate-500 text-sm">Free for patients · Monthly subscription for doctors</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { value: 'PATIENT', icon: UserRound, label: 'Patient', desc: 'Find & book doctors' },
            { value: 'DOCTOR',  icon: Briefcase, label: 'Doctor',  desc: 'Manage appointments' },
          ].map(({ value, icon: Icon, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                role === value
                  ? 'border-teal-500 bg-teal-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${role === value ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                <Icon size={18} />
              </div>
              <p className="font-semibold text-slate-800 text-sm">{label}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {/* Common fields */}
          <div>
            <label className="label">Full name</label>
            <input name="name" value={form.name} onChange={handleChange} className="input-field" placeholder="Dr. Jane Smith" required />
          </div>
          <div>
            <label className="label">Email address</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input-field pr-11"
                placeholder="Min 8 characters"
                required minLength={8}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Doctor fields */}
          {role === 'DOCTOR' && (
            <>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Practice Information</p>
              </div>
              <div>
                <label className="label">Specialty</label>
                <select name="specialty" value={form.specialty} onChange={handleChange} className="input-field" required>
                  <option value="">Select specialty</option>
                  {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City</label>
                  <input name="city" value={form.city} onChange={handleChange} className="input-field" placeholder="New York" required />
                </div>
                <div>
                  <label className="label">Experience (years)</label>
                  <input type="number" name="experience" value={form.experience} onChange={handleChange} className="input-field" placeholder="5" required min="0" />
                </div>
              </div>
              <div>
                <label className="label">Clinic address</label>
                <input name="clinicAddress" value={form.clinicAddress} onChange={handleChange} className="input-field" placeholder="123 Medical Ave, Suite 4" required />
              </div>
              <div>
                <label className="label">Consultation price ($)</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} className="input-field" placeholder="150" required min="1" step="0.01" />
              </div>
              <div>
                <label className="label">Bio <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea name="bio" value={form.bio} onChange={handleChange} className="input-field resize-none" rows={3} placeholder="Brief description of your practice…" />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 !mt-6">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating account…
              </span>
            ) : (
              <>Create account <ChevronRight size={16} /></>
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}