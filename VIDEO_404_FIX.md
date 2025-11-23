# Video 404 Error Fix

## Problem
Getting `404` error when trying to load videos:
```
GET /api/media/video/6922866b0b95437b638cfe49/0/1 404
```

## Fixes Applied

### 1. Improved `getLessonFromCourse` Function
- Now tries **modules structure first** (most common)
- Then falls back to chapters structure
- Better handling of empty arrays

### 2. Enhanced Error Logging
- Detailed logging when lesson is not found
- Shows course structure (modules vs chapters)
- Shows available lessons count

### 3. Better File Path Handling
- Handles `/uploads/filename`, `uploads/filename`, and `filename` formats
- Lists available files when video not found

### 4. Debug Endpoint Added
- `/api/debug/course/:courseId/structure` - View complete course structure
- Requires admin access

## How to Debug

### Step 1: Check Server Logs
When you try to load the video, check your server console. You should see detailed logs like:
```
Lesson not found or invalid: {
  courseId: '6922866b0b95437b638cfe49',
  mIdx: '0',
  lIdx: '1',
  courseHasModules: 2,
  courseHasChapters: 0,
  moduleExists: true,
  lessonExists: 1,
  ...
}
```

### Step 2: Check Course Structure
Use the debug endpoint (as admin):
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/debug/course/6922866b0b95437b638cfe49/structure
```

Or in browser (if logged in as admin):
```
http://localhost:4000/api/debug/course/6922866b0b95437b638cfe49/structure
```

This will show you:
- How many modules/chapters exist
- How many lessons in each module
- The exact structure of your course

### Step 3: Verify Lesson Index
The error shows you're trying to access:
- Module index: `0`
- Lesson index: `1`

Make sure:
- Module 0 exists
- Lesson 1 exists in module 0 (lessons are 0-indexed, so lesson 1 is the second lesson)

### Step 4: Check Video File
If lesson is found but video file is missing, you'll see:
```
Video file not found: {
  videoPath: '/uploads/filename.mp4',
  fsPath: '/path/to/uploads/filename.mp4',
  availableFiles: [...]
}
```

## Common Issues

### Issue 1: Lesson Index Out of Bounds
**Symptom:** Lesson not found error
**Solution:** Check if lesson index exists. If module has 2 lessons, valid indices are 0 and 1.

### Issue 2: Course Uses Chapters Instead of Modules
**Symptom:** Lesson not found even though it exists
**Solution:** The function now tries both structures automatically, but you can also pass `?cIdx=0` query parameter to specify chapter index.

### Issue 3: Video File Not Uploaded
**Symptom:** Lesson found but video file missing
**Solution:** 
1. Check if file exists in `uploads/` directory
2. Verify `videoPath` in database matches actual filename
3. Re-upload the video if needed

### Issue 4: Wrong Course Structure
**Symptom:** Confusing errors
**Solution:** Use the debug endpoint to see actual structure

## Testing

After restarting your server:

1. **Test the debug endpoint:**
   ```bash
   curl http://localhost:4000/api/debug/course/6922866b0b95437b638cfe49/structure
   ```

2. **Check server logs** when accessing video:
   ```bash
   # If using PM2
   pm2 logs music-school-api
   
   # Or check console output
   ```

3. **Try accessing the video** and check what error you get now (should be more detailed)

## Next Steps

1. Restart your backend server
2. Try loading the video again
3. Check the server logs for detailed error information
4. Use the debug endpoint to verify course structure
5. Share the error logs if issue persists

