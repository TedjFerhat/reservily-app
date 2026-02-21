import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { doctorAPI } from '../../services/api'
import { PageSpinner, Empty, Pagination } from '../../components/common'
import { Search, MapPin, Star, DollarSign, Stethoscope, Clock } from 'lucide-react'

const SPECIALTIES = [
  'All', 'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'General Practice', 'Gynecology', 'Neurology', 'Oncology',
  'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Psychiatry',
]

export default function SearchDoctors() {
  const [doctors, setDoctors]   = useState([])
  const [pagination, setPag]    = useState({})
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [filters, setFilters]   = useState({ specialty: '', city: '' })
  const [search, setSearch]     = useState({ specialty: '', city: '' })

  const fetchDoctors = (p = 1, f = search) => {
    setLoading(true)
    const params = { page: p, limit: 9, ...Object.fromEntries(Object.entries(f).filter(([,v]) => v)) }
    doctorAPI.search(params)
      .then(r => { setDoctors(r.data.data); setPag(r.data.pagination) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDoctors() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(filters)
    fetchDoctors(1, filters)
  }

  const handlePage = (p) => {
    setPage(p)
    fetchDoctors(p)
  }

  const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Find a Doctor</h1>
        <p className="page-subtitle">Search verified specialists near you</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Stethoscope size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filters.specialty}
            onChange={e => setFilters(f => ({ ...f, specialty: e.target.value === 'All' ? '' : e.target.value }))}
            className="input-field pl-9"
          >
            {SPECIALTIES.map(s => <option key={s} value={s === 'All' ? '' : s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.city}
            onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
            placeholder="City (e.g. New York)"
            className="input-field pl-9"
          />
        </div>
        <button type="submit" className="btn-primary px-6">
          <Search size={15} /> Search
        </button>
      </form>

      {loading ? <PageSpinner /> : doctors.length === 0 ? (
        <Empty icon={Search} title="No doctors found" message="Try adjusting your filters or search a different city." />
      ) : (
        <>
          <p className="text-sm text-slate-400 mb-4">{pagination.total} doctor{pagination.total !== 1 ? 's' : ''} found</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map(doc => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
          <Pagination page={page} pages={pagination.pages} onPage={handlePage} />
        </>
      )}
    </div>
  )
}

function DoctorCard({ doctor }) {
  const available = doctor.availability?.length > 0
  return (
    <Link to={`/doctors/${doctor.id}`} className="card p-5 hover:shadow-card-hover transition-all duration-200 group flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 font-display font-bold text-lg">
          {doctor.user?.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">Dr. {doctor.user?.name}</p>
          <p className="text-sm text-teal-600 font-medium">{doctor.specialty}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {doctor.city}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm border-t border-slate-50 pt-3">
        <div className="flex items-center gap-1 text-slate-600">
          <DollarSign size={14} className="text-slate-400" />
          <span className="font-semibold">${doctor.price}</span>
          <span className="text-slate-400">/ visit</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock size={13} />
          <span>{doctor.experience}y exp.</span>
        </div>
      </div>

      {!available && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 text-center">
          No availability set yet
        </p>
      )}
    </Link>
  )
}