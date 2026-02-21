import { useState, useEffect } from 'react'
import { doctorAPI } from '../../services/api'
import { PageSpinner } from '../../components/common'
import toast from 'react-hot-toast'
import { CreditCard, CheckCircle, Clock, Building, Copy } from 'lucide-react'
import { format } from 'date-fns'

export default function DoctorSubscription() {
  const [info, setInfo]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({ referenceNumber: '', amount: '', proofImageUrl: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  useEffect(() => {
    doctorAPI.getSubscriptionInfo()
      .then(r => {
        setInfo(r.data.data)
        if (r.data.data.monthlyPrice) setForm(f => ({ ...f, amount: String(r.data.data.monthlyPrice) }))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await doctorAPI.submitPaymentProof({
        referenceNumber: form.referenceNumber,
        amount: parseFloat(form.amount),
        proofImageUrl: form.proofImageUrl,
        notes: form.notes || undefined,
      })
      toast.success('Payment proof submitted! Awaiting admin verification.')
      setSubmitted(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  if (loading) return <PageSpinner />

  const isActive  = info?.subscriptionStatus === 'ACTIVE'
  const isPending = info?.subscriptionStatus === 'PENDING'
  const bank      = info?.paymentInstructions

  return (
    <div className="animate-slide-up max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Subscription</h1>
        <p className="page-subtitle">Activate your account to go live and accept patients.</p>
      </div>

      {/* Status card */}
      <div className={`rounded-2xl p-5 mb-6 flex items-center gap-4 border ${
        isActive  ? 'bg-teal-50 border-teal-200' :
        isPending ? 'bg-amber-50 border-amber-200' :
                    'bg-slate-50 border-slate-200'
      }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isActive  ? 'bg-teal-100 text-teal-600' :
          isPending ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-400'
        }`}>
          {isActive ? <CheckCircle size={22} /> : <Clock size={22} />}
        </div>
        <div>
          <p className="font-semibold text-slate-800">
            {isActive  ? 'Subscription Active' :
             isPending ? 'Payment Under Review' :
                         'Subscription Inactive'}
          </p>
          <p className="text-sm text-slate-500">
            {isActive  ? `Expires ${format(new Date(info.subscriptionExpiresAt), 'MMMM d, yyyy')}` :
             isPending ? 'An admin will verify your payment within 24 hours.' :
                         'Complete payment below to activate your account.'}
          </p>
        </div>
        <div className="ml-auto">
          <span className={`text-lg font-bold font-display ${isActive ? 'text-teal-600' : isPending ? 'text-amber-600' : 'text-slate-400'}`}>
            ${info?.monthlyPrice}/mo
          </span>
        </div>
      </div>

      {!isActive && !isPending && !submitted && (
        <>
          {/* Bank details */}
          <div className="card p-6 mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <Building size={16} className="text-teal-500" /> Bank Transfer Details
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Bank Name', value: bank?.bankName },
                { label: 'Account Holder', value: bank?.accountHolder },
                { label: 'Account Number', value: bank?.accountNumber },
                { label: 'Routing Number', value: bank?.routingNumber },
                { label: 'Amount', value: `$${info?.monthlyPrice}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50">
                  <span className="text-sm text-slate-500">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 font-mono text-sm">{value}</span>
                    {value && (
                      <button onClick={() => copy(value)} className="text-slate-300 hover:text-teal-500 transition-colors">
                        <Copy size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-teal-50 rounded-xl p-4">
              <p className="text-teal-700 text-sm font-medium mb-1">Instructions</p>
              <ol className="text-sm text-teal-600 space-y-1 list-decimal list-inside">
                {bank?.steps?.map((step, i) => <li key={i}>{step.replace(/^\d+\.\s/, '')}</li>)}
              </ol>
            </div>
          </div>

          {/* Submit proof */}
          <div className="card p-6">
            <h2 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-teal-500" /> Submit Payment Proof
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Bank transfer reference number</label>
                <input value={form.referenceNumber} onChange={e => setForm(f => ({...f, referenceNumber: e.target.value}))} className="input-field font-mono" placeholder="e.g. TXN2024012345" required />
              </div>
              <div>
                <label className="label">Amount transferred ($)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="input-field" step="0.01" required />
              </div>
              <div>
                <label className="label">Payment proof image URL</label>
                <input type="url" value={form.proofImageUrl} onChange={e => setForm(f => ({...f, proofImageUrl: e.target.value}))} className="input-field" placeholder="https://... (upload screenshot to imgur or similar)" required />
                <p className="text-xs text-slate-400 mt-1">Upload your bank transfer screenshot to a hosting service and paste the URL here.</p>
              </div>
              <div>
                <label className="label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="input-field resize-none" rows={2} placeholder="Any additional info for the admin…" />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3">
                {submitting ? 'Submitting…' : 'Submit Payment Proof'}
              </button>
            </form>
          </div>
        </>
      )}

      {submitted && !isActive && (
        <div className="card p-8 text-center">
          <CheckCircle size={40} className="text-teal-500 mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold text-slate-900 mb-2">Payment proof submitted!</h3>
          <p className="text-slate-500 text-sm">An admin will review your proof within 24 hours and activate your account.</p>
        </div>
      )}
    </div>
  )
}