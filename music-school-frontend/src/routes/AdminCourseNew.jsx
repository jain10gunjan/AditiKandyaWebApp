import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import { useState } from 'react'

export default function AdminCourseNew() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const form = new FormData(e.currentTarget)
      const payload = {
        title: form.get('title'),
        description: form.get('description'),
        price: Number(form.get('price') || 0),
        image: form.get('image') || '',
        level: form.get('level') || '',
      }
      const token = await getToken()
      const created = await apiPost('/courses', payload, token)
      navigate(`/admin/courses/${created._id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Create Course</h1>
          <a href="/admin" className="text-sky-700">Back to Admin</a>
        </div>
        <SignedOut>
          <div className="mt-6">
            <SignInButton>
              <button className="px-5 py-3 rounded-full bg-slate-900 text-white">Sign in</button>
            </SignInButton>
          </div>
        </SignedOut>
        <SignedIn>
          <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-6 mt-6">
            <input name="title" placeholder="Title" className="mt-3 w-full border p-2 rounded" required />
            <textarea name="description" placeholder="Description" className="mt-3 w-full border p-2 rounded" required />
            <input name="price" placeholder="Price" type="number" className="mt-3 w-full border p-2 rounded" />
            <input name="image" placeholder="Image URL (optional)" className="mt-3 w-full border p-2 rounded" />
            <input name="level" placeholder="Level" className="mt-3 w-full border p-2 rounded" />
            <button disabled={saving} className="mt-4 px-4 py-2 rounded bg-sky-600 text-white">{saving ? 'Saving...' : 'Create'}</button>
          </form>
        </SignedIn>
      </div>
    </div>
  )
}


