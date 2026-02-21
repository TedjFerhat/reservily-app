import { useState, useEffect } from 'react'
import { doctorAPI } from '../../services/api'
import { PageSpinner, ConfirmModal } from '../../components/common'
import toast from 'react-hot-toast'
import { Clock, Plus, Trash2 } from 'lucide-react'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
const DAY_LABELS = { MONDAY:'Monday',TUESDAY:'Tuesday',WEDNESDAY:'Wednesday',THURSDAY:'Thursday',FRIDAY:'Friday',SATURDAY:'Saturday',SUNDAY:'Sunday' }

export default function DoctorAvailability() {
  const [slots, setSlots]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm]         = useState({ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00' })

  const fetch = () => {
    setLoading(true)
    doctorAPI.getAvailability().then(r => setSlots(r.data.data || [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const usedDays = new Set(slots.map(s => s.dayOfWeek))

  const handleAdd = async (e) => {
    e.preventDefault()
    if (form.startTime >= form.endTime) {
      toast.error('Start time must be before end time.')
      return
    }
    setSaving(true)
    try {
      await doctorAPI.setAvailability(form)
      toast.success('Availability updated.')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await doctorAPI.deleteAvailability(deleteTarget)
      toast.success('Availability removed.')
      fetch()
    } catch (err) {
      toast.error('Failed to remove.')
    } finally {
      setDeleteTarget(null)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="animate-slide-up max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Availability</h1>
        <p className="page-subtitle">Set your weekly schedule so patients can book you.</p>
      </div>

      {/* Add form */}
      <div className="card p-6 mb-6">
        <h2 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Plus size={15} className="text-teal-500" /> Add / Update Availability
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="label">Day</label>
            <select
              value={form.dayOfWeek}
              onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}
              className="input-field"
            >
              {DAYS.map(d => (
                <option key={d} value={d}>{DAY_LABELS[d]} {usedDays.has(d) ? '(set)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input
              type="time"
              value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="time"
              value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Current schedule */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-display text-base font-semibold text-slate-900">Current Schedule</h2>
        </div>
        {slots.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Clock size={28} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No availability set yet. Add your first slot above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {[...slots].sort((a, b) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek)).map(slot => (
              <div key={slot.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {DAY_LABELS[slot.dayOfWeek].slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{DAY_LABELS[slot.dayOfWeek]}</p>
                    <p className="text-sm font-mono text-slate-400">{slot.startTime} – {slot.endTime}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(slot.dayOfWeek)}
                  className="text-slate-300 hover:text-red-400 p-2 rounded-lg hover:bg-red-50 transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title={`Remove ${DAY_LABELS[deleteTarget]} availability?`}
        message="Patients will no longer be able to book on this day."
        confirmLabel="Remove"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}