import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { patientAPI, authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { User, Lock } from 'lucide-react'

export default function PatientSettings() {
  const { user, refreshUser } = useAuth()
  const [name, setName]       = useState(user?.name || '')
  const [saving, setSaving]   = useState(false)
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '' })
  const [savingPw, setSavingPw] = useState(false)

  const handleProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await patientAPI.updateProfile({ name })
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
      toast.success('Password changed successfully.')
      setPwForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="animate-slide-up max-w-lg">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account</p>
      </div>

      {/* Profile */}
      <div className="card p-6 mb-4">
        <h2 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <User size={16} className="text-teal-500" /> Profile
        </h2>
        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email} className="input-field bg-slate-50 text-slate-400" disabled />
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