# Tzelem Monorepo Deployment Guide

This guide covers deploying the Tzelem monorepo to Vercel.

## Structure

```
tzelem/
├── frontend/app/          # Vite React frontend
├── backend/              # FastAPI backend
├── api/                  # Vercel serverless functions
├── vercel.json          # Vercel configuration
└── package.json         # Root monorepo configuration
```

## Vercel Deployment Setup

### 1. Project Configuration

In your Vercel dashboard:

1. **Import your repository**
2. **Configure the project settings:**
   - **Framework Preset**: Vite
   - **Root Directory**: Leave empty (monorepo root)
   - **Build Command**: `npm run build:frontend` 
   - **Output Directory**: `frontend/app/dist`
   - **Install Command**: `npm install && npm run install:frontend`

### 2. Environment Variables

Set these environment variables in Vercel:

**Required:**
- `DAILY_API_KEY` - Your Daily.co API key
- `DEBUG` - Set to `false` for production

**Optional:**
- `DAILY_API_URL` - Daily.co API endpoint (defaults to https://api.daily.co/v1)

### 3. Domain Configuration

The deployment supports:
- **Frontend**: Served from root domain (`/`)
- **Backend API**: Served from `/api/*` routes

### 4. CORS Configuration

The backend is configured to allow requests from:
- `localhost:5173` (Vite dev server)
- `localhost:3000` (alternative dev port)
- `*.vercel.app` (Vercel deployments)
- Your production domains

Update `backend/core/config.py` to add your specific production domains.

## Local Development

### Prerequisites
- Node.js 18+ 
- Python 3.11+
- npm 8+

### Setup

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start frontend development server:**
   ```bash
   npm run dev:frontend
   ```

3. **Start backend development server:**
   ```bash
   npm run dev:backend
   ```

### Available Scripts

- `npm run dev:frontend` - Start Vite dev server
- `npm run dev:backend` - Start FastAPI dev server
- `npm run build:frontend` - Build frontend for production
- `npm run install:all` - Install all dependencies
- `npm run test:frontend` - Run frontend tests
- `npm run test:backend` - Run backend tests

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure all Python dependencies are listed in `backend/requirements.txt`

2. **CORS Issues**: Check that your frontend domain is listed in `backend/core/config.py`

3. **Build Failures**: Ensure Node.js version matches `frontend/app/package.json` engines

4. **API Routes Not Working**: Verify the API routing in `vercel.json` and `api/index.py`

### Vercel Logs

Check the Vercel function logs for detailed error information:
1. Go to your Vercel dashboard
2. Select your project
3. Go to the "Functions" tab
4. Click on the function to see logs

## File Structure Details

### Key Files

- **`vercel.json`**: Vercel configuration for monorepo deployment
- **`api/index.py`**: Serverless function entry point for FastAPI
- **`backend/main.py`**: FastAPI application
- **`frontend/app/package.json`**: Frontend dependencies and scripts
- **`.vercelignore`**: Files to exclude from deployment

### API Routes

All backend routes are automatically proxied:
- `GET /api/` → Backend root endpoint
- `GET /api/health` → Health check
- `POST /api/flows` → Flow management
- `POST /api/mail` → Email functionality
- `POST /api/voice` → Voice features
- `POST /api/runs` → Execution management

## Performance Optimization

1. **Function Timeout**: Set to 30 seconds for long-running operations
2. **Bundle Size**: Frontend assets are optimized by Vite
3. **Cold Starts**: FastAPI app is cached between requests
4. **CORS**: Configured for optimal performance

## Security

1. **Environment Variables**: Stored securely in Vercel
2. **CORS**: Restricted to specific domains
3. **API Routes**: Protected by FastAPI middleware
4. **File Exclusions**: Development files excluded via `.vercelignore`
