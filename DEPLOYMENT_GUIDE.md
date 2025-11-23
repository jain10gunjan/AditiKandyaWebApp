# Production Deployment Guide

## Issues Fixed

### 1. CORS Error
The CORS configuration has been updated to properly handle requests from `https://themusinest.com`.

### 2. 413 Request Entity Too Large
This error occurs when nginx (reverse proxy) has a smaller `client_max_body_size` than your application needs.

## Nginx Configuration

### Step 1: Create Nginx Configuration File

1. SSH into your VPS
2. Create the configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/api.themusinest.com
   ```

3. Copy the contents from `nginx-api-config.conf` file

4. Update the SSL certificate paths if needed:
   ```nginx
   ssl_certificate /etc/letsencrypt/live/api.themusinest.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/api.themusinest.com/privkey.pem;
   ```

5. Update the proxy port if your Node.js app runs on a different port:
   ```nginx
   proxy_pass http://localhost:4000;  # Change 4000 to your app's port
   ```

### Step 2: Enable the Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/api.themusinest.com /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### Step 3: Verify SSL Certificate

If you don't have SSL certificates yet, install certbot:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.themusinest.com
```

## Environment Variables

Make sure your `.env` file on the server has:

```env
# CORS - Already configured in code, but you can override with:
# CLIENT_ORIGIN=https://themusinest.com

# Database
MONGODB_URI=your_mongodb_connection_string

# Clerk Auth
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Server
PORT=4000
NODE_ENV=production
```

## PM2 Process Manager (Recommended)

Install and configure PM2 to keep your Node.js app running:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start your app with PM2
cd /path/to/your/music-school-backend
pm2 start src/server.js --name "music-school-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Testing

After deployment, test the endpoints:

1. **Test CORS:**
   ```bash
   curl -H "Origin: https://themusinest.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://api.themusinest.com/api/health
   ```

2. **Test API:**
   ```bash
   curl https://api.themusinest.com/api/health
   ```

## Troubleshooting

### CORS Still Not Working

1. Check nginx logs:
   ```bash
   sudo tail -f /var/log/nginx/api.themusinest.com.error.log
   ```

2. Check Node.js logs:
   ```bash
   pm2 logs music-school-api
   ```

3. Verify the origin header is being sent correctly from the frontend

### 413 Error Still Occurring

1. Check nginx configuration:
   ```bash
   sudo nginx -t
   ```

2. Verify `client_max_body_size 50M;` is set in nginx config

3. Restart nginx:
   ```bash
   sudo systemctl restart nginx
   ```

4. Check if there are other nginx configs overriding this setting:
   ```bash
   grep -r "client_max_body_size" /etc/nginx/
   ```

### Frontend API Base URL

Make sure your frontend `.env` file has:

```env
VITE_API_BASE_URL=https://api.themusinest.com
```

## Additional Security Recommendations

1. **Rate Limiting:** Consider adding rate limiting to prevent abuse
2. **Firewall:** Ensure only necessary ports are open
3. **SSL/TLS:** Always use HTTPS in production
4. **Environment Variables:** Never commit `.env` files to git

