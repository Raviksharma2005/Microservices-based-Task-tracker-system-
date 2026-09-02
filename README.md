# TaskFlow â€” Microservices Task & Team Management System

A production-grade microservices backend with a React frontend for managing teams, users, and tasks.

## Architecture

- **Auth Service** (Port 3001) â€” Registration, login, JWT tokens
- **User Service** (Port 3002) â€” User profiles with Redis caching
- **Team Service** (Port 3003) â€” Teams & memberships with RBAC
- **Task Service** (Port 3004) â€” Tasks within teams with authorization
- **API Gateway** (Port 3000) â€” Reverse proxy routing
- **Frontend** (Port 5173) â€” React dashboard

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB Atlas (cloud)
- **Cache:** Redis Cloud
- **Auth:** JWT + bcrypt
- **Validation:** Zod
- **Logging:** Pino
- **Frontend:** React + Vite

## Getting Started

`ash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your MongoDB Atlas and Redis Cloud credentials

# Start all services
npm run dev:services

# Start frontend (in another terminal)
npm run dev:frontend
`

## API Endpoints

### Auth Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register a new user |
| POST | /auth/login | Login and get JWT |
| POST | /auth/refresh | Refresh access token |
| GET | /auth/me | Get current user |

### User Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/:id | Get user profile |
| PUT | /users/:id | Update user profile |
| GET | /users/me | Get own profile |

### Team Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /teams | Create a team |
| GET | /teams/:id | Get team details |
| PUT | /teams/:id | Update team |
| DELETE | /teams/:id | Delete team |
| POST | /teams/:id/members | Add member |
| DELETE | /teams/:id/members/:userId | Remove member |
| GET | /teams/:id/members | List members |

### Task Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /tasks | Create task |
| GET | /tasks/:id | Get task |
| PUT | /tasks/:id | Update task |
| DELETE | /tasks/:id | Delete task |
| GET | /teams/:id/tasks | List team tasks |

## License

MIT