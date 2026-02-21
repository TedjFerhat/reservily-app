import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doctorAPI, appointmentAPI } from '../../services/api'
import { PageSpinner } from '../../components/common'
import toast from 'react-hot-toast'
import { Calendar, Clock, MapPin, CheckCircle, ArrowLeft } from 'lucide-react'
import { format, addDays } from 'date-fns'

const DAY_MAP = { 0:'SUNDAY',1:'MONDAY',2:'TUESDAY',3:'WEDNESDAY',4:'THURSDAY',5:'FRIDAY',6:'SATURDAY' }
const DAY_ORDER = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']

function getTimeSlots(start, end) {
  const slots = []
  let [h, m] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  while (h < eh || (h === eh && m < em)) {
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    m += 30
    if (m >= 60) { h++; m = 0 }
  }
  return slots
}

export default function BookAppointment() {
  const { doctorId } = useParams()
  const navigate     = useNavigate()

  const [doc, setDoc]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep]     = useState(1) // 1=select date/time, 2=confirm
  const [selected, setSelected] = useState({ date: null, time: null })
  const [notes, setNotes]   = useState('')

  useEffect(() => {
    doctorAPI.getById(doctorId).then(r => setDoc(r.data.data)).finally(() => setLoading(false))
  }, [doctorId])

  if (loading) return <PageSpinner />
  if (!doc) return <div className="text-center py-16 text-slate-400">Doctor not found.</div>

  // Build next 14 days and filter by availability
  const availDays = new Set(doc.availability?.map(a => a.dayOfWeek))
  const upcoming = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i + 1)
    return { date: d, dayOfWeek: DAY_MAP[d.getDay()] }
  }).filter(({ dayOfWeek }) => availDays.has(dayOfWeek))

  const selectedAvail = selected.date
    ? doc.availability?.find(a => a.dayOfWeek === DAY_MAP[selected.date.getDay()])
    : null

  const timeSlots = selectedAvail ? getTimeSlots(selectedAvail.startTime, selectedAvail.endTime) : []

  const handleBook = async () => {
    setSubmitting(true)
    try {
      await appointmentAPI.book({
        doctorId,
        date: format(selected.date, 'yyyy-MM-dd'),
        time: selected.time,
        notes: notes || undefined,
      })
      toast.success('Appointment booked! Awaiting doctor confirmation.')
      navigate('/patient/appointments')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-slide-up max-w-xl mx-auto">
      <div className="page-header flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="page-title">Book Appointment</h1>
          <p className="page-subtitle">Dr. {doc.user?.name} · {doc.specialty}</p>
        </div>
      </div>

      {/* Doctor mini-card */}
      <div className="card p-4 mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 font-display text-xl font-bold flex items-center justify-center flex-shrink-0">
          {doc.user?.name?.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-slate-800">Dr. {doc.user?.name}</p>
          <p className="text-sm text-slate-400 flex items-center gap-1">
            <MapPin size={12} /> {doc.city} · <span className="text-teal-600">${doc.price}/visit</span>
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          {/* Date selection */}
          <div className="card p-5">
            <h3 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-teal-500" /> Choose a date
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-slate-400 text-sm">No available dates in the next 14 days.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {upcoming.map(({ date, dayOfWeek }) => {
                  const isSelected = selected.date && format(selected.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelected({ date, time: null })}
                      className={`rounded-xl p-2.5 text-center border transition-all text-sm ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-slate-200 hover:border-teal-300 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold">{format(date, 'MMM d')}</div>
                      <div className={`text-xs mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>{dayOfWeek.slice(0,3)}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Time selection */}
          {selected.date && (
            <div className="card p-5 animate-slide-up">
              <h3 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-teal-500" /> Choose a time
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelected(s => ({ ...s, time: slot }))}
                    className={`rounded-xl py-2.5 text-sm font-mono font-medium border transition-all ${
                      selected.time === slot
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-200 hover:border-teal-300 text-slate-700'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {selected.time && (
            <div className="card p-5 animate-slide-up">
              <label className="label">Notes for doctor <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="input-field resize-none"
                rows={2}
                placeholder="Reason for visit, symptoms, questions…"
              />
            </div>
          )}

          <button
            disabled={!selected.date || !selected.time}
            onClick={() => setStep(2)}
            className="btn-primary w-full justify-center py-3"
          >
            Review Booking
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card p-6 animate-slide-up space-y-4">
          <div className="text-center mb-2">
            <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={26} />
            </div>
            <h3 className="font-display text-xl font-semibold text-slate-900">Review your booking</h3>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Doctor</span><span className="font-medium text-slate-800">Dr. {doc.user?.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Specialty</span><span className="font-medium text-slate-800">{doc.specialty}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium text-slate-800">{format(selected.date, 'EEEE, MMMM d, yyyy')}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Time</span><span className="font-medium text-teal-700 font-mono">{selected.time}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Consultation fee</span><span className="font-semibold text-slate-800">${doc.price}</span></div>
            {notes && <div className="flex justify-between"><span className="text-slate-500">Notes</span><span className="font-medium text-slate-800 text-right max-w-xs">{notes}</span></div>}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center py-3">Back</button>
            <button onClick={handleBook} disabled={submitting} className="btn-primary flex-1 justify-center py-3">
              {submitting ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}