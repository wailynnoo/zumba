# 🌐 Domain Hosting Configuration Guide

## 📋 Overview

This document outlines all domain and hosting configurations needed when purchasing your domain from Namecheap. Use this as a checklist during domain registration and setup.

---

## 🎯 Domain Structure

Based on your project documentation, here's the recommended domain structure:

### **Primary Domain**
- **Main Domain:** `zfitdance.com` (or `zfitdanceplus.com` based on your preference)
- **Alternative:** `z-fitdanceplus.com` (mentioned in some docs)

### **Subdomain Structure**

```
https://zfitdance.com              # Public website (future)
https://admin.zfitdance.com        # Admin panel (future)
https://api.zfitdance.com          # Backend API (Member API)
https://admin-api.zfitdance.com    # Admin API (optional, or use api.zfitdance.com/admin)
```

**Current Status:**
- ✅ Backend APIs are deployed on Railway
- ✅ Member API: `member-api-production.up.railway.app`
- ✅ Admin API: `admin-api-production-5059.up.railway.app` (or similar)
- ⏳ Custom domains not yet configured

---

## 🔧 Namecheap Configuration Checklist

### **Step 1: Domain Registration Settings**

When purchasing your domain on Namecheap, configure these settings:

#### **Nameserver Settings** (During Checkout)

**Option 1: Use Namecheap BasicDNS (Recommended for Start)**
- ✅ Select "Use Namecheap BasicDNS"
- This allows you to configure DNS records later
- You can switch to custom DNS later if needed

**Option 2: Use Custom DNS (If you have hosting ready)**
- ⚠️ Only select if you have specific nameservers from your hosting provider
- Railway doesn't require custom nameservers - use Namecheap BasicDNS

#### **Additional Settings**
- ✅ **URL Forwarding:** Optional (can enable later if needed)
- ✅ **Email Forwarding:** Optional (can enable later if needed)
- ✅ **Save configuration to default checkout settings:** Recommended

---

## 📝 DNS Records to Configure (After Domain Purchase)

Once your domain is registered, you'll need to add these DNS records in Namecheap:

### **For API Subdomain (api.zfitdance.com)**

**Type:** CNAME  
**Host:** `api`  
**Value:** Railway will provide this (e.g., `your-app.up.railway.app`)  
**TTL:** Automatic (or 3600)

**How to get the value:**
1. Go to Railway Dashboard → Your API service → Settings
2. Click "Custom Domain"
3. Enter `api.zfitdance.com`
4. Railway will provide the CNAME target

### **For Admin Subdomain (admin.zfitdance.com)** - Optional

**Type:** CNAME  
**Host:** `admin`  
**Value:** Your frontend hosting provider's domain  
**TTL:** Automatic (or 3600)

**Note:** This is for the admin web panel (Next.js frontend), not the API.

### **For Root Domain (zfitdance.com)** - Future

**Type:** A Record or CNAME  
**Host:** `@` (or leave blank)  
**Value:** Your hosting provider's IP or domain  
**TTL:** Automatic (or 3600)

**Note:** This is for the public website (not yet implemented).

---

## 🔐 SSL Certificate Configuration

### **Automatic SSL (Recommended)**

✅ **Railway automatically provisions SSL certificates** for custom domains
- No additional setup needed
- SSL is automatically renewed
- Works with Let's Encrypt

✅ **Namecheap BasicDNS supports SSL**
- Works with Let's Encrypt certificates
- No additional configuration needed

### **Manual SSL (Not Recommended)**

⚠️ Only if you need a specific SSL certificate type
- Usually not necessary for this project
- Railway handles SSL automatically

---

## 🌍 Current API Configuration

### **Member API (Mobile App Backend)**

**Current URL:**
```
https://member-api-production.up.railway.app/api
```

**Target Custom Domain:**
```
https://api.zfitdance.com/api
```

**Configuration File:**
- Location: `fitness-dance-backend/ZFitDancePlus/src/config/api.ts`
- Current: Uses Railway domain
- **Action Required:** Update after custom domain is configured

### **Admin API (Admin Panel Backend)**

**Current URL:**
```
https://admin-api-production-5059.up.railway.app
```

**Target Custom Domain:**
```
https://api.zfitdance.com
```
OR
```
https://admin-api.zfitdance.com
```

---

## 🔄 Post-Domain Setup Steps

### **1. Configure Custom Domain in Railway**

For **Member API:**
1. Go to Railway Dashboard → `member-api` service
2. Click "Settings" → "Custom Domain"
3. Enter: `api.zfitdance.com`
4. Railway will provide DNS instructions
5. Copy the CNAME target value

For **Admin API:**
1. Go to Railway Dashboard → `admin-api` service
2. Click "Settings" → "Custom Domain"
3. Enter: `admin-api.zfitdance.com` (or use `api.zfitdance.com` with path routing)
4. Railway will provide DNS instructions

### **2. Add DNS Records in Namecheap**

1. Log in to Namecheap
2. Go to Domain List → Manage → Advanced DNS
3. Add the CNAME records provided by Railway
4. Wait for DNS propagation (usually 5-30 minutes, can take up to 48 hours)

### **3. Update CORS Configuration**

**In Railway Environment Variables:**

**Member API:**
```bash
CORS_ORIGIN=https://www.zfitdance.com,https://zfitdance.com,https://admin.zfitdance.com
```

**Admin API:**
```bash
CORS_ORIGIN=https://admin.zfitdance.com,https://www.zfitdance.com
```

**Current Status:**
- Member API: `CORS_ORIGIN=*` (allows all - needs to be updated)
- Admin API: `CORS_ORIGIN=*` (allows all - needs to be updated)

### **4. Update Mobile App Configuration**

**File:** `fitness-dance-backend/ZFitDancePlus/src/config/api.ts`

**Change from:**
```typescript
export const API_BASE_URL = __DEV__
  ? 'https://member-api-production.up.railway.app/api'
  : 'https://member-api-production.up.railway.app/api';
```

**Change to:**
```typescript
export const API_BASE_URL = __DEV__
  ? 'https://api.zfitdance.com/api'  // Development
  : 'https://api.zfitdance.com/api';  // Production
```

### **5. Update Admin Web Configuration**

**File:** `fitness-dance-backend/admin-web/lib/api.ts` (or similar)

Update the API base URL to use the custom domain.

---

## ✅ Namecheap Checkout Checklist

When purchasing your domain, ensure:

- [ ] **Domain Name:** `zfitdance.com` (or your preferred domain)
- [ ] **Nameserver Settings:** Select "Use Namecheap BasicDNS"
- [ ] **URL Forwarding:** Optional (can configure later)
- [ ] **Email Forwarding:** Optional (can configure later)
- [ ] **Save to default settings:** ✅ Checked
- [ ] **Privacy Protection:** ✅ Enabled (recommended)
- [ ] **Auto-Renew:** ✅ Enabled (recommended)

---

## 📋 Post-Purchase Action Items

After purchasing your domain:

1. [ ] **Wait for domain activation** (usually instant, can take up to 24 hours)
2. [ ] **Configure custom domain in Railway** (for both APIs)
3. [ ] **Add DNS CNAME records in Namecheap** (as provided by Railway)
4. [ ] **Wait for DNS propagation** (5-30 minutes typically)
5. [ ] **Verify SSL certificate** (automatic via Railway)
6. [ ] **Update CORS_ORIGIN** in Railway environment variables
7. [ ] **Update API URLs** in mobile app configuration
8. [ ] **Update API URLs** in admin web configuration
9. [ ] **Test API endpoints** with new domain
10. [ ] **Update Android network security config** if needed

---

## 🔍 Verification Steps

### **Test DNS Configuration**

```bash
# Check if DNS is resolving
nslookup api.zfitdance.com

# Check CNAME record
dig api.zfitdance.com CNAME

# Test SSL certificate
curl -I https://api.zfitdance.com
```

### **Test API Endpoints**

```bash
# Health check
curl https://api.zfitdance.com/health

# Test with mobile app
# Update API_BASE_URL and test login/registration
```

---

## 📚 Related Documentation

- Railway Deployment: `railway/RAILWAY_MANUAL_DEPLOYMENT.md`
- API Configuration: `fitness-dance-backend/ZFitDancePlus/src/config/api.ts`
- CORS Setup: `fitness-dance-backend/member-api/src/app.ts`
- Domain Structure: `Tech_Stack_Guide.md` (lines 1324-1339)

---

## ⚠️ Important Notes

1. **DNS Propagation:** Changes can take 5-30 minutes, but may take up to 48 hours
2. **SSL Certificate:** Railway automatically provisions SSL - no manual setup needed
3. **CORS:** Must update CORS_ORIGIN after custom domain is configured
4. **Mobile App:** Update API URLs in config file after domain is live
5. **Testing:** Test all endpoints after domain configuration
6. **Backup:** Keep Railway domain URLs as backup until custom domain is fully tested

---

## 🆘 Troubleshooting

### **Domain not resolving**
- Check DNS records in Namecheap
- Verify CNAME target is correct
- Wait for DNS propagation (can take up to 48 hours)

### **SSL certificate not working**
- Railway automatically provisions SSL - wait 5-10 minutes after DNS propagation
- Verify DNS is correctly configured
- Check Railway dashboard for SSL status

### **CORS errors**
- Verify CORS_ORIGIN includes your frontend domain
- Check that environment variables are updated in Railway
- Restart Railway services after updating environment variables

---

**Last Updated:** Based on current project structure  
**Domain:** zfitdance.com (or zfitdanceplus.com)  
**Hosting:** Railway (Backend APIs)

