# 🛡️ Admin Dashboard - E-Ticketing & Public Service System (TN Alas Purwo)

[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.60-FF4154.svg)](https://tanstack.com/query)
[![Shadcn UI](https://img.shields.io/badge/Shadcn_UI-Radix_Primitives-000000.svg)](https://ui.shadcn.com/)

This repository contains the **Admin Web Dashboard & Operational Management System** for the Final Thesis Project: **E-Ticketing System, Public Complaint Service, and Customer Satisfaction Survey for Alas Purwo National Park (Balai Taman Nasional Alas Purwo - BTNAP)**.

Built using **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **Shadcn UI (Radix UI)**, **TanStack React Query**, **Recharts**, and integrated with **HTML5 QR Code Scanner** for live on-site ticket verification.

---

## 🔗 System Ecosystem & Related Repositories

This admin dashboard is part of a 3-tier multi-repository system:

- 🛡️ **[Admin Dashboard (`Skripsi-Admin`)](../Skripsi-Admin)** - Management web portal for administrative staff, POS ticketing, analytics & live QR gate scanning *(Current Repository)*.
- ⚙️ **[Backend RESTful API (`Skripsi-Backend`)](../Skripsi-Backend)** - Core API server, database ORM, payment webhooks & business logic.
- 🌐 **[Visitor Portal (`Skripsi-visitors`)](../Skripsi-visitors)** - Mobile-first visitor web app for ticket booking, SKM surveys, complaints & WBS.

---

## 📌 Key Features & Modules

### 📊 1. Dashboard & Analytics
- **Real-Time Revenue & Visitor Metrics**: Overview of total income, ticket counts, and visitor volume.
- **Data Visualizations**: Dynamic charts (Recharts) displaying monthly revenue trends, visitor demographic breakdowns, and popular entrance gates.

### 🎟️ 2. Booking Operations & On-Site Ticketing
- **Online Booking Management**: Search, filter, inspect visitor leader details, and verify transaction statuses.
- **On-Site Offline Booking**: Module for gate staff to sell and print walk-in tickets directly for visitors purchasing at the counter.
- **Live QR Code Scanner**: Integrated camera-based QR code scanner (`html5-qrcode`) for quick ticket validation and entry check-in.

### 🛠️ 3. Master Data Management
- **Gate Management**: CRUD operations for entrance gates (Rowobendo, Trianggulasi, etc.), locations, and cover images.
- **Destination Management**: CRUD for park attractions, descriptions, facilities, and features.
- **Visitor Category Management**: Configure ticket pricing categories (Domestic, Foreign, Students).
- **Day Type Management**: Manage pricing rules for Weekdays, Weekends, and National Holidays.
- **Ticket Price Matrix**: Dynamic configuration mapping Gates + Visitor Categories + Day Types to prices.
- **User & Access Management**: Manage administrative users and roles.

### 📰 4. Content Management System (CMS)
- **News & Announcement Management**: Create, edit, and publish articles with cover image upload and status handling (Draft, Published, Archived).
- **Events & Activity Management**: Manage upcoming events, schedules, and venues within the national park.

### 📋 5. Public Service & Complaint Administration
- **SKM (Survei Kepuasan Masyarakat)**: View survey analytics, demographic distribution, and feedback scores based on PermenPAN-RB standards.
- **Public Complaint Management (Pelaporan)**: Review incoming complaints, filter by priority/type, assign staff response, and update progress status.
- **Whistleblowing System (WBS)**: Manage sensitive anonymous 5W1H reports, review uploaded media evidence, add internal investigation notes, and update case statuses.

---

## 🛠️ Tech Stack & Dependencies

| Layer / Component | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 (TypeScript) |
| **Build Tool & Dev Server** | Vite (v5.4) |
| **Routing** | Wouter (v3.3) |
| **Data Fetching & Caching** | TanStack React Query (v5.60) |
| **UI Components & Styling** | Tailwind CSS, Shadcn UI (Radix UI Primitives), Lucide Icons, Framer Motion |
| **Form Handling & Validation** | React Hook Form, Zod, `@hookform/resolvers` |
| **Data Visualizations** | Recharts |
| **QR Code Verification** | `html5-qrcode` (Webcam camera integration) |
| **Data Tables** | `@tanstack/react-table` |

---

## 📂 Directory Structure

```
Skripsi-Admin/
├── client/
│   ├── src/
│   │   ├── assets/           # Logos, Static Media & Graphical Assets
│   │   ├── components/       # Reusable UI & Layout Components (Shadcn UI, AdminLayout)
│   │   ├── hooks/            # Custom React Hooks (Toast, Mobile detection, etc.)
│   │   ├── lib/              # API Client (Axios/Fetch), QueryClient & Utility Helpers
│   │   ├── pages/            # Application Pages & Feature Modules
│   │   │   ├── Auth/         # Login Page
│   │   │   ├── Main/         # Dashboard, Destinations, News, Events & Booking Sub-modules
│   │   │   │   └── Booking/  # Online Bookings, On-site Booking & QR Scanner
│   │   │   ├── MasterData/   # Day Types, Gates, Ticket Prices, Users & Visitor Categories
│   │   │   ├── Survey/       # SKM Survey, Public Complaints & WBS Cases
│   │   │   └── Utils/        # 404 & Utility Views
│   │   ├── App.tsx           # Router Configuration & Auth Guard
│   │   ├── index.css         # Global Styles & Tailwind Directives
│   │   └── main.tsx          # React Root Mount
│   └── index.html            # Application HTML Entry
├── .env.example              # Environment Variables Template
├── components.json           # Shadcn UI Configuration
├── package.json
├── tailwind.config.ts        # Tailwind CSS Configuration
├── tsconfig.json
└── vite.config.ts            # Vite Configuration & Proxy Setup
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Node.js** (v18 LTS or higher)
- **npm** or **yarn**
- Running instance of **Skripsi-Backend** (REST API)

### 2. Clone & Install Dependencies
```bash
# Navigate to the admin workspace
cd Skripsi-Admin

# Install dependencies
npm install
```

### 3. Environment Variables Setup
Create a `.env` file in the root directory (refer to `.env.example`):

```env
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 🚀 Running the Application

### Development Mode
```bash
# Start local development server on port 3001
npm run dev

# (Optional) Run accessible on local network (for mobile/tablet QR testing)
npm run dev:network
```
The dashboard will be accessible at `http://localhost:3001`.

### Production Build
```bash
# Compile and build bundle
npm run build
```

---

## 📄 License & Credits

Developed as part of the **Final Thesis Project (Tugas Akhir Skripsi)** in collaboration with **Balai Taman Nasional Alas Purwo (BTNAP)**.
