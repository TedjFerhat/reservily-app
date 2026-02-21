import { Link } from 'react-router-dom'
import { Stethoscope, Calendar, Shield, Star, ArrowRight, CheckCircle, Users, Clock } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Nav */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <Stethoscope size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-slate-900">Reservily</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse-soft" />
              Trusted by 1,200+ patients
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 leading-tight text-balance mb-5">
              Book medical appointments
              <span className="text-teal-600"> with ease</span>
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed mb-8 text-balance">
              Connect with verified specialist doctors. Search by specialty, city, or availability — and book in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register?role=patient" className="btn-primary text-base px-6 py-3">
                Book as Patient
                <ArrowRight size={16} />
              </Link>
              <Link to="/register?role=doctor" className="btn-secondary text-base px-6 py-3">
                Join as Doctor
              </Link>
            </div>
          </div>

          {/* Decorative card */}
          <div className="hidden lg:block animate-fade-in animate-delay-200">
            <div className="relative">
              <div className="card p-6 shadow-card-hover">
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center">
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Dr. Sarah Johnson</p>
                    <p className="text-sm text-slate-400">Cardiology · New York</p>
                  </div>
                  <div className="ml-auto badge-active">Active</div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                    <div
                      key={day}
                      className={`rounded-xl py-2 text-center text-sm font-medium ${
                        i === 1 ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Available 9:00 – 17:00</span>
                  <span className="font-semibold text-teal-600">$150/visit</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 card px-4 py-3 flex items-center gap-2 shadow-card">
                <CheckCircle size={16} className="text-teal-500" />
                <span className="text-sm font-medium text-slate-700">Appointment confirmed!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-teal-600 py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: '500+', label: 'Active Doctors' },
            { value: '12K+', label: 'Appointments Booked' },
            { value: '98%',  label: 'Patient Satisfaction' },
            { value: '24h',  label: 'Booking Window' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-display text-3xl font-bold">{value}</p>
              <p className="text-teal-100 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-slate-900 mb-3">How it works</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Three steps to get the care you need</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: 'Find a Doctor', desc: 'Search by specialty, location, or availability. Read profiles and compare prices.' },
            { icon: Calendar, title: 'Book an Appointment', desc: 'Pick a date and time that works for you. Your booking is instantly confirmed.' },
            { icon: Shield, title: 'Attend & Get Care', desc: 'Show up at the clinic. Manage your appointments and history from your dashboard.' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
                <Icon size={24} />
              </div>
              <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For doctors CTA */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Are you a doctor?</h2>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            Join Reservily with a simple monthly subscription. Manage your schedule, grow your patient base, and reduce no-shows.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register?role=doctor" className="btn-primary text-base px-8 py-3">
              Start your practice <ArrowRight size={16} />
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-4">Simple bank transfer · No hidden fees · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded-md flex items-center justify-center">
              <Stethoscope size={12} className="text-white" />
            </div>
            <span className="font-display font-semibold text-slate-600">Reservily</span>
          </div>
          <p>© {new Date().getFullYear()} Reservily. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}