import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api'

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  useEffect(() => { apiGet('/teachers').then(setTeachers).catch(() => setTeachers([])) }, [])
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Teachers</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {teachers.map((t) => (
            <div key={t._id} className="bg-white rounded-2xl shadow p-4 border border-slate-100 text-center">
              <img src={t.avatar} alt={t.name} className="h-20 w-20 rounded-full object-cover mx-auto" />
              <h3 className="mt-3 font-bold text-slate-800">{t.name}</h3>
              <p className="text-sm text-slate-600">{t.instrument}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



