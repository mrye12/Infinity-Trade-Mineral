# 🗄️ Supabase Production Setup Guide

> **Complete guide for setting up Supabase backend services for Infinity Trade Mineral in production environment.**

## 📋 Overview

This guide covers the complete setup of Supabase services for production deployment, including database migration, storage configuration, security policies, and monitoring setup.

---

## 🚀 Step 1: Create Production Project

### 1.1 Project Creation
1. **Visit [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Click "New Project"**
3. **Select Organization** (or create new)
4. **Project Configuration:**
   ```
   Project Name: infinity-trade-mineral-prod
   Database Password: [Generate strong password - save securely]
   Region: Singapore (sin1) - closest to target users
   ```
5. **Click "Create new project"**
6. **Wait 2-3 minutes** for initialization

### 1.2 Project Information
After creation, note down:
- **Project URL**: `https://[project-id].supabase.co`
- **Project ID**: Found in project settings
- **Database Password**: From creation step
- **Region**: sin1 (Singapore)

---

## 🗄️ Step 2: Database Migration

### 2.1 Access SQL Editor
1. **Go to SQL Editor** in Supabase Dashboard
2. **Create new query** 
3. **Copy complete content** from `database-schema.sql`

### 2.2 Execute Migration Script
```sql
-- Execute the complete database-schema.sql content
-- This includes:
-- ✅ Extension setup (uuid-ossp)
-- ✅ Users table with role management
-- ✅ Documents table
-- ✅ Invoices table with JSONB items
-- ✅ Shipments table with document storage
-- ✅ Stock office table
-- ✅ Indexes for performance
-- ✅ RLS policies
-- ✅ Triggers for updated_at
-- ✅ User profile creation trigger
```

### 2.3 Verify Migration Success
**Check Tables Created:**
```sql
-- Verify all tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables:
-- documents
-- invoices
-- shipments
-- stock_office
-- users
```

**Check RLS Status:**
```sql
-- Verify Row Level Security is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- All tables should have rowsecurity = true
```

**Check Policies:**
```sql
-- Verify policies are created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Should show policies for SELECT, INSERT, UPDATE, DELETE
```

---

## 📁 Step 3: Storage Configuration

### 3.1 Create Storage Buckets

**Bucket 1: Documents**
1. **Go to Storage** → **Create Bucket**
2. **Configuration:**
   ```
   Name: documents
   Public: false (private bucket)
   File Size Limit: 10 MB
   Allowed MIME Types: 
   - application/pdf
   - image/jpeg
   - image/png
   - application/msword
   - application/vnd.openxmlformats-officedocument.wordprocessingml.document
   ```

**Bucket 2: Shipment Documents**
1. **Create second bucket**
2. **Configuration:**
   ```
   Name: shipment-documents
   Public: false (private bucket)
   File Size Limit: 10 MB
   Allowed MIME Types: 
   - application/pdf
   - image/jpeg
   - image/png
   - application/msword
   - application/vnd.openxmlformats-officedocument.wordprocessingml.document
   ```

### 3.2 Storage Policies Setup
**Execute in SQL Editor:**

```sql
-- ================================
-- STORAGE POLICIES
-- ================================

-- Documents bucket policies
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view documents" ON storage.objects
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

-- Shipment documents bucket policies
CREATE POLICY "Authenticated users can upload shipment documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'shipment-documents' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view shipment documents" ON storage.objects
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

### 3.3 Verify Storage Setup
```sql
-- Check storage buckets
SELECT * FROM storage.buckets;

-- Check storage policies
SELECT * FROM storage.policies ORDER BY bucket_id, policy_name;
```

---

## 🔐 Step 4: Enhanced Security Policies

### 4.1 Admin-Only Operations
**Add UPDATE and DELETE policies for admin operations:**

```sql
-- ================================
-- ADMIN-ONLY CRUD POLICIES
-- ================================

-- Invoices admin policies
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

-- Shipments admin policies
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

-- Stock office admin policies
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

-- Documents admin policies
CREATE POLICY "Admin can update documents" ON public.documents
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    )
);

CREATE POLICY "Admin can delete documents" ON public.documents
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    )
);
```

### 4.2 Staff Limited Access Policies
**Staff can only update records they created:**

```sql
-- ================================
-- STAFF LIMITED UPDATE POLICIES
-- ================================

-- Staff can update their own invoices
CREATE POLICY "Staff can update own invoices" ON public.invoices
FOR UPDATE USING (
    auth.uid()::text IN (
        SELECT auth_user_id::text FROM public.users WHERE id = created_by
    )
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'staff'
    )
);

-- Staff can update their own shipments
CREATE POLICY "Staff can update own shipments" ON public.shipments
FOR UPDATE USING (
    auth.uid()::text IN (
        SELECT auth_user_id::text FROM public.users WHERE id = created_by
    )
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'staff'
    )
);

-- Staff can update their own stock items
CREATE POLICY "Staff can update own stock items" ON public.stock_office
FOR UPDATE USING (
    auth.uid()::text IN (
        SELECT auth_user_id::text FROM public.users WHERE id = last_updated_by
    )
    AND EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'staff'
    )
);
```

---

## 🔑 Step 5: Authentication Configuration

### 5.1 Authentication Settings
1. **Go to Authentication** → **Settings**
2. **Configure the following:**

   **Site URL:**
   ```
   https://admin.infinitytrademineral.id
   ```

   **Redirect URLs:**
   ```
   https://admin.infinitytrademineral.id/auth/callback
   https://admin.infinitytrademineral.id/dashboard
   ```

   **JWT Expiry:**
   ```
   3600 seconds (1 hour) - recommended for security
   ```

### 5.2 Email Templates (Optional)
**Customize email templates in Authentication → Templates:**
- **Confirm signup**: Welcome message
- **Reset password**: Password reset instructions
- **Magic link**: Login link (if using)

### 5.3 Create First Admin User
**Option 1: Via SQL (Recommended)**
```sql
-- Insert admin user (after they sign up via app)
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@infinitytrademineral.id';
```

**Option 2: Via Authentication Dashboard**
1. **Go to Authentication** → **Users**
2. **Invite user** with admin email
3. **After signup, update role** via SQL

---

## 📊 Step 6: API Keys & Configuration

### 6.1 Get API Keys
1. **Go to Settings** → **API**
2. **Copy the following keys:**

   **Project URL:**
   ```
   https://[project-id].supabase.co
   ```

   **Anon (Public) Key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Service Role (Secret) Key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 6.2 Environment Variables for Deployment
**Use these in Vercel environment variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔍 Step 7: Testing & Verification

### 7.1 Database Testing
```sql
-- Test user creation trigger
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('test@example.com', crypt('password', gen_salt('bf')), now());

-- Check if public.users record was created
SELECT * FROM public.users WHERE email = 'test@example.com';

-- Clean up test data
DELETE FROM auth.users WHERE email = 'test@example.com';
```

### 7.2 Storage Testing
1. **Go to Storage** → **Documents bucket**
2. **Upload test file** via dashboard
3. **Verify file appears**
4. **Test download** functionality
5. **Delete test file**

### 7.3 RLS Testing
```sql
-- Test RLS policies (should return empty for unauthenticated)
SELECT * FROM public.invoices; -- Should fail or return empty

-- Test with authenticated context
SELECT auth.uid(); -- Should return user ID when authenticated
```

---

## 📈 Step 8: Monitoring & Maintenance

### 8.1 Enable Monitoring
1. **Go to Settings** → **General**
2. **Enable the following:**
   - Database metrics
   - API analytics
   - Storage analytics
   - Auth analytics

### 8.2 Set Up Alerts (Optional)
1. **Configure email alerts** for:
   - High CPU usage
   - Storage quota approaching
   - Unusual authentication activity
   - API rate limit approaching

### 8.3 Backup Strategy
**Supabase automatically provides:**
- **Daily backups** (retained for 7 days)
- **Point-in-time recovery** (last 7 days)
- **Manual backup** option available

**For additional backup:**
```sql
-- Create manual backup
pg_dump --host=db.[project-id].supabase.co --port=5432 --username=postgres --dbname=postgres > backup.sql
```

---

## 🚨 Security Checklist

### 8.4 Final Security Verification
- [ ] **RLS enabled** on all public tables
- [ ] **Storage buckets** are private (not public)
- [ ] **Admin policies** prevent unauthorized access
- [ ] **Staff policies** limit access appropriately
- [ ] **API keys** properly configured in environment
- [ ] **Service role key** marked as server-only
- [ ] **Authentication** configured with proper redirects
- [ ] **File upload limits** configured (10MB max)
- [ ] **MIME type restrictions** in place
- [ ] **Database triggers** working correctly

---

## 🔧 Troubleshooting

### Common Issues & Solutions

**Migration Failures:**
```sql
-- Check for existing tables before migration
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Drop and recreate if needed (⚠️ Use with caution)
DROP TABLE IF EXISTS public.table_name CASCADE;
```

**RLS Policy Issues:**
```sql
-- Check if user exists in public.users
SELECT * FROM public.users WHERE auth_user_id = auth.uid();

-- Verify trigger is working
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 5;
```

**Storage Access Issues:**
```sql
-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'documents';

-- Verify bucket exists
SELECT * FROM storage.buckets;
```

**Connection Issues:**
- **Check project status** in Supabase dashboard
- **Verify API keys** are correct
- **Check firewall** settings if applicable
- **Verify region** matches deployment region

---

## 📞 Support Resources

### Supabase Documentation
- **[Supabase Docs](https://supabase.com/docs)**
- **[Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)**
- **[Storage Guide](https://supabase.com/docs/guides/storage)**
- **[Authentication Guide](https://supabase.com/docs/guides/auth)**

### Community Support
- **[Supabase Discord](https://discord.supabase.com/)**
- **[GitHub Discussions](https://github.com/supabase/supabase/discussions)**
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)**

---

## ✅ Completion Checklist

### Production Setup Complete When:
- [ ] **Database migrated** successfully
- [ ] **All tables created** with RLS enabled
- [ ] **Storage buckets** configured and secured
- [ ] **Authentication** working properly
- [ ] **API keys** obtained and documented
- [ ] **Policies tested** and verified
- [ ] **First admin user** created
- [ ] **Monitoring enabled**
- [ ] **Backup verified**
- [ ] **Security checklist** completed

---

**🎉 Supabase Production Setup Complete!**

Your Infinity Trade Mineral backend is now fully configured and secured for production use.

**🔗 Important Links:**
- **Supabase Dashboard**: https://supabase.com/dashboard/project/[project-id]
- **Project URL**: https://[project-id].supabase.co
- **API Documentation**: https://supabase.com/dashboard/project/[project-id]/api

**⚠️ Keep Safe:**
- Service Role Key (never expose publicly)
- Database password
- Project access credentials
