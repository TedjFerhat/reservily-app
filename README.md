# 🏥 Reservily — Medical Appointment Booking Platform

A production-ready SaaS backend for medical appointment booking.  
Doctors subscribe via manual bank transfer. Patients book appointments for free.

---

## ✨ Features

### Patients
- Register / login with JWT
- Search doctors by specialty and city
- View doctor profiles and availability
- Book, view, and cancel appointments

### Doctors
- Register with profile (specialty, city, price, experience)
- Submit bank transfer proof to activate monthly subscription
- Manage weekly availability schedule
- Approve or reject incoming appointment requests

### Admin
- Dashboard stats (users, active doctors, pending payments)
- View, suspend, and reactivate any user
- Review payment proof submissions and activate subscriptions
- Oversee all appointments platform-wide

---

## 🛠 Tech Stack

| Layer          | Technology                |
|----------------|---------------------------|
| Runtime        | Node.js                   |
| Framework      | Express.js                |
| Database       | PostgreSQL                |
| ORM            | Prisma                    |
| Auth           | JWT (jsonwebtoken)        |
| Passwords      | bcryptjs                  |
| Validation     | Joi                       |
| Payments       | Manual bank transfer flow |
| Environment    | dotenv                    |
| Architecture   | MVC                       |

---

## 📁 Folder Structure

```
reservily/
└── backend/
    ├── prisma/
    │   └── schema.prisma          # Database models
    ├── src/
    │   ├── config/
    │   │   └── db.js              # Prisma client singleton
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   ├── doctorController.js
    │   │   ├── patientController.js
    │   │   ├── appointmentController.js
    │   │   └── adminController.js
    │   ├── middlewares/
    │   │   ├── authMiddleware.js  # JWT verification
    │   │   ├── roleMiddleware.js  # Role-based access + subscription check
    │   │   └── errorMiddleware.js # Central error handler + asyncHandler
    │   ├── routes/
    │   │   ├── authRoutes.js
    │   │   ├── doctorRoutes.js
    │   │   ├── patientRoutes.js
    │   │   ├── appointmentRoutes.js
    │   │   └── adminRoutes.js
    │   ├── services/
    │   │   ├── stripeService.js   # Payment utility helpers
    │   │   └── emailService.js    # Email notification stubs
    │   ├── utils/
    │   │   └── generateToken.js
    │   ├── app.js                 # Express app setup
    │   └── server.js              # Entry point
    ├── .env.example
    └── package.json
```

---

## ⚙️ Installation

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd reservily/backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/reservily"
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d

BANK_NAME=Your Bank Name
BANK_ACCOUNT_NUMBER=1234567890
BANK_ACCOUNT_HOLDER=Reservily Platform
BANK_ROUTING_NUMBER=000000000
SUBSCRIPTION_MONTHLY_PRICE=29.99
```

### 3. Setup PostgreSQL

**Install PostgreSQL** (if not installed):
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt install postgresql`
- Windows: https://www.postgresql.org/download/

**Create the database:**
```sql
psql -U postgres
CREATE DATABASE reservily;
\q
```

Update `DATABASE_URL` in `.env` to match your credentials.

### 4. Run Prisma Migration

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. (Optional) Seed an Admin User

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function seed() {
  const hashed = await bcrypt.hash('admin123456', 12);
  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@reservily.com', password: hashed, role: 'ADMIN' }
  });
  console.log('Admin created: admin@reservily.com / admin123456');
  await prisma.\$disconnect();
}
seed();
"
```

### 6. Start the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:5000`  
Health check: `http://localhost:5000/health`

---

## 💳 Payment Flow (Manual Bank Transfer)

1. **Doctor registers** → Receives bank account details in the API response
2. **Doctor transfers** the monthly fee to the provided bank account
3. **Doctor submits proof** via `POST /api/doctors/payment-proof` with:
   - Reference number from their bank transfer
   - URL to uploaded proof image
   - Amount transferred
4. **Admin reviews** the submission at `GET /api/admin/payment-submissions`
5. **Admin verifies** via `POST /api/admin/payment-submissions/:id/verify`
6. **Doctor's subscription** is activated for the specified number of months

---

## 📡 API Endpoints

### Auth — `/api/auth`

| Method | Endpoint           | Access  | Description              |
|--------|--------------------|---------|--------------------------|
| POST   | `/register`        | Public  | Register doctor/patient  |
| POST   | `/login`           | Public  | Login, returns JWT       |
| GET    | `/me`              | Private | Get current user info    |
| PUT    | `/change-password` | Private | Change password          |

### Doctors — `/api/doctors`

| Method | Endpoint                      | Access              | Description                        |
|--------|-------------------------------|---------------------|------------------------------------|
| GET    | `/`                           | Public              | Search/list active doctors         |
| GET    | `/:id`                        | Public              | Get doctor profile                 |
| PUT    | `/profile`                    | Doctor              | Update own profile                 |
| GET    | `/me/subscription`            | Doctor              | View subscription info + bank details |
| POST   | `/payment-proof`              | Doctor              | Submit bank transfer proof         |
| GET    | `/me/availability`            | Doctor (active)     | View own availability              |
| POST   | `/availability`               | Doctor (active)     | Set/update availability for a day  |
| DELETE | `/availability/:dayOfWeek`    | Doctor (active)     | Remove availability for a day      |
| GET    | `/me/appointments`            | Doctor (active)     | View own appointments              |

### Patients — `/api/patients`

| Method | Endpoint       | Access  | Description           |
|--------|----------------|---------|-----------------------|
| GET    | `/profile`     | Patient | View own profile      |
| PUT    | `/profile`     | Patient | Update own profile    |
| GET    | `/appointments`| Patient | View own appointments |

### Appointments — `/api/appointments`

| Method | Endpoint          | Access          | Description                    |
|--------|-------------------|-----------------|--------------------------------|
| POST   | `/`               | Patient         | Book an appointment            |
| GET    | `/:id`            | Patient/Doctor/Admin | View appointment details  |
| PATCH  | `/:id/cancel`     | Patient         | Cancel an appointment          |
| PATCH  | `/:id/approve`    | Doctor (active) | Approve a pending appointment  |
| PATCH  | `/:id/reject`     | Doctor (active) | Reject a pending appointment   |

### Admin — `/api/admin`

| Method | Endpoint                             | Access | Description                      |
|--------|--------------------------------------|--------|----------------------------------|
| GET    | `/stats`                             | Admin  | Platform statistics              |
| GET    | `/users`                             | Admin  | List all users                   |
| GET    | `/users/:id`                         | Admin  | Get user details                 |
| PATCH  | `/users/:id/suspend`                 | Admin  | Suspend a user                   |
| PATCH  | `/users/:id/activate`                | Admin  | Reactivate a user                |
| GET    | `/payment-submissions`               | Admin  | List payment proof submissions   |
| POST   | `/payment-submissions/:id/verify`    | Admin  | Verify payment & activate doctor |
| POST   | `/payment-submissions/:id/reject`    | Admin  | Reject a payment submission      |
| GET    | `/appointments`                      | Admin  | View all appointments            |

---

## 🔒 Authentication

All protected routes require the following header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🗃️ Database Models

| Model               | Description                              |
|---------------------|------------------------------------------|
| `User`              | All users (admin, doctor, patient)       |
| `DoctorProfile`     | Doctor details, subscription info        |
| `Availability`      | Doctor's weekly schedule                 |
| `Appointment`       | Bookings between patients and doctors    |
| `PaymentSubmission` | Bank transfer proof records for admin    |

---

## 🧪 Example Requests

**Register a doctor:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Johnson",
    "email": "sarah@example.com",
    "password": "securepass123",
    "role": "DOCTOR",
    "specialty": "Cardiology",
    "city": "New York",
    "clinicAddress": "123 Medical Ave",
    "price": 150,
    "experience": 10
  }'
```

**Book an appointment:**
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer <patient_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "<doctor_profile_id>",
    "date": "2026-03-15",
    "time": "10:00",
    "notes": "Regular checkup"
  }'
```

---

## 🛡 Security

- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens expire in 7 days (configurable)
- Role-based access control on every protected route
- Subscription guard prevents inactive doctors from accepting appointments
- Admin cannot be suspended through the API