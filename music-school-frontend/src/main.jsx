import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import CoursesPage from './routes/CoursesPage.jsx'
import CourseDetailPage from './routes/CourseDetailPage.jsx'
import SchedulePage from './routes/SchedulePage.jsx'
import CheckoutPage from './routes/CheckoutPage.jsx'
import AdminPage from './routes/AdminPage.jsx'
import AdminCourseBuilder from './routes/AdminCourseBuilder.jsx'
import AdminCourseBuilderUnified from './routes/AdminCourseBuilderUnified.jsx'
import StudentDashboard from './routes/StudentDashboard.jsx'
import AdminCourseNew from './routes/AdminCourseNew.jsx'
import TeachersPage from './routes/TeachersPage.jsx'
import StudentAttendance from './routes/StudentAttendance.jsx'
import StudentCalendar from './routes/StudentCalendar.jsx'
import StudentResources from './routes/StudentResources.jsx'
import AdminAttendance from './routes/AdminAttendance.jsx'
import AdminCalendar from './routes/AdminCalendar.jsx'
import AdminResources from './routes/AdminResources.jsx'
import AdminEnrollmentLeads from './routes/AdminEnrollmentLeads.jsx'
import AdminTeachersPage from './routes/AdminTeachersPage.jsx'
import { Toaster } from 'react-hot-toast'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Prevent hash scroll on page load - run before React renders
if (window.location.hash) {
  const url = window.location.href.split('#')[0]
  window.history.replaceState(null, '', url)
}
window.scrollTo(0, 0)
document.documentElement.scrollTop = 0
document.body.scrollTop = 0

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/courses', element: <CoursesPage /> },
  { path: '/courses/:id', element: <CourseDetailPage /> },
  { path: '/teachers', element: <TeachersPage /> },
  { path: '/schedule', element: <SchedulePage /> },
  { path: '/checkout', element: <CheckoutPage /> },
  { path: '/admin', element: <AdminPage /> },
  { path: '/admin/courses/:id', element: <AdminCourseBuilderUnified /> },
  { path: '/admin/courses/new', element: <AdminCourseNew /> },
  { path: '/admin/attendance', element: <AdminAttendance /> },
  { path: '/admin/calendar', element: <AdminCalendar /> },
  { path: '/admin/resources', element: <AdminResources /> },
  { path: '/admin/enrollment-leads', element: <AdminEnrollmentLeads /> },
  { path: '/admin/teachers', element: <AdminTeachersPage /> },
  { path: '/dashboard', element: <StudentDashboard /> },
  { path: '/dashboard/course/:id', element: <StudentDashboard /> },
  { path: '/student/attendance', element: <StudentAttendance /> },
  { path: '/student/calendar', element: <StudentCalendar /> },
  { path: '/student/resources', element: <StudentResources /> },
  { path: '/student/schedule', element: <StudentCalendar /> }, // Same as calendar for now
])

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<ClerkProvider publishableKey={clerkPubKey}>
			<RouterProvider router={router} />
			<Toaster position="top-center" />
		</ClerkProvider>
	</StrictMode>,
)
