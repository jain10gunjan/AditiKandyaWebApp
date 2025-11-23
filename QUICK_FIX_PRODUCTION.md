# Quick Fix for Production Issues

## Problem 1: CORS Error
**Error:** `Access to fetch at 'https://api.themusinest.com/...' has been blocked by CORS policy`

## Problem 2: 413 Request Entity Too Large
**Error:** `POST ... net::ERR_FAILED 413 (Request Entity Too Large)`

---

## Quick Fix Steps

### 1. Update Backend Code (Already Done ✅)
The backend code has been updated with:
- Enhanced CORS configuration
- Support for `https://themusinest.com` and `https://www.themusinest.com`
- Proper CORS headers

**Action:** Pull the latest code and restart your Node.js app.

### 2. Configure Nginx (CRITICAL - Do This Now!)

SSH into your VPS and run these commands:

```bash
# 1. Edit your nginx configuration for api.themusinest.com
sudo nano /etc/nginx/sites-available/api.themusinest.com
```

**Add or update these settings in the `server` block:**

```nginx
# Increase client body size limit to 50MB
client_max_body_size 50M;
client_body_buffer_size 50M;

# Increase timeouts for large uploads
client_body_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;

# In the location / block, add:
proxy_request_buffering off;
proxy_buffering off;
```

**Your location block should look like:**

```nginx
location / {
    proxy_pass http://localhost:4000;  # Your Node.js port
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Important: Don't buffer large requests
    proxy_request_buffering off;
    proxy_buffering off;
}
```

### 3. Test and Reload Nginx

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# If reload fails, restart nginx
sudo systemctl restart nginx
```

### 4. Restart Your Node.js App

If using PM2:
```bash
pm2 restart music-school-api
# or
pm2 restart all
```

If using systemd or other:
```bash
# Find your process
ps aux | grep node

# Restart it (adjust command based on your setup)
```

### 5. Verify It's Working

Test from your browser console on `https://themusinest.com`:

```javascript
fetch('https://api.themusinest.com/api/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err))
```

---

## Common Issues

### Issue: Nginx config file doesn't exist
**Solution:** Create it:
```bash
sudo nano /etc/nginx/sites-available/api.themusinest.com
# Paste the config from nginx-api-config.conf
sudo ln -s /etc/nginx/sites-available/api.themusinest.com /etc/nginx/sites-enabled/
```

### Issue: Still getting 413 error
**Solution:** Check if there's a global nginx config overriding:
```bash
# Check main nginx config
sudo nano /etc/nginx/nginx.conf

# Look for client_max_body_size and make sure it's at least 50M
# It should be in the http block
```

### Issue: CORS still not working
**Solution:** 
1. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
2. Check if origin header is being passed: Add this to nginx location block:
   ```nginx
   proxy_set_header Origin $http_origin;
   ```
3. Verify backend is receiving the origin: Check Node.js logs

### Issue: Can't find nginx config file
**Solution:** List all nginx configs:
```bash
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/
```

---

## Verification Checklist

- [ ] Nginx `client_max_body_size` is set to `50M` or higher
- [ ] Nginx config is tested with `sudo nginx -t`
- [ ] Nginx has been reloaded/restarted
- [ ] Node.js app has been restarted with latest code
- [ ] Backend code includes the updated CORS configuration
- [ ] Frontend `.env` has `VITE_API_BASE_URL=https://api.themusinest.com`

---

## Need Help?

Check the logs:
```bash
# Nginx logs
sudo tail -f /var/log/nginx/api.themusinest.com.error.log
sudo tail -f /var/log/nginx/api.themusinest.com.access.log

# Node.js logs (if using PM2)
pm2 logs music-school-api

# Or check your Node.js app logs directly
```

