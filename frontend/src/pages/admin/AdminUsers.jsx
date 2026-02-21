import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { PageSpinner, StatusBadge, Empty, Pagination, ConfirmModal } from '../../components/common'
import toast from 'react-hot-toast'
import { Users, Search, UserCheck, UserX } from 'lucide-react'
import { format } from 'date-fns'

const ROLES = ['ALL','PATIENT','DOCTOR','ADMIN']

export default function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [pagination, setPag]  = useState({})
  const [loading, setLoading] = useState(true)
  const [role, setRole]       = useState('ALL')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [actionTarget, setActionTarget] = useState(null)

  const fetchUsers = (p = 1, r = role, s = search) => {
    setLoading(true)
    const params = { page: p, limit: 15, ...(r !== 'ALL' && { role: r }), ...(s && { search: s }) }
    adminAPI.getUsers(params)
      .then(res => { setUsers(res.data.data); setPag(res.data.pagination) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleRoleFilter = (r) => { setRole(r); setPage(1); fetchUsers(1, r) }
  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchUsers(1, role, search)
  }
  const handlePage = (p) => { setPage(p); fetchUsers(p) }

  const handleAction = async () => {
    try {
      if (actionTarget.action === 'suspend') {
        await adminAPI.suspendUser(actionTarget.id)
        toast.success('User suspended.')
      } else {
        await adminAPI.activateUser(actionTarget.id)
        toast.success('User reactivated.')
      }
      fetchUsers(page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionTarget(null)
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">{pagination.total || 0} registered users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-2 flex-wrap">
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => handleRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                role === r ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="input-field pl-8 py-2 text-sm"
            />
          </div>
          <button type="submit" className="btn-secondary text-sm py-2">Search</button>
        </form>
      </div>

      {loading ? <PageSpinner /> : users.length === 0 ? (
        <Empty icon={Users} title="No users found" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Joined</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                            {u.name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate">{u.name}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{u.role}</span>
                        {u.doctorProfile && (
                          <p className="text-xs text-slate-400 mt-0.5">{u.doctorProfile.specialty}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-slate-400 text-xs">
                        {format(new Date(u.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        {u.isActive
                          ? <span className="badge-active">Active</span>
                          : <span className="badge-inactive">Suspended</span>
                        }
                        {u.doctorProfile && (
                          <div className="mt-1">
                            <StatusBadge status={u.doctorProfile.subscriptionStatus} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role !== 'ADMIN' && (
                          u.isActive ? (
                            <button
                              onClick={() => setActionTarget({ id: u.id, name: u.name, action: 'suspend' })}
                              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"
                            >
                              <UserX size={13} /> Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => setActionTarget({ id: u.id, name: u.name, action: 'activate' })}
                              className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 ml-auto"
                            >
                              <UserCheck size={13} /> Activate
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={pagination.pages} onPage={handlePage} />
        </>
      )}

      <ConfirmModal
        open={!!actionTarget}
        title={actionTarget?.action === 'suspend' ? `Suspend ${actionTarget?.name}?` : `Reactivate ${actionTarget?.name}?`}
        message={actionTarget?.action === 'suspend'
          ? 'This user will not be able to log in until reactivated.'
          : 'This user will regain access to the platform.'
        }
        confirmLabel={actionTarget?.action === 'suspend' ? 'Suspend' : 'Activate'}
        danger={actionTarget?.action === 'suspend'}
        onConfirm={handleAction}
        onClose={() => setActionTarget(null)}
      />
    </div>
  )
}