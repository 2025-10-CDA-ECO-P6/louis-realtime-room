
# Louis Realtime Room

Louis Realtime Room is a production-ready project featuring a real-time web frontend and an Express.js backend. Both the frontend (`web/`) and backend (`api/`) are containerized and deployed automatically on Render with every commit or pull request to the main branch.

## Features
- Real-time web application (frontend in React)
- RESTful API backend (Express.js)
- Dockerized for easy deployment and local development
- Continuous deployment to Render

## Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (for local development)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/louis-realtime-room.git
cd louis-realtime-room
```

### 2. Install dependencies (for local development)
```bash
pnpm install
```

### 3. Running with Docker Compose
To start both frontend and backend containers locally:
```bash
docker-compose up -d
```
The frontend will be available at [http://localhost](http://localhost) and the backend API at [http://localhost:3001](http://localhost:3001).

### 4. Running Frontend and Backend Separately

#### Frontend (React)
```bash
cd web
pnpm run dev
```

#### Backend (Express API)
```bash
cd api
pnpm run start
```

## Project Structure

- `web/` - React frontend
- `api/` - Express.js backend
- `docker-compose.yaml` - Multi-container orchestration

## Deployment
Images are built and deployed to Render automatically on every commit or pull request to the main branch.

## Available Scripts

### Frontend (`web/`)

| Script   | Description                |
|----------|----------------------------|
| dev      | Start Vite dev server      |
| build    | Type-check & build for prod|
| lint     | Run ESLint                 |
| preview  | Preview production build   |

Run with:
```bash
cd web
pnpm run <script>
```

### Backend (`api/`)

| Script   | Description                |
|----------|----------------------------|
| start    | Start Express API server   |
| test     | Placeholder test script    |

Run with:
```bash
cd api
pnpm run <script>
```
