# Infinity Trade Mineral - Internal Management System

> **Professional internal website for managing company documents, contracts, invoices, shipments, and office stock.**

## 🌟 Overview

Infinity Trade Mineral Internal Management System is a comprehensive web application designed specifically for managing the day-to-day operations of a mineral trading company. The system provides secure, role-based access to critical business functions including invoice management, shipment tracking, office inventory, and document storage.

## 🚀 Features

### 🔐 **Authentication & Role Management**
- **Secure Authentication**: Email/password login with Supabase Auth
- **Role-Based Access Control**: Admin and Staff roles with different permissions
- **Session Management**: Automatic session handling and route protection

### 📊 **Dashboard**
- **Real-time Statistics**: Overview of invoices, shipments, documents, and stock
- **Interactive Charts**: Shipment trends and invoice status distribution
- **Quick Actions**: Role-based navigation and quick access to modules
- **Alert System**: Low stock and critical status notifications

### 🧾 **Invoice Management**
- **Complete CRUD Operations**: Create, read, update, delete invoices
- **Auto-numbering**: Sequential invoice numbers (INV-YYYY-NNNN)
- **Dynamic Calculations**: Automatic subtotal, tax, extra fee, and total calculations
- **Status Tracking**: Paid, unpaid, overdue status management
- **Advanced Filtering**: By customer, status, date ranges

### 🚢 **Shipment Tracking**
- **Maritime Operations**: Vessel-based shipment tracking
- **Status Workflow**: Scheduled → On Transit → Arrived → Completed
- **Document Management**: Upload and manage shipping documents (BL, manifests)
- **Invoice Integration**: Link shipments to invoices with auto-payment updates
- **Route Tracking**: Departure and arrival port management

### 📦 **Office Stock Management**
- **Inventory Control**: Track office supplies, equipment, and consumables
- **Low Stock Alerts**: Automatic notifications when stock runs low
- **Location Tracking**: Organize items by office locations
- **Quantity Adjustments**: Stock in/out with reason tracking
- **Category Management**: Office supplies, equipment, consumables

### 📄 **Document Storage** (Ready for Phase 7)
- **Secure File Storage**: Supabase Storage integration
- **Categorization**: Contracts, company docs, reports
- **Access Control**: Role-based document access
- **Search & Filter**: Advanced document discovery

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern, accessible UI components
- **Lucide React**: Beautiful icon library
- **React Hook Form**: Form management with validation
- **Zod**: Schema validation
- **Recharts**: Data visualization

### **Backend**
- **Supabase**: Backend-as-a-Service
  - **Authentication**: Email/password with RLS
  - **Database**: PostgreSQL with real-time subscriptions
  - **Storage**: File upload and management
  - **Edge Functions**: Serverless functions (if needed)

### **Deployment**
- **Vercel**: Frontend deployment and hosting
- **Supabase Cloud**: Managed database and backend services
- **Custom Domain**: Professional domain setup
- **SSL/TLS**: Automatic HTTPS encryption

## 📋 Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Supabase Account**: For backend services
- **Vercel Account**: For deployment (optional)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-organization/infinity-trade-mineral.git
cd infinity-trade-mineral
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Database Setup
1. Create a new Supabase project
2. Run the SQL migration from `database-schema.sql`
3. Create storage buckets: `documents`, `shipment-documents`
4. Configure storage policies

### 5. Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
infinity-trade-mineral/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── invoices/          # Invoice management
│   ├── shipments/         # Shipment tracking
│   ├── stock/             # Office stock management
│   ├── documents/         # Document management
│   └── users/             # User management (admin)
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard-specific components
│   └── navigation.tsx    # Global navigation
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client configuration
│   ├── auth.ts           # Authentication helpers
│   ├── types.ts          # TypeScript type definitions
│   ├── invoice-service.ts # Invoice business logic
│   ├── shipment-service.ts # Shipment business logic
│   └── stock-service.ts  # Stock business logic
├── styles/               # Global styles
├── database-schema.sql   # Database migration
└── deployment/           # Deployment configuration
```

## 🔐 Security

### **Authentication**
- **Supabase Auth**: Industry-standard authentication
- **Session Management**: Secure session handling
- **Route Protection**: Middleware-based route protection

### **Authorization**
- **Role-Based Access Control (RBAC)**: Admin and Staff roles
- **Row Level Security (RLS)**: Database-level security policies
- **API Protection**: All API routes require authentication

### **Data Protection**
- **Input Validation**: Zod schema validation throughout
- **SQL Injection Prevention**: Supabase prepared statements
- **XSS Protection**: React's built-in XSS protection
- **HTTPS Encryption**: All traffic encrypted in production

## 🎯 User Roles & Permissions

### **Admin**
- **Full System Access**: All modules and operations
- **User Management**: Create, edit, delete users
- **Data Management**: Full CRUD operations on all entities
- **System Configuration**: Manage system settings and policies

### **Staff**
- **Limited Access**: Create and view operations only
- **No Deletions**: Cannot delete invoices, shipments, or stock items
- **Personal Data**: Can update their own profile
- **Operational Focus**: Day-to-day business operations

## 📊 API Endpoints

### **Authentication**
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/user` - Get current user
- `PUT /auth/profile` - Update user profile

### **Health Check**
- `GET /api/health` - System health check
- `GET /api/health/database` - Database connectivity check
- `GET /api/health/storage` - Storage connectivity check

## 🚀 Deployment

### **Vercel Deployment**

1. **Connect Repository**
   ```bash
   # Push to GitHub/GitLab
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Select your repository
   - Framework Preset: Next.js

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Custom Domain**
   - Add custom domain in Vercel settings
   - Configure DNS records
   - SSL automatically provisioned

### **Supabase Production Setup**

1. **Create Production Project**
   - New Supabase project for production
   - Run `database-schema.sql` migration
   - Configure storage buckets and policies

2. **Security Configuration**
   - Enable Row Level Security (RLS)
   - Configure authentication providers
   - Set up storage policies

## 🧪 Testing

### **Development Testing**
```bash
# Type checking
npm run type-check

# Build test
npm run build

# Linting
npm run lint
```

### **Production Testing**
1. **Authentication Flow**: Login/logout functionality
2. **Module Testing**: Test all CRUD operations
3. **File Upload**: Test document and shipment file uploads
4. **Role Permissions**: Verify admin/staff access controls
5. **Responsive Design**: Test on mobile and desktop

## 📈 Monitoring

### **Health Checks**
- **Application Health**: `/api/health`
- **Database Connectivity**: Automatic connection testing
- **Storage Availability**: File upload/download verification

### **Performance Monitoring**
- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Metrics**: Database performance tracking
- **Error Logging**: Comprehensive error tracking

## 🤝 Contributing

### **Development Workflow**
1. Create feature branch from `main`
2. Make changes with proper commit messages
3. Test thoroughly before pushing
4. Create pull request for review
5. Deploy after approval

### **Code Standards**
- **TypeScript**: All code must be properly typed
- **ESLint**: Follow configured linting rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages

## 📞 Support

### **Technical Support**
- **Documentation**: This README and inline code comments
- **Issue Tracking**: GitHub Issues for bug reports
- **Development Team**: Internal development team contact

### **Business Support**
- **User Training**: Staff training on system usage
- **Feature Requests**: Business stakeholder feedback
- **System Administration**: IT department contact

## 📄 License

This project is proprietary software developed for Infinity Trade Mineral. All rights reserved.

---

## 🎯 Business Impact

### **Operational Efficiency**
- **Digital Transformation**: Paperless office operations
- **Process Automation**: Automated calculations and workflows
- **Real-time Visibility**: Instant access to business data
- **Audit Trail**: Complete tracking of all business operations

### **Cost Reduction**
- **Reduced Manual Work**: Automated invoice and shipment management
- **Inventory Optimization**: Smart stock level management
- **Document Organization**: Efficient document storage and retrieval
- **Error Reduction**: Validated data entry and calculations

### **Business Intelligence**
- **Dashboard Analytics**: Real-time business metrics
- **Trend Analysis**: Historical data visualization
- **Performance Tracking**: KPI monitoring and reporting
- **Decision Support**: Data-driven business decisions

---

**🏢 Infinity Trade Mineral Internal Management System**  
*Professional, Secure, Efficient*

**Built with ❤️ for operational excellence**