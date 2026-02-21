import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { PageSpinner, Empty, Pagination } from '../../components/common'
import toast from 'react-hot-toast'
import { ShieldCheck, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminPayments() {
  const [submissions, setSubmissions] = useState([])
  const [pagination, setPag]   = useState({})
  const [loading, setLoading]  = useState(true)
  const [filter, setFilter]    = useState('pending') // pending | verified
  const [page, setPage]        = useState(1)
  const [months, setMonths]    = useState({}) // id -> durationMonths

  const fetchSubmissions = (p = 1, f = filter) => {
    setLoading(true)
    const params = { page: p, limit: 10, verified: f === 'verified' ? 'true' : 'false' }
    adminAPI.getPaymentSubmissions(params)
      .then(r => { setSubmissions(r.data.data); setPag(r.data.pagination) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSubmissions() }, [])

  const handleFilter = (f) => { setFilter(f); setPage(1); fetchSubmissions(1, f) }
  const handlePage   = (p) => { setPage(p); fetchSubmissions(p) }

  const handleVerify = async (id) => {
    try {
      const duration = months[id] || 1
      await adminAPI.verifyPayment(id, { durationMonths: duration })
      toast.success(`Subscription activated for ${duration} month(s)!`)
      fetchSubmissions(page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    }
  }

  const handleReject = async (id) => {
    if (!confirm('Reject this payment? The doctor will need to resubmit.')) return
    try {
      await adminAPI.rejectPayment(id)
      toast.success('Payment rejected.')
      fetchSubmissions(page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed')
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Payment Submissions</h1>
        <p className="page-subtitle">Review doctor subscription payment proofs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {['pending','verified'].map(f => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium border capitalize transition-all ${
              filter === f ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : submissions.length === 0 ? (
        <Empty icon={ShieldCheck} title="No submissions" message={filter === 'pending' ? 'No payments awaiting review.' : 'No verified payments yet.'} />
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => (
            <div key={sub.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-semibold text-slate-800 font-mono text-sm">{sub.referenceNumber}</span>
                    {sub.isVerified
                      ? <span className="badge-active flex items-center gap-1"><CheckCircle size={11} /> Verified</span>
                      : <span className="badge-pending">Pending</span>
                    }
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                    <div><p className="text-xs text-slate-400">Amount</p><p className="font-semibold text-slate-800">${sub.amount}</p></div>
                    <div><p className="text-xs text-slate-400">Doctor ID</p><p className="text-slate-600 truncate text-xs font-mono">{sub.doctorId.slice(0, 8)}…</p></div>
                    <div><p className="text-xs text-slate-400">Submitted</p><p className="text-slate-600">{format(new Date(sub.createdAt), 'MMM d, yyyy')}</p></div>
                    {sub.isVerified && sub.verifiedAt && (
                      <div><p className="text-xs text-slate-400">Verified</p><p className="text-slate-600">{format(new Date(sub.verifiedAt), 'MMM d, yyyy')}</p></div>
                    )}
                  </div>
                  {sub.notes && <p className="text-xs text-slate-400 italic mb-3">"{sub.notes}"</p>}
                  <a
                    href={sub.proofImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-teal-600 text-sm hover:underline"
                  >
                    <ExternalLink size={13} /> View proof image
                  </a>
                </div>

                {!sub.isVerified && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500">Months:</label>
                      <select
                        value={months[sub.id] || 1}
                        onChange={e => setMonths(m => ({ ...m, [sub.id]: parseInt(e.target.value) }))}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        {[1,2,3,6,12].map(n => <option key={n} value={n}>{n} mo</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => handleVerify(sub.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-teal-600 border border-teal-200 px-3 py-2 rounded-xl hover:bg-teal-50 transition-all"
                    >
                      <CheckCircle size={14} /> Verify & Activate
                    </button>
                    <button
                      onClick={() => handleReject(sub.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-red-500 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50 transition-all"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <Pagination page={page} pages={pagination.pages} onPage={handlePage} />
        </div>
      )}
    </div>
  )
}