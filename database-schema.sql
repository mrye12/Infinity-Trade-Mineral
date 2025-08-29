-- Database Schema for Infinity Trade Mineral
-- Run this in your Supabase SQL editor

-- Enable Row Level Security (RLS) extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users with role management)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
    department TEXT,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function to automatically create user profile after auth.users insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'staff'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function when new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Documents table for company documents, contracts, etc.
CREATE TABLE public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('contract', 'company_doc', 'report', 'other')),
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Invoices table
CREATE TABLE public.invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    extra_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('unpaid', 'paid', 'overdue')) DEFAULT 'unpaid',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Invoice items table
CREATE TABLE public.invoice_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Shipments table for tracking mineral shipments
CREATE TABLE public.shipments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shipment_code TEXT UNIQUE NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    vessel_name TEXT NOT NULL,
    departure_port TEXT NOT NULL,
    arrival_port TEXT NOT NULL,
    departure_date DATE NOT NULL,
    arrival_date DATE,
    quantity DECIMAL(15,2) NOT NULL, -- in tons
    status TEXT NOT NULL CHECK (status IN ('Scheduled', 'On Transit', 'Arrived', 'Completed')) DEFAULT 'Scheduled',
    documents JSONB DEFAULT '[]'::jsonb, -- [{ name, url, type, uploaded_at }]
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Office stock management table
CREATE TABLE public.stock_office (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('office_supplies', 'equipment', 'consumables')),
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    location TEXT NOT NULL,
    last_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_created_by ON public.invoices(created_by);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_created_by ON public.shipments(created_by);
CREATE INDEX idx_shipments_departure_date ON public.shipments(departure_date);
CREATE INDEX idx_shipments_invoice_id ON public.shipments(invoice_id);
CREATE INDEX idx_stock_office_category ON public.stock_office(category);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_office ENABLE ROW LEVEL SECURITY;

-- Create policies for authentication and role-based access
-- Users: authenticated users can read all users, but only update their own
CREATE POLICY "Authenticated users can view user profiles" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Admin-only policies for user management
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Documents: authenticated users can read all, create new, admins can manage all
CREATE POLICY "Authenticated users can view documents" ON public.documents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create documents" ON public.documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Invoices: authenticated users can read all, create new
CREATE POLICY "Authenticated users can view invoices" ON public.invoices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Invoice items: inherit from invoices
CREATE POLICY "Authenticated users can view invoice items" ON public.invoice_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create invoice items" ON public.invoice_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Shipments: authenticated users can read all, create new
CREATE POLICY "Authenticated users can view shipments" ON public.shipments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create shipments" ON public.shipments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Stock office: authenticated users can read all, create new
CREATE POLICY "Authenticated users can view stock" ON public.stock_office
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create stock items" ON public.stock_office
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER on_users_updated
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_documents_updated
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_invoices_updated
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_shipments_updated
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_stock_office_updated
    BEFORE UPDATE ON public.stock_office
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ============================================
-- SUPABASE STORAGE SETUP (Run in Supabase UI)
-- ============================================

-- 1. Create Storage Bucket for Shipment Documents
-- Go to Supabase Dashboard > Storage > Create Bucket
-- Bucket Name: shipment-documents
-- Public: false (private bucket for security)
-- File Size Limit: 10MB
-- Allowed MIME Types: application/pdf, image/jpeg, image/png, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- 2. Storage Policies (Run in SQL Editor)
-- Allow authenticated users to upload documents
-- INSERT POLICY for shipment-documents bucket:
/*
CREATE POLICY "Authenticated users can upload shipment documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'shipment-documents' 
    AND auth.role() = 'authenticated'
);
*/

-- Allow users to view documents they have access to
-- SELECT POLICY for shipment-documents bucket:
/*
CREATE POLICY "Users can view shipment documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'shipment-documents' 
    AND auth.role() = 'authenticated'
);
*/

-- Allow admin users to delete documents
-- DELETE POLICY for shipment-documents bucket:
/*
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
*/

-- NOTE: These storage policies need to be created through the Supabase Dashboard
-- or by uncommenting and running the SQL above in the Supabase SQL Editor.
