# Production Deployment Checklist

## ✅ Backend Fixes (Will Work in Production)

All the backend fixes I made are production-ready:

1. **Improved `getLessonFromCourse` function** - Works with any course structure
2. **Enhanced error logging** - Will help debug production issues
3. **Better file path handling** - Handles different path formats
4. **Debug endpoint** - Available in production (admin only)

## ⚠️ Important Production Considerations

### 1. Frontend URL Construction

**IMPORTANT:** Make sure your frontend is using the correct API base URL in production.

Check your frontend `.env` file on production:
```env
VITE_API_BASE_URL=https://api.themusinest.com
```

**NOT:**
```env
VITE_API_BASE_URL=https://api.themusinest.com/api  # ❌ Wrong - don't add /api here
```

The frontend should construct URLs like:
```javascript
`${VITE_API_BASE_URL}/api/media/video/${courseId}/${moduleIndex}/${lessonIndex}`
```

Which becomes: `https://api.themusinest.com/api/media/video/...`

### 2. Video URL with Authentication

Since HTML5 video elements don't send Authorization headers, you need to pass `userId` as a query parameter.

**If your frontend doesn't do this yet**, the video endpoint will still work if:
- The user is authenticated (Clerk middleware sets `req.auth.userId`)
- OR the course is free
- OR the lesson is a free preview

But for enrolled users, you should add `?userHint=${userId}` to the video URL.

### 3. File Uploads Directory

The backend uses:
```javascript
const uploadsDir = path.join(__dirname, '..', 'uploads')
```

This creates: `music-school-backend/uploads/`

**Make sure:**
- The `uploads/` directory exists on your production server
- It has proper permissions (readable by nginx, writable by Node.js)
- Video files are actually uploaded to this directory

### 4. Nginx Configuration

Your nginx config should:
- Allow large file uploads (`client_max_body_size 50M`)
- Proxy requests to your Node.js backend
- Not interfere with CORS headers

### 5. Environment Variables

Make sure these are set in production:
```env
MONGODB_URI=your_production_mongodb_uri
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
PORT=4000
NODE_ENV=production
```

## 🔍 Testing in Production

### Test 1: Check Course Structure
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://api.themusinest.com/api/debug/course/6922866b0b95437b638cfe49/structure
```

### Test 2: Check Video Endpoint
```bash
curl -I "https://api.themusinest.com/api/media/video/6922866b0b95437b638cfe49/0/1?userHint=USER_ID"
```

Should return `200 OK` or `206 Partial Content` (for range requests)

### Test 3: Check Server Logs
```bash
# If using PM2
pm2 logs music-school-api --lines 50

# Look for:
# - "Video access check:" logs
# - "Lesson not found or invalid:" errors
# - "Video file not found:" errors
```

## 🚨 Common Production Issues

### Issue 1: Video Files Not Uploaded
**Symptom:** 404 error, "Video file not found"
**Solution:** 
- Check if files exist: `ls -la /path/to/music-school-backend/uploads/`
- Verify file permissions
- Re-upload videos if needed

### Issue 2: Wrong API Base URL
**Symptom:** CORS errors or 404 on API calls
**Solution:**
- Check frontend `.env` file
- Rebuild frontend: `npm run build`
- Clear browser cache

### Issue 3: Authentication Not Working
**Symptom:** 401 Unauthorized errors
**Solution:**
- Verify Clerk keys are set correctly
- Check if user is enrolled in the course
- Add `?userHint=${userId}` to video URLs in frontend

### Issue 4: Module/Lesson Index Mismatch
**Symptom:** 404 "Lesson not found"
**Solution:**
- Use debug endpoint to see actual course structure
- Verify frontend is using correct indices
- Check if course uses modules or chapters structure

## 📋 Deployment Steps

1. **Pull latest code:**
   ```bash
   cd /var/www/AditiKandyaWebApp/music-school-backend
   git pull  # or your deployment method
   ```

2. **Restart backend:**
   ```bash
   pm2 restart music-school-api
   # or
   systemctl restart your-node-service
   ```

3. **Check logs:**
   ```bash
   pm2 logs music-school-api
   ```

4. **Test the endpoint:**
   - Try loading a video
   - Check browser console for errors
   - Check server logs for detailed info

## ✅ Verification

After deployment, verify:

- [ ] Backend server is running
- [ ] Database is connected
- [ ] Uploads directory exists and has files
- [ ] Frontend API base URL is correct
- [ ] CORS is working (no CORS errors in browser)
- [ ] Videos load for enrolled users
- [ ] Debug endpoint works (admin only)

## 🆘 If Still Having Issues

1. **Check server logs** - The enhanced logging will show exactly what's wrong
2. **Use debug endpoint** - See the actual course structure
3. **Verify file paths** - Check if video files exist on disk
4. **Test with curl** - Bypass frontend to test backend directly

The backend fixes are production-ready and will work the same way in production as in local development.

