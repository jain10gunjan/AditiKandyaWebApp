# Debug Student Schedule Issue

## Steps to Debug:

### 1. **Check Backend Logs**
When you visit the student calendar page, check the backend console for these logs:
- "Getting enrollments for user: [user-id]"
- "Found approved enrollments: [number]"
- "Getting schedules for user: [user-id]"
- "Found schedules: [number]"

### 2. **Check Frontend Console**
Open browser dev tools and check the console for:
- "Loading enrollments from: [url]"
- "Enrollments data: [array]"
- "Loading schedules from: [url]"
- "Schedules data: [array]"

### 3. **Check Database**
Make sure you have:
- **Enrollments** with `approved: true` for the student
- **Schedules** created for the enrolled courses
- **Schedules** with `status: 'scheduled'` and future `startTime`

### 4. **Test Steps**

#### Step 1: Create a Course
1. Go to `/admin`
2. Create a new course using the form

#### Step 2: Enroll a Student
1. Go to `/courses`
2. Click on the course and enroll
3. **IMPORTANT**: Go to `/admin` and approve the enrollment

#### Step 3: Create Schedules
1. Go to `/admin/calendar`
2. Select the course
3. Click "Add Schedule"
4. Create a schedule with future date/time
5. Add a meeting link

#### Step 4: Test Student View
1. Go to `/student/calendar` (or `/dashboard` and click Calendar)
2. Check console logs
3. You should see the schedule

### 5. **Common Issues**

#### Issue 1: Student Not Enrolled
- **Symptom**: "No Enrollments Found" message
- **Solution**: Enroll student and approve enrollment

#### Issue 2: No Schedules Created
- **Symptom**: "No Upcoming Classes" message
- **Solution**: Create schedules in admin panel

#### Issue 3: Schedules in Past
- **Symptom**: No schedules showing
- **Solution**: Create schedules with future dates

#### Issue 4: Authentication Issues
- **Symptom**: 401 errors in console
- **Solution**: Make sure student is signed in

### 6. **Quick Test Commands**

You can test the API endpoints directly:

```bash
# Test enrollments (replace with your user ID)
curl "http://localhost:4000/api/me/enrollments?userHint=your-user-id"

# Test schedules (replace with your token)
curl "http://localhost:4000/api/me/schedules" \
  -H "Authorization: Bearer your-token"
```

### 7. **Database Queries**

Check your MongoDB database:

```javascript
// Check enrollments
db.enrollments.find({approved: true})

// Check schedules
db.schedules.find({status: 'scheduled'})

// Check courses
db.courses.find({})
```

## Expected Flow:
1. Student enrolls in course → Enrollment created with `approved: false`
2. Admin approves enrollment → `approved: true`
3. Admin creates schedule → Schedule created for course
4. Student visits calendar → Sees schedule

The issue is likely that either:
- Student enrollment is not approved
- No schedules have been created
- Schedules are in the past

