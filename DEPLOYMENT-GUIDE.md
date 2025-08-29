# 🚀 Deployment Guide - Infinity Trade Mineral

> **Complete step-by-step guide for deploying the Infinity Trade Mineral internal management system to production.**

## 📋 Pre-Deployment Checklist

### ✅ **Development Completion**
- [ ] All features tested in development
- [ ] Build process completes without errors (`npm run build`)
- [ ] TypeScript compilation successful
- [ ] All linting issues resolved
- [ ] Database schema finalized

### ✅ **Repository Setup**
- [ ] Code committed to Git repository
- [ ] `.gitignore` properly configured
- [ ] Environment files excluded from Git
- [ ] README.md updated
- [ ] Repository pushed to GitHub/GitLab

---

## 🏗️ Step 1: Repository & Build Setup

### 1.1 Initialize Git Repository
```bash
# Initialize Git (if not already done)
git init

# Add all files
git add .

# Commit initial version
git commit -m "feat: initial commit - Infinity Trade Mineral management system"

# Add remote repository
git remote add origin https://github.com/your-organization/infinity-trade-mineral.git

# Push to main branch
git push -u origin main
```

### 1.2 Verify Build Process
```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Build production version
npm run build

# Test production build locally
npm start
```

### 1.3 Required Files Checklist
- [x] `.gitignore` - Excludes sensitive files
- [x] `README.md` - Project documentation
- [x] `vercel.json` - Vercel deployment configuration
- [x] `environment-variables-template.txt` - Environment setup guide
- [x] `database-schema.sql` - Complete database migration
- [x] `package.json` - Dependencies and scripts

---

## 🗄️ Step 2: Supabase Production Setup

### 2.1 Create Production Supabase Project
1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Click "New Project"**
3. **Configure Project:**
   - Organization: Your company organization
   - Name: `infinity-trade-mineral-prod`
   - Database Password: Strong password (save securely)
   - Region: Singapore (sin1) for optimal performance
4. **Wait for project initialization (2-3 minutes)**

### 2.2 Database Migration
1. **Open SQL Editor** in Supabase Dashboard
2. **Copy content** from `database-schema.sql`
3. **Execute SQL migration:**
   ```sql
   -- Copy and paste the entire database-schema.sql content
   -- This will create all tables, policies, and triggers
   ```
4. **Verify tables created:**
   - `public.users`
   - `public.documents`
   - `public.invoices`
   - `public.shipments`
   - `public.stock_office`

### 2.3 Storage Buckets Setup
1. **Go to Storage** in Supabase Dashboard
2. **Create Buckets:**

   **Bucket 1: `documents`**
   - Name: `documents`
   - Public: `false` (private)
   - File Size Limit: `10MB`
   - Allowed MIME Types: `application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`

   **Bucket 2: `shipment-documents`**
   - Name: `shipment-documents`
   - Public: `false` (private)
   - File Size Limit: `10MB`
   - Allowed MIME Types: `application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### 2.4 Get API Keys
1. **Go to Project Settings → API**
2. **Copy the following keys:**
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Public Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ⚠️ **Keep Secret!**

---

## 🌐 Step 3: Vercel Deployment

### 3.1 Import Repository to Vercel
1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "Import Project"**
3. **Select Git Provider** (GitHub/GitLab)
4. **Choose Repository:** `infinity-trade-mineral`
5. **Configure Project:**
   - Framework Preset: `Next.js`
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

### 3.2 Environment Variables Configuration
1. **Go to Project Settings → Environment Variables**
2. **Add the following variables:**

   **Public Variables (Client + Server):**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

   **Server-Only Variables (Server):**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NODE_ENV=production
   ```

3. **Click "Deploy"** to trigger first deployment

### 3.3 Verify Deployment
1. **Wait for build completion** (2-3 minutes)
2. **Visit generated URL** (e.g., `https://infinity-trade-mineral.vercel.app`)
3. **Test health check:** `https://your-domain.vercel.app/api/health`
4. **Expected response:**
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-XX...",
     "services": {
       "database": { "status": "connected" },
       "storage": { "status": "connected" },
       "auth": { "status": "configured" }
     }
   }
   ```

---

## 🌍 Step 4: Custom Domain Setup

### 4.1 Add Custom Domain
1. **Go to Vercel Project → Settings → Domains**
2. **Add Domain:** `admin.infinitytrademineral.id`
3. **Vercel will provide DNS configuration:**
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   ```

### 4.2 Configure DNS
1. **Access your domain provider** (Cloudflare, Namecheap, etc.)
2. **Add DNS records** as provided by Vercel
3. **Wait for propagation** (5-30 minutes)
4. **SSL certificate** automatically provisioned by Vercel

### 4.3 Update Environment Variables
1. **Update `NEXT_PUBLIC_APP_URL`** in Vercel settings:
   ```env
   NEXT_PUBLIC_APP_URL=https://admin.infinitytrademineral.id
   ```
2. **Redeploy** to apply changes

---

## 🔐 Step 5: Security & RLS Configuration

### 5.1 Storage Policies Setup
**In Supabase SQL Editor, execute:**

```sql
-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Admin users can delete documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Storage policies for shipment-documents bucket
CREATE POLICY "Authenticated users can upload shipment documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'shipment-documents' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view shipment documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'shipment-documents' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Admin users can delete shipment documents" ON storage.objects
FOR DELETE USING (
    bucket_id = 'shipment-documents' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    )
);
```

### 5.2 Verify RLS Policies
**Check that RLS is enabled on all tables:**
```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should return rowsecurity = true for all tables
```

### 5.3 Additional Security Policies
**Add UPDATE/DELETE policies for admin-only operations:**
```sql
-- Admin-only UPDATE policies
CREATE POLICY "Admin can update invoices" ON public.invoices
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "Admin can delete invoices" ON public.invoices
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Similar policies for shipments and stock_office
CREATE POLICY "Admin can update shipments" ON public.shipments
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "Admin can delete shipments" ON public.shipments
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "Admin can update stock" ON public.stock_office
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "Admin can delete stock" ON public.stock_office
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    )
);
```

---

## 🧪 Step 6: Testing & Monitoring

### 6.1 Health Check Verification
```bash
# Test health endpoint
curl https://admin.infinitytrademineral.id/api/health

# Expected healthy response
{
  "status": "healthy",
  "services": {
    "database": { "status": "connected" },
    "storage": { "status": "connected" },
    "auth": { "status": "configured" }
  }
}
```

### 6.2 End-to-End Testing Checklist

**Authentication Testing:**
- [ ] User registration works
- [ ] User login/logout functional
- [ ] Password reset (if implemented)
- [ ] Session persistence
- [ ] Route protection active

**Module Testing:**
- [ ] **Dashboard**: Statistics loading, charts rendering
- [ ] **Invoices**: Create, edit, delete, status updates
- [ ] **Shipments**: Create, edit, status workflow, document upload
- [ ] **Stock**: Create, edit, quantity adjustments, low stock alerts
- [ ] **Documents**: Upload, view, delete (when implemented)

**Permission Testing:**
- [ ] **Admin**: Full access to all modules
- [ ] **Staff**: Limited access (no delete operations)
- [ ] **Unauthorized**: Proper redirects to login

**File Upload Testing:**
- [ ] **Shipment documents**: PDF, DOC, image uploads
- [ ] **File size limits**: Respect 10MB limit
- [ ] **File type validation**: Only allowed types accepted
- [ ] **Storage security**: Files not publicly accessible

**Performance Testing:**
- [ ] **Page load times**: < 3 seconds
- [ ] **Database queries**: Efficient execution
- [ ] **File uploads**: Reasonable speed
- [ ] **Mobile responsiveness**: All devices

### 6.3 Production Monitoring Setup

**Vercel Analytics:**
1. **Enable Vercel Analytics** in project settings
2. **Monitor performance metrics**
3. **Set up alerts** for errors

**Supabase Monitoring:**
1. **Monitor database performance** in Supabase Dashboard
2. **Check API usage** and rate limits
3. **Monitor storage usage** and costs

---

## 🎯 Step 7: Go Live

### 7.1 Final Pre-Launch Checklist
- [ ] **All tests passing**
- [ ] **Health checks green**
- [ ] **SSL certificate active**
- [ ] **Custom domain working**
- [ ] **Environment variables configured**
- [ ] **Database migration complete**
- [ ] **Storage buckets created and secured**
- [ ] **RLS policies active**
- [ ] **Admin user created**
- [ ] **Staff users can be invited**

### 7.2 Launch Announcement
1. **Internal announcement** to team
2. **Admin training** on system features
3. **Staff onboarding** and account creation
4. **Documentation** distribution
5. **Support contact** establishment

### 7.3 Post-Launch Monitoring
**First 24 Hours:**
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify user registrations
- [ ] Test all critical workflows
- [ ] Monitor resource usage

**First Week:**
- [ ] User feedback collection
- [ ] Performance optimization
- [ ] Bug fixes if needed
- [ ] Feature requests evaluation
- [ ] Security audit

---

## 🆘 Troubleshooting

### Common Issues & Solutions

**Build Failures:**
```bash
# Clear dependencies and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Environment Variable Issues:**
- Check variable names (exact match required)
- Verify Supabase URLs and keys
- Ensure server-only variables marked correctly

**Database Connection Errors:**
- Verify Supabase project URL
- Check service role key permissions
- Confirm RLS policies allow operations

**File Upload Failures:**
- Check storage bucket existence
- Verify storage policies
- Confirm file size and type limits

**Authentication Issues:**
- Verify auth configuration
- Check redirect URLs
- Confirm user table trigger is active

### Support Contacts
- **Technical Issues**: Development team
- **Deployment Issues**: DevOps team
- **Business Questions**: Project manager
- **Security Concerns**: Security team

---

## 📊 Success Metrics

### Deployment Success Indicators
- [ ] **Uptime**: > 99.9%
- [ ] **Response Time**: < 2 seconds average
- [ ] **Error Rate**: < 0.1%
- [ ] **User Satisfaction**: Positive feedback
- [ ] **Feature Adoption**: Active usage of all modules

### Business Impact Metrics
- [ ] **Operational Efficiency**: Reduced manual work
- [ ] **Data Accuracy**: Improved data quality
- [ ] **Process Speed**: Faster invoice/shipment processing
- [ ] **Inventory Control**: Better stock management
- [ ] **Document Organization**: Improved file management

---

**🎉 Congratulations! Your Infinity Trade Mineral management system is now live in production!**

**🔗 Production URLs:**
- **Main Application**: https://admin.infinitytrademineral.id
- **Health Check**: https://admin.infinitytrademineral.id/api/health
- **Supabase Dashboard**: https://supabase.com/dashboard/project/your-project-id

**📞 Need Help?**
Refer to this guide or contact the development team for assistance.
