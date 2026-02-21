import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { doctorAPI, authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { PageSpinner } from '../../components/common'
import { User, Stethoscope, Lock } from 'lucide-react'

const SPECIALTIES = [
  'Cardiology','Dermatology','Endocrinology','Gastroenterology',
  'General Practice','Gynecology','Neurology','Oncology',
  'Ophthalmology','Orthopedics','Pediatrics','Psychiatry','Pulmonology','Radiology','Urology'
]

export default function DoctorSettings() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({})
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '' })
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    authAPI.getMe().then(r => {
      const p = r.data.data?.doctorProfile
      setProfile(p)
      setForm({
        specialty: p?.specialty || '',
        city: p?.city || '',
        clinicAddress: p?.clinicAddress || '',
        price: p?.price || '',
        experience: p?.experience || '',
        bio: p?.bio || '',
      })
    }).finally(() => setLoading(false))
  }, [])

  const handleProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await doctorAPI.updateProfile({ ...form, price: parseFloat(form.price), experience: parseInt(form.experience) })
      await refreshUser()
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setSavingPw(true)
    try {
      await authAPI.changePassword(pwForm)
      toast.success('Password changed.')
      setPwForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setSavingPw(false)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="animate-slide-up max-w-lg">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Update your practice and account details</p>
      </div>

      {/* Account info */}
      <div className="card p-6 mb-4">
        <h2 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <User size={16} className="text-teal-500" /> Account
        </h2>
        <div className="space-y-3">
          <div>
            <label className="label">Full name</label>
            <input value={user?.name} className="input-field bg-slate-50 text-slate-400" disabled />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email} className="input-field bg-slate-50 text-slate-400" disabled />
          </div>
        </div>
      </div>

      {/* Practice info */}
      <div className="card p-6 mb-4">
        <h2 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Stethoscope size={16} className="text-teal-500" /> Practice Details
        </h2>
        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="label">Specialty</label>
            <select value={form.specialty} onChange={e => setForm(f => ({...f, specialty: e.target.value}))} className="input-field">
              {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} className="input-field" />
            </div>
            <div>
              <label className="label">Experience (years)</label>
              <input type="number" value={form.experience} onChange={e => setForm(f => ({...f, experience: e.target.value}))} className="input-field" min="0" />
            </div>
          </div>
          <div>
            <label className="label">Clinic address</label>
            <input value={form.clinicAddress} onChange={e => setForm(f => ({...f, clinicAddress: e.target.value}))} className="input-field" />
          </div>
          <div>
            <label className="label">Consultation price ($)</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} className="input-field" step="0.01" min="1" />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} className="input-field resize-none" rows={3} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card p-6">
        <h2 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Lock size={16} className="text-teal-500" /> Change Password
        </h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({...f, currentPassword: e.target.value}))} className="input-field" required />
          </div>
          <div>
            <label className="label">New password</label>
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))} className="input-field" required minLength={8} />
          </div>
          <button type="submit" disabled={savingPw} className="btn-primary text-sm">
            {savingPw ? 'Updating…' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  )
}