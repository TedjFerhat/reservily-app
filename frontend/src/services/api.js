import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)          => api.post('/auth/register', data),
  login: (data)             => api.post('/auth/login', data),
  getMe: ()                 => api.get('/auth/me'),
  changePassword: (data)    => api.put('/auth/change-password', data),
}

// ── Doctors ───────────────────────────────────────────────────────────────────
export const doctorAPI = {
  search: (params)              => api.get('/doctors', { params }),
  getById: (id)                 => api.get(`/doctors/${id}`),
  updateProfile: (data)         => api.put('/doctors/profile', data),
  getSubscriptionInfo: ()       => api.get('/doctors/me/subscription'),
  submitPaymentProof: (data)    => api.post('/doctors/payment-proof', data),
  getAvailability: ()           => api.get('/doctors/me/availability'),
  setAvailability: (data)       => api.post('/doctors/availability', data),
  deleteAvailability: (day)     => api.delete(`/doctors/availability/${day}`),
  getAppointments: (params)     => api.get('/doctors/me/appointments', { params }),
}

// ── Patients ──────────────────────────────────────────────────────────────────
export const patientAPI = {
  getProfile: ()            => api.get('/patients/profile'),
  updateProfile: (data)     => api.put('/patients/profile', data),
  getAppointments: (params) => api.get('/patients/appointments', { params }),
}

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointmentAPI = {
  book: (data)        => api.post('/appointments', data),
  getById: (id)       => api.get(`/appointments/${id}`),
  cancel: (id)        => api.patch(`/appointments/${id}/cancel`),
  approve: (id)       => api.patch(`/appointments/${id}/approve`),
  reject: (id)        => api.patch(`/appointments/${id}/reject`),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: ()                    => api.get('/admin/stats'),
  getUsers: (params)              => api.get('/admin/users', { params }),
  getUserById: (id)               => api.get(`/admin/users/${id}`),
  suspendUser: (id)               => api.patch(`/admin/users/${id}/suspend`),
  activateUser: (id)              => api.patch(`/admin/users/${id}/activate`),
  getPaymentSubmissions: (params) => api.get('/admin/payment-submissions', { params }),
  verifyPayment: (id, data)       => api.post(`/admin/payment-submissions/${id}/verify`, data),
  rejectPayment: (id)             => api.post(`/admin/payment-submissions/${id}/reject`),
  getAppointments: (params)       => api.get('/admin/appointments', { params }),
}

export default api