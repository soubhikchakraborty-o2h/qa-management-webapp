# 🚀 Quality Analysis — Setup Guide
### Follow these steps IN ORDER. Do not skip ahead.

---

## STEP 1 — Supabase (Database Setup)
**Time: ~10 minutes**

1. Go to https://supabase.com and click **Start for Free**
2. Sign up with GitHub or email
3. Click **New Project** → give it a name like `qa-management` → choose a region → click **Create**
4. Wait ~2 minutes for it to set up
5. Go to **SQL Editor** (left sidebar, looks like `</>`)
6. Click **New query**
7. Open the file `supabase/schema.sql` from this project folder
8. Copy ALL the contents and paste into the SQL editor
9. Click **Run** (or Ctrl+Enter)
10. You should see "Success. No rows returned"

Now get your keys:
1. Go to **Settings** (gear icon, bottom left)
2. Click **API** in the left menu
3. Copy the **Project URL** — save it somewhere
4. Copy the **service_role** key (under "Project API keys") — save it somewhere

---

## STEP 2 — Backend Setup
**Time: ~5 minutes**

Open your terminal and run these commands ONE BY ONE:

```bash
# Navigate to the backend folder
cd path/to/qa-management/backend

# Install packages
npm install

# Create your .env file (copy the example)
cp .env.example .env
```

Now open the `.env` file and fill in your values:
```
PORT=5000
SUPABASE_URL=paste_your_project_url_here
SUPABASE_SERVICE_KEY=paste_your_service_role_key_here
JWT_SECRET=any_long_random_string_like_this_abc123xyz789
CLIENT_URL=http://localhost:5173
```

Then run the seed script to create your team:
```bash
npm run seed
```

You should see:
```
✅ Soubhik (admin)   → login: soubhik / soubhik@o2h
✅ Bhargav (qa_lead) → login: bhargav / bhargav@o2h
✅ Abhinav (qa_engineer) → ...
✅ Darshan (qa_engineer) → ...
✅ Ashok  (qa_engineer) → ...
```

---

## STEP 3 — Frontend Setup
**Time: ~3 minutes**

```bash
# Navigate to the frontend folder
cd path/to/qa-management/frontend

# Install packages
npm install

# Create your .env file
cp .env.example .env
```

The frontend `.env` only needs one line (already set for local):
```
VITE_API_URL=http://localhost:5000
```

---

## STEP 4 — Run Locally
**Time: ~1 minute**

Open TWO terminal windows:

**Terminal 1 (Backend):**
```bash
cd qa-management/backend
npm run dev
# Should say: 🚀 QA API running on port 5000
```

**Terminal 2 (Frontend):**
```bash
cd qa-management/frontend
npm run dev
# Should say: ➜ Local: http://localhost:5173
```

Open your browser at **http://localhost:5173** — your app is running!

---

## STEP 5 — Deploy to Vercel (Frontend)
**Time: ~5 minutes**

1. Go to https://vercel.com → Sign up with GitHub
2. Push your project to GitHub first:
   ```bash
   cd qa-management
   git init
   git add .
   git commit -m "Initial commit - Quality Analysis"
   git branch -M main
   # Create a repo on github.com first, then:
   git remote add origin https://github.com/YOUR_USERNAME/qa-management.git
   git push -u origin main
   ```
3. On Vercel → **Add New Project** → Import your GitHub repo
4. Set **Root Directory** to `frontend`
5. Add Environment Variable: `VITE_API_URL` = your Railway backend URL (get from Step 6)
6. Click **Deploy**

---

## STEP 6 — Deploy to Railway (Backend)
**Time: ~5 minutes**

1. Go to https://railway.app → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `qa-management` repo
4. Set **Root Directory** to `backend`
5. Add these Environment Variables in Railway dashboard:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```
6. Railway will give you a URL like `https://qa-management-production.up.railway.app`
7. Go back to Vercel and update `VITE_API_URL` to this Railway URL
8. Redeploy on Vercel

---

## STEP 7 — Backup Before Handing Laptop to IT

```bash
cd qa-management
git add .
git commit -m "Final build - pre IT handover"
git push origin main
```

That's it. Your code is safe on GitHub. Your app is live on Vercel + Railway + Supabase.
The IT team can take the laptop. Nothing is lost.

---

## Login Credentials (Default)

| Name    | Username | Password       | Role            |
|---------|----------|----------------|-----------------|
| Soubhik | soubhik  | soubhik@o2h    | Admin           |
| Bhargav | bhargav  | bhargav@o2h    | QA Lead         |
| Abhinav | abhinav  | abhinav@o2h    | QA Engineer     |
| Darshan | darshan  | darshan@o2h    | QA Engineer     |
| Ashok   | ashok    | ashok@o2h      | QA Engineer     |

**Change these passwords after first login!**
