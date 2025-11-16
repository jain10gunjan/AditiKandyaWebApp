export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Schedule</h1>
        <div className="bg-white rounded-2xl shadow p-6 text-slate-700 mt-6">
          <ul className="grid sm:grid-cols-2 gap-3">
            <li>Mon & Wed – 5:00 PM to 6:30 PM – Guitar 🎸</li>
            <li>Tue & Thu – 5:00 PM to 6:30 PM – Piano 🎹</li>
            <li>Sat – 10:00 AM to 12:00 PM – Vocals 🎤</li>
            <li>Sun – 11:00 AM to 1:00 PM – Drums 🥁</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


