# Setup Guide - Localhost & Ngrok

## Quick Start

### 1. Backend Setup

1. **Start MySQL** (if not running)
   ```bash
   # Make sure MySQL is running on localhost:3306
   # Database: mpps
   # Username: root
   # Password: root
   ```

2. **Start Backend**
   ```bash
   cd backend/backend
   ./mvnw spring-boot:run
   # or
   mvn spring-boot:run
   ```
   Backend runs on: `http://localhost:8080/api`

### 2. Frontend Setup

1. **Install dependencies** (first time only)
   ```bash
   cd frontend
   npm install
   ```

2. **Create environment file**
   ```bash
   # Create .env.development for localhost
   echo "VITE_API_BASE_URL=http://localhost:8080/api" > .env.development
   ```

3. **Start Frontend**
   ```bash
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

### 3. Using Ngrok (for mobile/external access)

#### Step 1: Install Ngrok
- Download from: https://ngrok.com/download
- Or use: `npm install -g ngrok`

#### Step 2: Start Backend
```bash
cd backend/backend
mvn spring-boot:run
```

#### Step 3: Expose Backend via Ngrok
```bash
ngrok http 8080
```

You'll get a URL like: `https://abc123.ngrok.io`

#### Step 4: Update Backend CORS
Edit `backend/backend/src/main/resources/application.properties`:

```properties
# Add your ngrok URL to allowed origins
app.cors.allowed-origins=http://localhost:5173,http://localhost:3000,https://abc123.ngrok.io
```

**Important:** Replace `abc123.ngrok.io` with your actual ngrok URL.

#### Step 5: Update Frontend Environment
Create or edit `frontend/.env.development`:

```env
VITE_API_BASE_URL=https://abc123.ngrok.io/api
```

**Important:** Replace `abc123.ngrok.io` with your actual ngrok URL.

#### Step 6: Restart Both Services
1. Restart backend (to pick up new CORS config)
2. Restart frontend (to pick up new API URL)

## Environment Files

### Frontend Environment Files

**`.env.development`** (for localhost):
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

**`.env.production`** (for ngrok/production):
```env
VITE_API_BASE_URL=https://your-ngrok-url.ngrok.io/api
```

**Note:** Vite uses `.env.development` when running `npm run dev` and `.env.production` when building for production.

### Backend Configuration

**`application.properties`**:
```properties
# CORS allowed origins (comma-separated)
app.cors.allowed-origins=http://localhost:5173,http://localhost:3000,https://your-ngrok-url.ngrok.io
```

## Troubleshooting

### CORS Errors
- Make sure your ngrok URL is added to `app.cors.allowed-origins` in `application.properties`
- Restart backend after changing CORS config
- Check browser console for exact CORS error

### Network Errors
- Verify backend is running: `http://localhost:8080/api/auth/login`
- Check `VITE_API_BASE_URL` in frontend `.env.development`
- Restart frontend after changing env file
- For ngrok: Make sure ngrok tunnel is active

### API Calls Not Working
- All components now use `apiFetch` from `src/api/client.js`
- Check browser Network tab to see actual request URL
- Verify JWT token is in localStorage (check DevTools → Application → Local Storage)

## API Base URL Format

**Important:** The API base URL should **always end with `/api`** because:
- Backend has `server.servlet.context-path=/api`
- All endpoints are under `/api/auth/**`, `/api/farms/**`, etc.

**Correct:**
- `http://localhost:8080/api`
- `https://abc123.ngrok.io/api`

**Wrong:**
- `http://localhost:8080` (missing `/api`)
- `https://abc123.ngrok.io` (missing `/api`)

## Testing

1. **Localhost Test:**
   - Backend: `http://localhost:8080/api`
   - Frontend: `http://localhost:5173`
   - Use `.env.development` with localhost URL

2. **Ngrok Test:**
   - Backend: `https://your-ngrok-url.ngrok.io/api`
   - Frontend: Can still be localhost or also exposed via ngrok
   - Update `.env.development` with ngrok URL
   - Update `application.properties` CORS with ngrok URL

## Components Using API

All components now use `apiFetch` from `src/api/client.js`:
- ✅ `Login.jsx` - uses `apiFetch("/auth/login")`
- ✅ `Register.jsx` - uses `apiFetch("/auth/register")`
- ✅ `YourFarms.jsx` - uses `apiFetch("/farms/owner/...")`
- ✅ `AddFarm.jsx` - uses `apiFetch("/farms")`
- ✅ `CattleList.jsx` - uses `apiFetch("/cattle/farm/...")`
- ✅ `AddCattle.jsx` - uses `apiFetch("/cattle")`

All API calls automatically include JWT token from localStorage.

