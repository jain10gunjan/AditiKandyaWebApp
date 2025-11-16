# Test Setup Guide

## To test the student features, follow these steps:

### 1. **First, make sure you have some courses created**
- Go to `/admin` 
- Create some courses using the "Add Course" form

### 2. **Create some schedules for the courses**
- Go to `/admin/calendar`
- Select a course from the dropdown
- Click "Add Schedule" and create some class schedules
- Make sure to add meeting links (e.g., Google Meet, Zoom links)

### 3. **Upload some resources for the courses**
- Go to `/admin/resources`
- Select a course from the dropdown
- Click "Add Resource" and upload some videos or PDFs

### 4. **Enroll a student in courses**
- Go to `/courses`
- Click on a course and enroll (or use the enrollment form on the homepage)
- Make sure the enrollment is approved by an admin

### 5. **Mark some attendance**
- Go to `/admin/attendance`
- Select a course and date
- Mark attendance for enrolled students

### 6. **Test student features**
- Go to `/dashboard` (student dashboard)
- Click on "Calendar" to see upcoming classes
- Click on "Resources" to see course materials
- Click on "Attendance" to see attendance records

## Debugging Tips:

1. **Check browser console** for any error messages
2. **Check network tab** to see if API calls are being made
3. **Verify authentication** - make sure you're signed in
4. **Check database** - make sure data is being saved

## Common Issues:

1. **No data showing**: Student might not be enrolled in courses
2. **403 errors**: Student not enrolled in the specific course
3. **Empty schedules**: No schedules created for enrolled courses
4. **Empty resources**: No resources uploaded for enrolled courses

## API Endpoints to check:

- `GET /api/me/enrollments` - Check if student has enrollments
- `GET /api/me/schedules` - Check if schedules are returned
- `GET /api/me/resources/:courseId` - Check if resources are returned
- `GET /api/me/attendance/:courseId` - Check if attendance is returned

