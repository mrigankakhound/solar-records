# DRT Enterprise Solar Installation Record Management System

A full-stack web application for managing PM Surya Ghar solar installation records, built with React (Vite), Node.js (Express), MongoDB Atlas, and Cloudinary.

---

## Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Project Structure](#project-structure)
5. [MongoDB Atlas Setup](#mongodb-atlas-setup)
6. [Cloudinary Setup](#cloudinary-setup)
7. [Admin Setup](#admin-setup)
8. [Local Development](#local-development)
9. [Deployment](#deployment)
10. [Environment Variables Reference](#environment-variables-reference)
11. [Troubleshooting](#troubleshooting)

---

## Features
- **Consumer Registration Form** — 3-section form for entering consumer info, installation details, and uploading 4 mandatory + 1 optional photograph
- **Cloudinary Photo Storage** — All images stored securely in Cloudinary; no files saved locally
- **MongoDB Atlas** — Persistent data storage with proper indexing
- **Admin Dashboard** — Protected admin portal with search, pagination, stats
- **Full CRUD** — View, edit, delete records with photograph management
- **PDF Generation** — Professional 3-page A4 PDF with header/footer on every page
- **JWT Authentication** — Secure admin login with bcrypt hashed passwords

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Bootstrap 5, React Router 6, Axios |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB Atlas |
| Images | Cloudinary |
| PDF | PDFKit |
| Auth | JWT, bcryptjs |

---

## Prerequisites
- Node.js v18 or later
- npm v8 or later
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

---

## Project Structure
```
solar-records/
├── backend/
│   ├── assets/             ← Place pm.png and DRT.png here for PDF logos
│   ├── src/
│   │   ├── config/         ← database.js, cloudinary.js
│   │   ├── controllers/    ← authController.js, recordsController.js
│   │   ├── middleware/     ← auth.js, upload.js
│   │   ├── models/         ← ConsumerRecord.js
│   │   ├── routes/         ← auth.js, records.js
│   │   ├── scripts/        ← createAdmin.js
│   │   ├── utils/          ← pdfGenerator.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── assets/         ← Place pm.png and DRT.png here for web display
│   ├── src/
│   │   ├── components/     ← Navbar.jsx, PhotoUploadField.jsx
│   │   ├── context/        ← AuthContext.jsx
│   │   ├── pages/          ← ConsumerForm, AdminLogin, AdminDashboard, RecordDetails, EditRecord
│   │   ├── services/       ← api.js (Axios instance)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## MongoDB Atlas Setup

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new **free tier** cluster (M0)
3. In **Database Access**, create a database user with a strong password
4. In **Network Access**, add your IP address (or `0.0.0.0/0` for development)
5. Click **Connect → Connect your application**
6. Copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
7. In `backend/.env`, set:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/drt_solar_records?retryWrites=true&w=majority
   ```
   > ⚠️ The database `drt_solar_records` will be created automatically on first record submission.

---

## Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. From the **Dashboard**, copy:
   - Cloud Name
   - API Key
   - API Secret
3. In `backend/.env`, set:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
   > Images will be uploaded to the `drt-solar-records/` folder in your Cloudinary media library.

---

## Admin Setup

The admin account uses credentials stored in environment variables. There is **no public registration**.

### Generate password hash:
```bash
cd backend
npm run create-admin
```
Enter your desired admin password when prompted. Copy the printed `ADMIN_PASSWORD_HASH` into `backend/.env`.

Also set `ADMIN_USERNAME` in `backend/.env`.

### Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output as `JWT_SECRET` in `backend/.env`.

---

## Local Development

### 1. Clone and install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set up environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your real credentials

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env if your backend runs on a different port
```

### 3. Add logo assets

Place your logo files in **both** locations:
- `backend/assets/pm.png` — used by PDF generator
- `backend/assets/DRT.png` — used by PDF generator
- `frontend/public/assets/pm.png` — used by web interface
- `frontend/public/assets/DRT.png` — used by web interface

### 4. Run the application

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### 5. Access the application
- **Consumer Form:** `http://localhost:5173/`
- **Admin Login:** `http://localhost:5173/admin/login`
- **API Health:** `http://localhost:5000/health`

---

## Logo Assets

> **Important:** The PDF generator looks for logos in `backend/assets/pm.png` and `backend/assets/DRT.png`.
> The web interface looks for them in `frontend/public/assets/pm.png` and `frontend/public/assets/DRT.png`.
>
> If logos are missing, the system will still work but the PDF header will be text-only.

---

## Deployment

### Frontend → Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Set **Root Directory** to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy

### Backend → Render

1. Go to [render.com](https://render.com) and create a **Web Service**
2. Connect your GitHub repository
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add all environment variables from `backend/.env`
5. Deploy

### Post-Deployment

- Update `backend/.env` `CLIENT_URL` with your Vercel frontend URL
- Update `frontend/.env` `VITE_API_URL` with your Render backend URL

---

## Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description |
|---------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `JWT_SECRET` | Long random string for JWT signing |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password |
| `CLIENT_URL` | Frontend URL for CORS |
| `NODE_ENV` | `development` or `production` |

### Frontend (`frontend/.env`)
| Variable | Description |
|---------|-------------|
| `VITE_API_URL` | Backend API base URL |

---

## Troubleshooting

### MongoDB connection fails
- Check that your IP is whitelisted in Atlas Network Access
- Verify the connection string format — ensure password special characters are URL-encoded
- Check that the database user has `readWrite` permissions

### Images not uploading
- Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in backend `.env`
- Check file size — maximum 10MB per image
- Check file format — only JPG, PNG, WebP accepted

### PDF logos missing
- Place `pm.png` and `DRT.png` in `backend/assets/`
- The PDF generator will warn in the server console if logos are missing

### CORS errors in browser
- Ensure `CLIENT_URL` in backend `.env` matches your frontend URL exactly (including protocol and port)
- In production, update `CLIENT_URL` to your Vercel deployment URL

### Admin login fails
- Re-run `npm run create-admin` to regenerate the password hash
- Ensure `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` are correctly set in `backend/.env`
- Check that `JWT_SECRET` is set

### PDF generation slow
- Images are fetched from Cloudinary during PDF generation — this may take a few seconds
- Ensure the backend server has internet access
