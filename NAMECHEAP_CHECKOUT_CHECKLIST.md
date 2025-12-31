# ✅ Namecheap Domain Purchase Checklist

## 🛒 During Checkout

### **Domain Selection**
- [ ] Domain name: `zfitdance.com` (or your preferred domain)
- [ ] Registration period: 1 year (minimum recommended)
- [ ] Auto-renew: ✅ Enable (recommended)

### **Nameserver Settings** ⚠️ IMPORTANT

**Select:**
- ✅ **"Use Namecheap BasicDNS"** (Radio button)

**Do NOT select:**
- ❌ "Use Custom DNS" (unless you have specific nameservers)

**Optional Settings:**
- [ ] Enable URL Forwarding: Optional (can add later)
- [ ] Enable Email Forwarding: Optional (can add later)

### **Additional Options**
- [ ] **Privacy Protection:** ✅ Enable (recommended - protects your contact info)
- [ ] **Save configuration to default checkout settings:** ✅ Check this box

---

## 📝 What Happens After Purchase

1. **Domain Activation:** Usually instant, can take up to 24 hours
2. **Access DNS Settings:** Namecheap → Domain List → Manage → Advanced DNS
3. **Configure Custom Domain in Railway:** (See DOMAIN_HOSTING_CONFIGURATION.md)
4. **Add DNS Records:** Add CNAME records as provided by Railway

---

## 🎯 Quick Reference

**Your Domain Structure:**
```
zfitdance.com              → Main website (future)
api.zfitdance.com          → Backend API (Member API)
admin-api.zfitdance.com    → Admin API (optional)
admin.zfitdance.com        → Admin panel (future)
```

**Current Railway URLs (will change after custom domain setup):**
- Member API: `member-api-production.up.railway.app`
- Admin API: `admin-api-production-5059.up.railway.app`

---

## ⚠️ Critical Settings

**MUST SELECT:**
- ✅ Use Namecheap BasicDNS

**CAN SKIP FOR NOW:**
- URL Forwarding
- Email Forwarding
- Custom DNS

**RECOMMENDED:**
- Privacy Protection
- Auto-Renew

---

**Next Steps:** See `DOMAIN_HOSTING_CONFIGURATION.md` for complete setup guide after purchase.

