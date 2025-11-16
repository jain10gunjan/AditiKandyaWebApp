import logo from '../assets/logo.png'

export default function Footer({ showAdminTools = false }) {
  return (
    <footer className="border-t mt-20 bg-gradient-to-r from-slate-50 to-sky-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={logo} 
                alt="Themusinest Logo" 
                className="h-14 w-auto object-contain"
              />
              <span className="font-extrabold text-slate-800 text-lg">Themusinest.com</span>
            </div>
            <p className="text-slate-600 text-sm">Making music education accessible and fun for everyone.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="/courses" className="hover:text-sky-700 transition-colors">Courses</a></li>
              <li><a href="/teachers" className="hover:text-sky-700 transition-colors">Teachers</a></li>
              <li><a href="/schedule" className="hover:text-sky-700 transition-colors">Schedule</a></li>
              <li><a href="/dashboard" className="hover:text-sky-700 transition-colors">Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>📧 support@themusinest.com</li>
              <li>📞 +91-98765-43210</li>
              <li>📍 Mumbai, India</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Follow Us</h3>
            <div className="flex gap-3 mb-4">
              <a 
                href="https://www.instagram.com/the_musinest?igsh=MWp1b3BpazQ2NHFtZA==" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center cursor-pointer hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110"
                title="Follow us on Instagram"
              >
                <span className="text-white text-lg">📷</span>
              </a>
              <a 
                href="https://www.youtube.com/@themusinest" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center cursor-pointer hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110"
                title="Subscribe to our YouTube channel"
              >
                <span className="text-white text-lg">📺</span>
              </a>
            </div>
            {showAdminTools && (
              <>
                <h3 className="font-semibold text-slate-800 mb-4">Admin Tools</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="/admin" className="hover:text-sky-700 transition-colors">Dashboard</a></li>
                  <li><a href="/admin/teachers" className="hover:text-sky-700 transition-colors">Teachers</a></li>
                  <li><a href="/admin/attendance" className="hover:text-sky-700 transition-colors">Attendance</a></li>
                  <li><a href="/admin/calendar" className="hover:text-sky-700 transition-colors">Calendar</a></li>
                  <li><a href="/admin/resources" className="hover:text-sky-700 transition-colors">Resources</a></li>
                  <li><a href="/admin/enrollment-leads" className="hover:text-sky-700 transition-colors">New Enrollment Leads</a></li>
                </ul>
              </>
            )}
          </div>
        </div>
        <div className="border-t border-slate-200 mt-8 pt-6 text-center text-slate-600 text-sm">
          © {new Date().getFullYear()} Themusinest.com • Made with 🎶 and ❤️
        </div>
      </div>
    </footer>
  )
}

