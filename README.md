# 💻 M.R. Enterprise - Inventory Management System (Frontend Application)

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Sonner](https://img.shields.io/badge/Notifications-Sonner-orange)](https://sonner.emilkowal.ski/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com/)

> **Language / ভাষা নির্বাচন:**  
> 🇺🇸 **English Version (Default)** | [🇧🇩 বাংলা সংস্করণে যান](#-বাংলা-ডকুমেন্টেশন) | [📖 **সুপার এডমিন সহজ বাংলা সহায়িকা (User Guide)**](./USER_GUIDE.md)

> [!TIP]
> 🇧🇩 **নন-টেকনিক্যাল সুপার এডমিনদের জন্য বিস্তারিত বাংলা সহায়িকা:**  
> প্রতিটি স্ক্রিন, বোতাম ও হিসাব-নিকাশের সহজ ব্যাখ্যা পড়তে আমাদের [**বাংলা ইউজার গাইড (USER_GUIDE.md)**](./USER_GUIDE.md) দেখুন।

---

## 📑 Table of Contents (English)

1. [Project Overview](#-project-overview)
2. [User Interface & Theme Philosophy](#-user-interface--theme-philosophy)
3. [Key Modules & Feature Walkthrough](#-key-modules--feature-walkthrough)
4. [Tech Stack & Dependencies](#-tech-stack--dependencies)
5. [Architecture & Folder Structure](#-architecture--folder-structure)
6. [API Client & Communication Layer](#-api-client--communication-layer)
7. [Environment Variables](#-environment-variables)
8. [Installation & Local Development](#-installation--local-development)
9. [Build, Quality Check & Testing](#-build-quality-check--testing)
10. [Deployment Strategy (Vercel Prod vs Dev)](#-deployment-strategy-vercel-prod-vs-dev)
11. [Component Architecture Standards](#-component-architecture-standards)

---

## 🌟 Project Overview

The **M.R. Enterprise Frontend Application** is a high-performance, responsive ERP dashboard and Point-of-Sale (POS) interface tailored for high-throughput commercial enterprises. Built using **Next.js 14 App Router**, **React 18**, and **TypeScript**, the interface is specifically designed to minimize operator fatigue, maximize keyboard-driven transactional speed, and present complex multi-dimensional inventory data with zero latency.

### Core Business Capabilities:

- **Instantaneous Point of Sale:** Barcode-scanner-ready checkout modal alongside comprehensive manual billing.
- **Dynamic Carton/Loose Quantity Conversion:** Automatically calculates line totals, carton pack sizes, and loose piece quantities in real time.
- **Deep Financial Transparency:** Live calculations of gross profit, customer/supplier dues, discount structures, and multi-channel receipts.
- **Executive Decision Dashboards:** Interactive Stock Aging cards with custom day intervals, product velocity classification (Fast/Slow/Dead stock), and low-stock reorder warnings.
- **Enterprise ERP Styling:** High-contrast, dense tabular layouts with clear visual hierarchy, keyboard hotkey accessibility, and standardized confirmation dialogs.

---

## 🎨 User Interface & Theme Philosophy

Unlike typical minimalist generic templates, this application is styled with a purpose-built **Classic High-Contrast Enterprise Theme**:

- **Dense Data Display:** Maximizes vertical information density so store operators can see 20-30 line items without excessive scrolling.
- **Visual Alerting:** High-contrast status badges (e.g., Deep Crimson `#800000` for critical reorder warnings/dues and Forest Green `#006400` for active/paid balances).
- **Consistent Feedback Modal System:** Unified `<ConfirmDialog>` component for destructive and high-value operations with detailed bill-summary breakdowns before submission.
- **Non-blocking Toast Alerts:** Smooth, non-intrusive notifications powered by **Sonner**.

---

## 🧩 Key Modules & Feature Walkthrough

The frontend dashboard consists of **16 core operational routes**:

| Route Path    | Page Title                   | Primary Functionality                                                                                                                           |
| :------------ | :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`  | **Executive Overview**       | Real-time sales metrics, today's gross margin, low-stock alerts counter, and visual revenue charts.                                             |
| `/products`   | **Product Catalog**          | Product directory with instant SKU/Barcode search, category & company filters, and sale rate updater modal.                                     |
| `/sales`      | **Sales & Billing**          | Sales invoice list, invoice detail modal, thermal memo print layout, POS Barcode modal, and Manual Sale invoice generator.                      |
| `/purchases`  | **Purchases & Inward**       | Vendor purchase history, purchase invoice modal, auto carton/piece breakdown, and supplier balance sync.                                        |
| `/inventory`  | **Stock Management**         | Multi-warehouse stock level inspection, stock adjustment modal (`RESTOCK`, `DAMAGE`, `LOSS`, `CORRECTION`), and inter-warehouse stock transfer. |
| `/parties`    | **Customers & Suppliers**    | Directory of customers and suppliers, opening dues, credit limits, SR groups, and one-click access to detailed financial ledgers.               |
| `/payments`   | **Collections & Vouchers**   | Customer due collections and vendor disbursement vouchers with Cash, Bank, bKash, Nagad, and Cheque payment modes.                              |
| `/returns`    | **Sales & Purchase Returns** | Comprehensive return management with restock logic and Cash or Credit Adjustment options.                                                       |
| `/expenses`   | **Operational Expenses**     | Expense tracking by category (Rents, Salaries, Utilities, Logistics) with date range filters.                                                   |
| `/reports`    | **Analytics & Aging**        | Interactive 4-tab analytical suite: Stock Aging (custom day intervals), Product Velocity, Low Stock Reorder Alerts, and User Performance.       |
| `/warehouses` | **Warehouse Settings**       | Physical warehouse management, stock count per location, and default warehouse assignment.                                                      |
| `/categories` | **Category Setup**           | Catalog classification taxonomy management.                                                                                                     |
| `/companies`  | **Companies / Brands**       | Manufacturer registrations associated with product lines.                                                                                       |
| `/users`      | **User Administration**      | User accounts, approval pipeline (`PENDING` $\rightarrow$ `ACTIVE`), and warehouse role assignments.                                            |
| `/audit-logs` | **System Audit Trail**       | Security logs recording administrative modifications with actor, action, timestamp, and JSON metadata.                                          |
| `/profile`    | **User Profile**             | Operator credential management and secure password change modal.                                                                                |

---

## 💻 Tech Stack & Dependencies

- **Framework:** [Next.js](https://nextjs.org/) 14.2.15 (React App Router Architecture)
- **Library:** [React](https://react.dev/) 18.3.1
- **Language:** [TypeScript](https://www.typescriptlang.org/) 5.6.3
- **Styling Engine:** [Tailwind CSS](https://tailwindcss.com/) 3.4.14
- **CSS Utilities:** `clsx`, `tailwind-merge`, `class-variance-authority`
- **Icons:** [Lucide React](https://lucide.dev/) (Clean vector iconography)
- **Toast Notifications:** [Sonner](https://sonner.emilkowal.ski/) (Customizable stacked toast notifications)
- **Hosting Platform:** [Vercel](https://vercel.com/)

---

## 🏛 Architecture & Folder Structure

```
frontend/
├── public/                     # Static assets & icons
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/             # Authentication routes (Login)
│   │   ├── (dashboard)/        # Authenticated dashboard layouts and pages
│   │   │   ├── dashboard/      # Executive metrics overview
│   │   │   ├── products/       # Master product management
│   │   │   ├── sales/          # Invoices & POS
│   │   │   ├── purchases/      # Supplier purchase bills
│   │   │   ├── inventory/      # Warehouse balances & movements
│   │   │   ├── parties/        # Customer & supplier directory
│   │   │   ├── payments/       # Payment vouchers & collections
│   │   │   ├── returns/        # Sales & purchase returns
│   │   │   ├── reports/        # Stock aging, velocity & alerts
│   │   │   ├── expenses/       # Operational costs
│   │   │   ├── users/          # User administration
│   │   │   └── warehouses/     # Warehouse management
│   │   ├── globals.css         # Global Tailwind & ERP custom theme styles
│   │   └── layout.tsx          # Root HTML shell & toaster provider
│   ├── components/             # Reusable UI component library
│   │   ├── layout/             # Sidebar, Header, Breadcrumbs & User Menu
│   │   ├── products/           # Product modals, sale rate dialogs
│   │   ├── sales/              # Barcode POS modal, manual invoice modal
│   │   ├── purchases/          # Purchase entry modal
│   │   ├── reports/            # Stock aging modal, KPI summary cards
│   │   ├── ui/                 # ConfirmDialog, buttons, inputs, tables
│   │   └── ...
│   ├── lib/                    # Shared utilities & business logic
│   │   ├── api/                # ApiClient singleton & HTTP fetch wrappers
│   │   ├── stock-utils.ts      # Decimal stock & currency formatting helpers
│   │   └── utils.ts            # Tailwind class merger & math utilities
│   └── types/                  # TypeScript interface declarations
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🌐 API Client & Communication Layer

The frontend communicates with the backend through a centralized, type-safe HTTP client located at `src/lib/api/client.ts`:

- **Automatic Base URL Resolution:** Dynamically reads `process.env.NEXT_PUBLIC_API_URL` across Local, Preview, and Production environments.
- **Authentication Injection:** Automatically grabs the operator's JWT token from `localStorage` and injects the `Authorization: Bearer <TOKEN>` header.
- **Unified Error Handling:** Catches API error codes (`UNAUTHORIZED`, `NOT_FOUND`, `FORBIDDEN`) and formats error messages for seamless Sonner toast delivery.

---

## 🔐 Environment Variables

Create a `.env.local` file in the root of the `frontend` directory:

```env
# Backend API Base URL
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

### Environment URL Mappings:

| Environment           | Branch  | Value                                                      |
| :-------------------- | :------ | :--------------------------------------------------------- |
| **Local Development** | `local` | `http://localhost:5000/api`                                |
| **Dev / Preview**     | `dev`   | `https://inventory-backend-dev.vercel.app/api`             |
| **Production**        | `main`  | `https://inventory-backend-production-main.vercel.app/api` |

---

## 🛠 Installation & Local Development

### Prerequisites:

- **Node.js:** v20.x or v22.x
- Running instance of the **Backend API** (Local on port 5000 or remote)

### Setup Steps:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install all dependencies
npm install

# 3. Create .env.local file
cp .env.example .env.local

# 4. Start Next.js development server
npm run dev
```

The application will launch at: `http://localhost:3000`

---

## 🧪 Build, Quality Check & Testing

```bash
# Verify TypeScript typings across all routes
npx tsc --noEmit

# Test production build bundle (verifies all 22+ static/dynamic pages)
npm run build

# Run unit tests for utility functions
npm run test
```

---

## 🌐 Deployment Strategy (Vercel Prod vs Dev)

The frontend is deployed on **Vercel** with full GitHub CI/CD integration:

### 1. Production Environment (`main` Branch):

- **Live URL:** 👉 **[https://mr-enterprise-main.vercel.app](https://mr-enterprise-main.vercel.app)**
- **Connected Backend API:** `https://inventory-backend-production-main.vercel.app/api`
- **Connected Database:** Neon Production PostgreSQL (Real client data)
- **Deployment Trigger:** Merging and pushing code to the `main` branch.

### 2. Dev / Staging Environment (`dev` Branch):

- **Live URL:** 👉 **[https://mr-enterprise-dev.vercel.app](https://mr-enterprise-dev.vercel.app)**
- **Connected Backend API:** `https://inventory-backend-dev.vercel.app/api`
- **Connected Database:** Neon Dev PostgreSQL (Testing data)
- **Deployment Trigger:** Pushing new feature branches or commits directly to the `dev` branch.

---

## 💎 Component Architecture Standards

- **Standardized Confirmations:** All destructive and transactional actions (e.g., Saving Invoices, Resetting Rates, Deleting Records) use the shared `<ConfirmDialog>` component with explicit detail tables.
- **Numeric Precision:** All stock and monetary quantities are processed through `formatQty()` and `formatMoney()` to avoid JavaScript floating-point artifacts (e.g., `16.060000000002`).
- **Graceful Loading:** All asynchronous buttons feature `<Loader2>` spinners with disabled states to prevent double-submissions.

---

<br/>

## 🇧🇩 বাংলা ডকুমেন্টেশন (Bengali Documentation)

<details>
<summary><b>👉 সম্পূর্ণ বাংলা সংস্করণ পড়তে এখানে ক্লিক করুন / Click here to read in Bengali</b></summary>

<br/>

# 💻 এম.আর. এন্টারপ্রাইজ - ইনভেন্টরি ম্যানেজমেন্ট সিস্টেম (ফ্রন্টএন্ড অ্যাপ্লিকেশন)

এম.আর. এন্টারপ্রাইজ ইনভেন্টরি ম্যানেজমেন্ট ফ্রন্টএন্ড হলো একটি আধুনিক, দ্রুতগতির এবং রেস্পন্সিভ ERP ও পয়েন্ট-অব-সেল (POS) ড্যাশবোর্ড। এটি পাইকারি ও খুচরা বাণিজ্যিক প্রতিষ্ঠানের প্রতিদিনের হাজার হাজার পণ্যের কেনাবেচা, ওয়্যারহাউস স্টক ট্র্যাকিং, কাস্টমার ও সাপ্লায়ারদের বাকি-বকেয়া খতিয়ান এবং রিয়েল-টাইম এনালিটিক্স নির্ভুলভাবে পরিচালনার জন্য বিশেষভাবে তৈরি করা হয়েছে।

> 📖 **সুপার এডমিনদের জন্য বিশেষ গাইড:**  
> আপনি যদি কম্পিউটার ব্যবহারে নতুন হন বা প্রতিটি বাটন ও স্ক্রিনের সহজ বাংলা ব্যাখ্যা চান, তবে অনুগ্রহ করে আমাদের [**পূর্ণাঙ্গ বাংলা ইউজার গাইড (USER_GUIDE.md)**](./USER_GUIDE.md) পড়ুন।

---

### 📌 প্রধান ফিচার ও মডিউলসমূহ:

1. **ড্যাশবোর্ড ও রিয়েল-টাইম ম্যাট্রিক্স (`/dashboard`):** আজকের বিক্রয়, মোট লাভ (Gross Profit), মোট পণ্যের মূল্যায়ন এবং লো-স্টক সতর্কবার্তা এক নজরে দেখার ব্যবস্থা।
2. **প্রোডাক্ট ক্যাটালগ ও রেট আপডেট (`/products`):** বারকোড ও SKU দিয়ে দ্রুত পণ্য খোঁজা, ক্যাটাগরি ও কোম্পানি অনুযায়ী ফিল্টারিং এবং এক ক্লিকে বিক্রয় মূল্য (Sale Rate) আপডেট করার সুবিধা।
3. **সেলস ও সুপারফাস্ট পিওএস বিলিং (`/sales`):**
   - **বারকোড POS মোডাল:** খুচরা কাউন্টারে দ্রুত স্ক্যান করে সরাসরি ক্যাশ মেমো তৈরির সুবিধা।
   - **ম্যানুয়াল ইনভয়েস মোডাল:** কাস্টমার সিলেক্ট করে পণ্যের কার্টন ও লুজ পিস স্বয়ংক্রিয় হিসাব, ডিসকাউন্ট, নগদ প্রাপ্তি ও স্বয়ংক্রিয় বাকি হিসাব।
   - **প্রিন্ট মেমো:** স্ট্যান্ডার্ড A4 ও থার্মাল পিওএস প্রিন্টার সাপোর্টেড মেমো লেআউট।
4. **সাপ্লায়ার ক্রয় চালান (`/purchases`):** নতুন মালামাল ক্রয়ের ইনভয়েস এন্ট্রি, স্বয়ংক্রিয় গড় ক্রয়মূল্য নির্ধারণ এবং সাপ্লায়ারের বকেয়া ব্যালেন্স আপডেট।
5. **মাল্টি-ওয়্যারহাউস স্টক ব্যবস্থাপনা (`/inventory`):** একাধিক গুদামের মজুদ দেখা, গুদাম পরিবর্তন (Stock Transfer) এবং নষ্ট/হারানো পণ্যের হিসাব সমন্বয় (Stock Adjustment)।
6. **পার্টি লেজার ও কালেকশন (`/parties`, `/payments`):**
   - কাস্টমার ও সাপ্লায়ারদের যাবতীয় ইনভয়েস এবং পেমেন্টের পূর্ণাঙ্গ খতিয়ান (Ledger)।
   - এসআর (SR Group) অনুযায়ী বকেয়া ভাগ এবং আদায়।
   - ক্যাশ, ব্যাংক, বিকাশ, নগদ ও চেকের মাধ্যমে ভাউচার কালেকশন।
7. **রিটার্ন ব্যবস্থাপনা (`/returns`):** কাস্টমার পণ্য ফেরত দিলে তা গুদামে ফেরত নিয়ে ক্যাশ রিফান্ড বা বাকি সমন্বয় করার সহজ উপায়।
8. **এডভান্সড স্টক এনালাইটিক্স ও এজিং রিপোর্ট (`/reports`):**
   - **স্টক এজিং (Stock Aging):** কত দিনের অবিক্রিত স্টক জমে আছে তা কাস্টম দিন (যেমন: ০-৩০, ৩১-৬০, ৬১-৯০, ৯০+ দিন) অনুযায়ী ফিল্টার করে দেখা।
   - **প্রোডাক্ট ভেলোসিটি (Velocity):** ফাস্ট-মুভিং, মাঝারি এবং ডেড-স্টক (Dead Stock) পণ্য আলাদাভাবে চিহ্নিত করা।
   - **লো স্টক অ্যালার্ট:** পণ্য শেষ হয়ে যাওয়ার আগেই অটোমেটিক রি-অর্ডার ওয়ার্নিং এবং সাজেস্টেড পরিমাণের হিসাব।
9. **অপারেটর ও ভূমিকা নিয়ন্ত্রণ (`/users`):** সুপার এডমিন, এডমিন এবং ম্যানেজার লেভেলের ইউজার অনুমোদন ও পাসওয়ার্ড রিসেট।

---

### 💻 টেকনোলজি স্ট্যাক:

- **ফ্রেমওয়ার্ক:** Next.js 14.2 (App Router)
- **লাইব্রেরি:** React 18.3
- **ল্যাঙ্গুয়েজ:** TypeScript 5.6
- **স্টাইলিং:** Tailwind CSS 3.4
- **আইকন:** Lucide React
- **নোটিফিকেশন:** Sonner (Toast alerts)
- **হোস্টিং প্ল্যাটফর্ম:** Vercel

---

### ⚙️ এনভায়রনমেন্ট ভ্যারিয়েবল কনফিগারেশন (.env.local):

```env
# ব্যাকএন্ড এপিআই URL
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

---

### 🚀 লোকাল পিসিতে চালানোর নিয়মাবলী:

```bash
# ১. ফ্রন্টএন্ড ফোল্ডারে প্রবেশ করুন
cd frontend

# ২. ডিপেন্ডেন্সি ইনস্টল করুন
npm install

# ৩. লোকাল ডেভেলপমেন্ট সার্ভার চালু করুন
npm run dev
```

ব্রাউজারে ভিজিট করুন: `http://localhost:3000`

---

### 🌐 Vercel ক্লাউড ডেপ্লয়মেন্ট আর্কিটেকচার:

সিস্টেমটি দুটি পৃথক ক্লাউড পরিবেশে পরিচালিত হচ্ছে:

1. **প্রোডাকশন এনভায়রনমেন্ট (`main` ব্রাঞ্চ):**
   - লাইভ URL: 👉 **[https://mr-enterprise-main.vercel.app](https://mr-enterprise-main.vercel.app)**
   - সংযুক্ত ব্যাকএন্ড: `https://inventory-backend-production-main.vercel.app/api`
   - ডাটাবেজ: Neon Production DB (ক্লায়েন্টের আসল ডাটা)
2. **ডেভ / স্টেজিং এনভায়রনমেন্ট (`dev` ব্রাঞ্চ):**
   - লাইভ URL: 👉 **[https://mr-enterprise-dev.vercel.app](https://mr-enterprise-dev.vercel.app)**
   - সংযুক্ত ব্যাকএন্ড: `https://inventory-backend-dev.vercel.app/api`
   - ডাটাবেজ: Neon Dev DB (টেস্টিং ডাটা)

---

### 👨‍💻 লেখক ও রক্ষণাবেক্ষণ:

- **ডেভেলপার:** মো: ইসরাফিল হোসেন (Israfil Hossen)
- **লাইসেন্স:** ISC License

</details>
