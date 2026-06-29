# Digital KYC Verification Platform 🛡️

A secure, automated Identity Verification platform that utilizes AI-powered OCR to extract data from government-issued IDs, performs background fraud analysis, and streamlines the KYC (Know Your Customer) onboarding process.

---

## 🌟 Key Features
- **AI-Powered OCR**: Automatically extracts text, names, dates, and ID numbers using Google Gemini Vision AI.
- **Fraud Engine Algorithms**: Detects name mismatches, duplicate documents, and suspicious AI confidence scores.
- **Background Processing**: Uses BullMQ & Redis to process heavy AI tasks in the background without blocking the user interface.
- **Automated Workflows**: Auto-approves valid documents or dynamically flags suspicious uploads for manual administrative review.
- **Admin Dashboard**: Full administrative capabilities to review flagged documents, override decisions, and audit verification history.
- **Email Notifications**: Asynchronous email delivery (via Resend) to inform users of their KYC status updates.

---

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework**: React 18 & Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **State & Routing**: React Router DOM
- **Network**: Axios
- **Deployment**: Vercel

### Backend (Server)
- **Framework**: Node.js & Express
- **Database**: PostgreSQL (pg)
- **Cache & Message Broker**: Redis (ioredis)
- **Background Jobs**: BullMQ (Web & Worker running concurrently)
- **AI Integration**: Google Generative AI (Gemini 1.5 Flash)
- **Authentication**: JSON Web Tokens (JWT), bcrypt
- **Deployment**: Render (100% Free Tier Architecture)

---

## 🚀 CI/CD Pipeline

This project includes a fully automated Continuous Integration and Continuous Deployment pipeline configured via **GitHub Actions**.

- **Workflow File**: `.github/workflows/ci.yml`
- **Triggers**: On every push or pull request to the `main` branch.
- **Actions Performed**:
  - Checks out the repository.
  - Installs Node.js dependencies for both frontend and backend.
  - Runs unit tests and linter checks (if configured).
  - Validates the Docker configurations.
- **Deployments**: Vercel and Render automatically trigger zero-downtime production deployments upon successful merges to the `main` branch.

---

## 🌍 Production Deployments

The platform is designed to be hosted for free using modern cloud infrastructure.

### Backend Setup (Render)
The backend is completely automated via a Render Blueprint (`render.yaml`).
1. Connect your GitHub repository to Render.
2. Select **New > Blueprint**.
3. Render will automatically spin up:
   - A **PostgreSQL** Database.
   - A **Redis** Cache.
   - A **Web Service** (combining the Express API Server and BullMQ Background Workers concurrently to bypass paid tier restrictions).
4. Required Environment Variables: `CLIENT_URL`, `GEMINI_API_KEY`.

### Frontend Setup (Vercel)
The frontend is hosted globally on Vercel's Edge Network.
1. Import the repository into Vercel.
2. Set the Root Directory to `client`.
3. Add the `VITE_API_URL` environment variable pointing to your Render backend URL (e.g., `https://verifyflow-api.onrender.com/api`).
4. Deploy!

---

## 💻 Local Development

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Running on localhost:5432)
- Redis (Running on localhost:6379)

### 1. Database Setup
Create a PostgreSQL database and user:
```sql
CREATE DATABASE verifyflow;
CREATE USER verifyflow WITH PASSWORD 'verifyflow_secret';
GRANT ALL PRIVILEGES ON DATABASE verifyflow TO verifyflow;
```

### 2. Environment Variables
Create a `.env` file in the `server` directory and copy the contents of `.env.example` (or configure your own). You must provide a valid `GEMINI_API_KEY`.

### 3. Start the Backend
```bash
cd server
npm install
npm run migrate
npm run dev
```

### 4. Start the Frontend
In a new terminal:
```bash
cd client
npm install
npm run dev
```

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
