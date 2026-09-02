# SchemaMorph AI — Complete API Keys & Cloud Services Setup Guide

This guide provides step-by-step instructions on obtaining and setting up all required API keys, database instances (Supabase), and OAuth/Authentication services (Google Console & Firebase) **100% free of cost**.

---

## 📋 Overview of Environment Variables

| Variable Name | Purpose | Required? | Free Tier Available? |
|---|---|---|---|
| `GEMINI_API_KEY` | Powers AI cluster naming & query refactoring | **Yes** | ✅ Yes (Google AI Studio) |
| `SECRET_KEY` | Signs JWT session tokens for user authentication | **Yes** | ✅ Yes (Generated locally) |
| `DATABASE_URL` | Stores users, projects, schemas & analysis runs | **Yes** | ✅ Yes (SQLite or Supabase Postgres) |
| `GOOGLE_CLIENT_ID` | Allows users to sign in with Google (OAuth) | Optional | ✅ Yes (Google Cloud Console) |
| `FIREBASE_API_KEY` | Optional Firebase Auth / Social login integration | Optional | ✅ Yes (Firebase Console) |
| `ALLOWED_ORIGINS` | Restricts CORS requests to trusted frontends | **Yes** | ✅ Yes (Configured in `.env`) |

---

## 1. 🤖 How to Get a Free Gemini API Key

The SchemaMorph AI engine relies on **Gemini 1.5 Flash** for graph narration, microservice naming, and SQL query refactoring.

### Steps:
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Log in using any standard Google/Gmail account.
3. Click the **"Get API key"** button on the top left or top right.
4. Click **"Create API key in new project"** (or select an existing Google Cloud project).
5. Copy the generated string (starts with `AIzaSy...`).
6. Open your `.env` file and set:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualKeyHere
   ```

*Pricing: Free tier includes 15 Requests Per Minute (RPM) and 1,000,000 Tokens Per Minute (TPM), which is more than enough for development and demo use.*

---

## 2. 🔑 How to Generate a Secure JWT `SECRET_KEY`

Your backend uses JWT tokens to authenticate users. You need a strong, random 64-character secret key.

### Steps:
Open your terminal (in backend directory or standard command line) and run:

**Using Python:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**Using PowerShell (Windows):**
```powershell
[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
```

Copy the generated random hex string and set it in `.env`:
```env
SECRET_KEY=9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a
```

---

## 3. 🗄️ How to Set Up a Free Supabase PostgreSQL Database

While SchemaMorph AI defaults to local SQLite (`sqlite:///./schemamorph.db`), you can use a production-grade cloud PostgreSQL database hosted on **Supabase** for free.

### Steps:
1. Go to [Supabase.com](https://supabase.com/).
2. Click **"Start your project"** and sign up/log in with GitHub or Google.
3. Click **"New Project"** and select an organization.
4. Enter project details:
   - **Name**: `SchemaMorph-AI`
   - **Database Password**: Set a strong password (save this securely!).
   - **Region**: Choose the region closest to you.
5. Click **"Create new project"** and wait ~2 minutes for initialization.
6. Once ready, go to **Project Settings** (gear icon on bottom left) ➔ **Database**.
7. Scroll down to **Connection String** ➔ Select **URI** or **Transaction Pooler**.
8. Copy the connection URI:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
9. Replace `[YOUR-PASSWORD]` with the password you set in Step 4.
10. In your `.env` file, set:
    ```env
    DATABASE_URL=postgresql://postgres.abcdefghijk:MyPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
    ```

---

## 4. 🌐 How to Set Up Google OAuth / Google Sign-In

If you want users to log in directly using their Google accounts via Google Cloud Console:

### Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Log in and click **Select a Project** ➔ **New Project** (Name: `SchemaMorph-Auth`).
3. Navigate to **APIs & Services** ➔ **OAuth consent screen**:
   - Select **External** ➔ Click **Create**.
   - Fill in App Name (`SchemaMorph AI`), User support email, and Developer contact information.
   - Click **Save and Continue** through Scopes and Test Users.
4. Navigate to **APIs & Services** ➔ **Credentials**:
   - Click **+ CREATE CREDENTIALS** ➔ Select **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `SchemaMorph Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `http://localhost:5173/login`
     - `http://localhost:8000/api/v1/auth/google/callback`
5. Click **Create**.
6. Copy your **Client ID** and **Client Secret**.
7. In your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
   ```

---

## 5. 🔥 How to Set Up Firebase Authentication (Alternative)

If you prefer Firebase for managing users, Google OAuth, and social logins for free:

### Steps:
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (Name: `SchemaMorph-AI`) and complete creation.
3. In the project dashboard, click **Build** ➔ **Authentication**.
4. Click **Get Started**.
5. Under **Sign-in method**, enable:
   - **Email/Password**
   - **Google** (Enter project support email and save).
6. To connect the frontend:
   - Go to **Project Settings** (gear icon) ➔ **General**.
   - Under **Your apps**, click the Web icon (`</>`).
   - App nickname: `SchemaMorph Frontend` ➔ Click **Register app**.
   - Copy the `firebaseConfig` object values:
     ```env
     VITE_FIREBASE_API_KEY=AIzaSy...
     VITE_FIREBASE_AUTH_DOMAIN=schemamorph-ai.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=schemamorph-ai
     ```

---

## 📄 Complete Master `.env` Template

Create a file named `.env` in both your root directory and `backend/` directory with the following structure:

```env
# ── Application Environment ───────────────────────────────────────────────────
APP_ENV=development

# ── JWT Security Key ──────────────────────────────────────────────────────────
# Generated via: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=dev-secret-key-change-in-production-12345

# ── Database Connection ───────────────────────────────────────────────────────
# Option A: Local SQLite (Zero setup needed)
DATABASE_URL=sqlite:///./schemamorph.db

# Option B: Supabase PostgreSQL (Free Cloud DB)
# DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# ── Gemini AI Engine ──────────────────────────────────────────────────────────
# Get free key from: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# ── OAuth & Social Auth (Optional) ────────────────────────────────────────────
# GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your-google-client-secret

# ── CORS Settings ─────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost
```

---

## 🚀 Quick Verification Checklist

- [ ] `GEMINI_API_KEY` is added to `.env`.
- [ ] `SECRET_KEY` has been generated and set in `.env`.
- [ ] Backend reads `.env` on startup (`python run.py`).
- [ ] Supabase connection tested (if using PostgreSQL instead of SQLite).
