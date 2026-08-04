# 🎬 CineStream - Full-Stack Movie Advertising, Streaming & Download Platform

CineStream is a modern, high-performance web platform for showcasing/advertising movies, streaming films online in an embedded HTML5 video player, downloading movies directly to local machines, and managing content via a secure **Admin Dashboard**.

---

## 🌟 Key Features

1. **Public Visitor Access (No Login Required)**
   - **Spotlight Hero Banner**: Featured film slider with backdrop visuals, IMDb ratings, and fast action triggers.
   - **Movie Showcase Catalog**: Interactive responsive grid of movie cards with HD/4K quality badges, release years, and duration.
   - **Instant Search & Genre Filtering**: Live real-time search by title or keyword and genre pills (Action, Sci-Fi, Thriller, Drama, Animation, etc.).
   - **Online Video Player Modal**: Custom HTML5 video player modal with HTTP Range-based streaming support.
   - **Local Machine Download**: Direct download trigger saving movie files directly to the user's hard drive.

2. **Admin Dashboard & Management**
   - **Secured Admin Login**: Admin credentials protection (`admin` / `admin123` or custom `.env`).
   - **Publish New Movies**: Add new films with title, genre, IMDb rating, release year, duration, quality tag, synopsis, poster URL/file upload, and video stream URL/file upload.
   - **Edit & Update**: Modify any existing film details or feature status dynamically.
   - **Delete Films**: Remove obsolete movies from the database.
   - **Analytics Counters**: Real-time stats for Total Movies, Total Online Views, Total Downloads, and Database status.

3. **Backend & Database**
   - **Node.js + Express REST API**: Efficient server architecture.
   - **MySQL Integration**: `database/schema.sql` script with full MySQL table structures (`movies`, `categories`, `admins`).
   - **Dual Database Bridge**: Automatically connects to local MySQL service. If MySQL is offline during local development, the system seamlessly transitions to an internal storage engine so the app works 100% out of the box.

---

## 📁 Project Structure

```
├── config/
│   └── db.js                 # MySQL pool & storage engine bridge
├── database/
│   └── schema.sql            # Full MySQL database creation & seed script
├── middleware/
│   └── auth.js               # JWT Auth verification for Admin routes
├── public/
│   ├── index.html            # Main HTML layout, Hero, Modals, Admin Dashboard
│   ├── style.css             # Glassmorphism dark mode CSS design system
│   ├── app.js                # Frontend JS logic, video streaming & downloads
│   └── uploads/              # Local poster & video upload directory
├── routes/
│   ├── auth.js               # Admin authentication endpoints
│   └── movies.js             # Public API (catalog, stream, download) & Admin CRUD
├── .env                      # Environment variables (Port, MySQL credentials, JWT secret)
├── package.json              # Express, MySQL2, CORS, Multer, JWT dependencies
├── server.js                 # Express server entry point
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run the following command in the project directory:
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
Edit the `.env` file if you want to change MySQL credentials or Admin login details:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=cinestream_db

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=cinestream_super_secret_jwt_key_2026
```

### 3. Setup MySQL Database
Import the SQL schema into your MySQL server via MySQL Workbench or command line:
```bash
mysql -u root -p < database/schema.sql
```

### 4. Start the Application Server
Run the dev server:
```bash
npm run dev
```
Or start with node:
```bash
npm start
```

Open your browser and visit: **`http://localhost:5000`**

---

## ☁️ Deployment Guide

The app is a standard Node.js + Express application and runs on any Node ≥ 18 platform (Render, Railway, Heroku, Fly.io, VPS, etc.).

### 🚀 One-Click Deploy on Render (Blueprint)

The repo ships with a [`render.yaml`](./render.yaml) blueprint, so you don't need to configure anything manually:

1. Push this repo to GitHub (already done for `ezechieldalluwin/EZECHIE-123`).
2. Go to **https://dashboard.render.com/new/blueprint** and connect that GitHub repository.
3. Render detects `render.yaml` and asks you to fill in the **secret values** (admin password, JWT secret — the DB values are optional).
4. Click **Apply** and wait for the build. Your app is live at `https://cinestream.onrender.com`.

That's it — build command, start command, health check and free plan are all pre-configured.

### Manual Deploy

Still can deploy manually instead of using the blueprint — see below.

### Environment Variables (Production)

Create a `.env` file (see `.env.example`) or set these in your platform's dashboard:

| Variable | Description |
| :--- | :--- |
| `PORT` | Port the server listens on (most platforms inject this automatically) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL connection (optional — if offline, JSON fallback storage is used) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin login credentials |
| `JWT_SECRET` | Long random string used to sign admin session tokens |
| `CORS_ORIGIN` | Optional — restrict API origins to your domain, e.g. `https://yourdomain.com` |

### Node.js Platforms (Render / Railway / Heroku)

1. Push the project to a Git repository.
2. Create a new **Web Service**, set the **Start Command** to `npm start`, and the build command to `npm install`.
3. Set the environment variables listed above.
4. Deploy. The app serves the frontend and API from the same server, so no extra static hosting is needed.

### VPS / Docker

```bash
git clone <your-repo> && cd <your-repo>
npm ci --omit=dev
cp .env.example .env   # then edit values
npm start
```

Expose it with a reverse proxy (Caddy/Nginx) and HTTPS. For a single-port setup, no reverse proxy is strictly required.

### MySQL vs JSON Fallback

- If a reachable MySQL database is configured, the server auto-creates the `movies` table and seeds demo data.
- If MySQL is offline/unset, the app transparently uses `database/fallback_store.json` so it works out of the box.
- The DB mode is shown on the navbar and reported by `GET /api/health`.

### Production Security Checklist

- [ ] Set strong `ADMIN_PASSWORD` and a random `JWT_SECRET`
- [ ] Set `CORS_ORIGIN` to your domain
- [ ] Do **not** commit `.env` (already in `.gitignore`)
- [ ] Run `npm audit` and keep dependencies updated
- [ ] If exposing uploads publicly, ensure the `public/uploads/` folder is writable

---

## 🔑 Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

To log in:
1. Click the **Admin Login** button on the top navigation bar.
2. Enter the credentials above.
3. Scroll down to access the **Admin Dashboard** to add, edit, or delete movies.

---

## 📡 REST API Reference

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/movies` | `GET` | Public | List movies (supports `?search=`, `?genre=`, `?sort=`) |
| `/api/movies/:id` | `GET` | Public | Get movie details & increment views |
| `/api/movies/:id/stream` | `GET` | Public | HTML5 video stream with Range headers |
| `/api/movies/:id/download` | `GET` | Public | Direct file download to local machine |
| `/api/auth/admin-login` | `POST` | Public | Admin login authentication |
| `/api/movies` | `POST` | Admin | Publish new movie (accepts JSON / FormData files) |
| `/api/movies/:id` | `PUT` | Admin | Update existing movie details |
| `/api/movies/:id` | `DELETE` | Admin | Remove movie from platform |

---

## 🎨 Technology Stack

- **Backend**: Node.js, Express.js, JWT, Multer
- **Database**: MySQL (`mysql2/promise`)
- **Frontend**: HTML5, Vanilla CSS3 (Dark Glassmorphism UI), JavaScript (ES6+)
- **Fonts & Icons**: Google Fonts (Outfit & Inter), FontAwesome 6
