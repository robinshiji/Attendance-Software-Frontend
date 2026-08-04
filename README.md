# Sunday School Attendance Portal - Frontend

A fully responsive, production-ready React client built with TypeScript, Vite, Tailwind CSS, and Lucide React. It communicates with the Django REST Framework backend to track, log, and report student attendances.

## Completed Modules

### 1. Authentication & Security
- **Smart Role-Based Login**: Redirects automatically based on user role (`admin` or `teacher`) returned by JWT response.
- **Route Guards**: Secure route protection utilizing `ProtectedRoute.tsx`.
- **State Storage**: Local storage tracking of access tokens, names, and assigned classroom IDs.

### 2. Admin Panel
- **Stats Dashboard**: Cards tracking Total Students, Teachers, Classrooms, and Today's Attendance Rates, plus live classroom submission states.
- **Student Roster Management**: Full CRUD modals (responsive 1 & 2 column inputs) and live query filters.
- **Teacher & Classrooms**: CRUD modals to assign teachers to classrooms, manage credentials, and toggle profile statuses.
- **Academic Years**: Module to manage academic sessions, allowing only one session to be marked active.
- **CSV Exporter**: Generate dynamically filtered Daily, Weekly, Monthly, and Classwise reports with click-to-download CSV compatibility.

### 3. Teacher Workspace
- **Dynamic Check-in Cards**: Single-tap check-in buttons (`Present` / `Absent`) with batch submission.
- **Dashboard Summary**: Real-time roll-call status check and total counts.
- **Attendance Ledger**: Historical registry logs querying previous check-ins by date and query parameters.

### 4. Responsive UI/UX
- **Slide-out Navigation Drawer**: Mobile-adaptive toggle drawer menu under screens `< lg` (1024px).
- **Adaptive Spacing**: Responsive view padding and grid containers.

---

## Getting Started

### Installation
1. Install project dependencies:
   ```bash
   npm install
   ```
2. Run the development server locally:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
