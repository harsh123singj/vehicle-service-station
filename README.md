# Smart Vehicle Compliance & Journey Management Platform

A full-stack real-time vehicle operations platform built for the Smart Vehicle Operations Platform hiring assignment.

The system simulates a vehicle arriving at a service station, identifies and verifies the vehicle, determines eligibility, manages the queue and service bay, tracks service activity, generates alerts for exceptional conditions, and records the complete journey history and audit trail.

## Features

- JWT authentication and role-based access control (RBAC)
- Vehicle entry simulator
- Explicit backend journey state machine
- Simulated verification and eligibility flow
- HOLD handling for non-eligible vehicles
- Live queue management
- Bay assignment and service workflow
- Vehicle exit and journey history
- Socket.IO realtime dashboard updates
- Camera health monitoring and offline simulation
- Alerts with acknowledge/resolve workflow
- Audit logs
- Station operations dashboard
- Multi-site command center
- KPI dashboard
- REST APIs backed by PostgreSQL
- Prisma ORM

## Tech Stack

### Frontend
- React 19
- Vite
- React Router
- Tailwind CSS
- Axios
- Socket.IO Client
- Lucide React

### Backend
- Node.js
- Express
- Socket.IO
- JWT
- bcrypt
- Prisma ORM
- PostgreSQL

## Architecture

```mermaid
flowchart LR
    U[Operator] --> FE[React Frontend]
    FE -->|REST / JSON| API[Node.js + Express API]
    FE <-->|WebSocket / Socket.IO| RT[Realtime Event Layer]
    API --> AUTH[JWT + RBAC]
    API --> BL[Business Logic / State Machine]
    API --> PRISMA[Prisma ORM]
    API --> RT
    PRISMA --> DB[(PostgreSQL)]
    SIM[Vehicle Simulator] --> API
    CAM[Camera Simulation] --> API
    API --> ALERT[Alerts / Audit]
```

The database is the source of truth. Socket.IO is used to notify connected dashboards when operational data changes.

## Journey State Machine

Normal flow:

```text
ENTERED
   ↓
IDENTIFIED
   ↓
VERIFYING
   ↓
ELIGIBLE
   ↓
QUEUED
   ↓
BAY_ASSIGNED
   ↓
SERVICE_IN_PROGRESS
   ↓
SERVICE_COMPLETED
   ↓
EXITED
```

Exception flow:

```text
VERIFYING → NOT_ELIGIBLE → HOLD
```

Backend transition rules prevent arbitrary state changes. Important transitions create journey events containing the journey, vehicle/site, previous state, new state, source and timestamp.

## End-to-End Flow

1. Vehicle entry is generated through the simulator.
2. Backend validates the site and vehicle and protects against duplicate active journeys.
3. Journey moves from `ENTERED` to `IDENTIFIED`.
4. Verification is performed and stored against the journey.
5. Eligibility is decided by backend business logic.
6. Eligible vehicles enter the queue.
7. An available bay is assigned.
8. Service starts and completes.
9. Vehicle exits and the journey is closed.
10. The complete journey timeline remains available for history and audit.

## Realtime Events

The application uses Socket.IO for operational synchronization. Events include:

- `journey:created`
- `journey:service-started`
- `journey:service-completed`
- `journey:exited`
- `journey:eligibility-decided`
- `journey:verification-failed`
- `queue:changed`
- `alert:created`
- `camera:changed`

Typical flow:

```text
Backend business action
        ↓
Database update
        ↓
Socket.IO emit
        ↓
Connected React dashboards
```

## Authentication & RBAC

Authentication uses JWT. Protected API requests use:

```text
Authorization: Bearer <JWT>
```

Supported application roles include:

- `ADMIN`
- `OPERATOR`
- `SUPERVISOR`

Authorization is enforced by the backend, not only by hiding frontend controls.

## Database Design

Core entities:

```text
User
Site
Camera
Vehicle
Journey
JourneyEvent
VerificationResult
Alert
Queue
Bay
ServiceSession
AuditLog
```

```mermaid
erDiagram
    USER ||--o{ JOURNEY : creates
    SITE ||--o{ CAMERA : contains
    SITE ||--o{ JOURNEY : hosts
    VEHICLE ||--o{ JOURNEY : has
    JOURNEY ||--o{ JOURNEY_EVENT : records
    JOURNEY ||--o{ VERIFICATION_RESULT : has
    JOURNEY ||--o{ ALERT : generates
    JOURNEY ||--o| QUEUE : enters
    JOURNEY ||--o| SERVICE_SESSION : receives
    SITE ||--o{ QUEUE : manages
    SITE ||--o{ BAY : contains
    BAY ||--o{ SERVICE_SESSION : handles
    USER ||--o{ AUDIT_LOG : creates
    JOURNEY ||--o{ AUDIT_LOG : references
```

## Main Dashboard Modules

### Dashboard
Live station KPIs, current vehicle activity, queue/bay information, alerts and recent events.

### Journeys
Journey history, verification, eligibility, queue, bay, service information and event timeline.

### Queue
Active waiting vehicles and queue positions with realtime updates.

### Bays
Service bay status and assignments.

### Alerts
Operational alerts with acknowledge and resolve actions.

### Cameras
Camera health and online/offline simulation.

### Audit Logs
Historical operational actions and events.

### Command Center
Network-level site information, KPIs and alerts.

### Simulator
Reproducible vehicle journey demonstration without manually editing the database.

## Failure Handling

The prototype demonstrates operational exception handling for:

### Camera Offline
The camera status changes to `OFFLINE`, a camera alert is created and a realtime camera event is emitted.

### Verification Failure
The verification failure is recorded and an alert is generated so the vehicle does not silently continue through the normal flow.

### Non-Eligible Vehicle
A non-eligible journey is moved toward `HOLD` and an operational alert is generated.

### Duplicate Journey
The backend checks for an existing active journey before creating another journey for the same vehicle.

### Invalid State Transition
Unsupported state transitions are rejected by backend state-machine rules.

## KPI Tracking

The dashboard supports operational metrics such as:

- Total journeys
- Vehicles currently in journey
- Queue length
- Total/available/occupied bays
- Average waiting time
- Site-level KPI information

Supported time periods include Today, Last 24 Hours and Last 7 Days where exposed by the dashboard KPI API.

## API Structure

Main API areas are:

```text
/api/auth
/api/sites
/api/vehicles
/api/journeys
/api/queues
/api/bays
/api/alerts
/api/cameras
/api/dashboard
/api/audit-logs
/api/simulator
```

Login endpoint:

```http
POST /api/auth/login
```

Example request:

```json
{
  "email": "operator@smartvehicle.com",
  "password": "Operator@123"
}
```

For complete request/response examples, use the Postman collection included with the repository.

## Local Setup

### Prerequisites

- Node.js
- PostgreSQL
- Git

### Clone

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <PROJECT_DIRECTORY>
```

### Backend

```bash
cd backend
npm install
```

Create `.env`:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME"
JWT_SECRET="your-secret-key"
PORT=5000
```

Run migrations:

```bash
npx prisma migrate dev
```

Start the API:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Environment Variables

Never commit real secrets.

Example backend `.env.example`:

```env
DATABASE_URL=
JWT_SECRET=
PORT=5000
```

Add any deployment-specific variables to `.env.example` without exposing their values.

## Demo Credentials

For local demonstration:

```text
Email:    operator@smartvehicle.com
Password: Operator@123
```

Do not use these credentials in production.

## Demo Flow

1. Login.
2. Open Dashboard.
3. Open Simulator.
4. Generate vehicle entry.
5. Identify vehicle.
6. Run verification.
7. Generate eligibility decision.
8. Add eligible vehicle to queue.
9. Assign bay.
10. Start service.
11. Complete service.
12. Exit vehicle.
13. Open Journey Details/history.
14. Trigger a non-eligible scenario and inspect Alerts.
15. Simulate camera offline and inspect the camera alert.
16. Open Audit Logs.
17. Open Command Center.

## Testing Scenarios

| Scenario | Expected Result |
|---|---|
| Normal journey | Entry-to-exit succeeds |
| Non-eligible vehicle | Vehicle is held and alert generated |
| Verification failure | Failure recorded and alert generated |
| Camera offline | Camera becomes offline and alert is generated |
| Duplicate vehicle event | Duplicate active journey is prevented |
| Invalid state transition | Backend rejects transition |
| Realtime update | Connected dashboards update through Socket.IO |

## Design Decisions

### PostgreSQL
The domain contains strongly related operational data such as vehicles, journeys, events, queues, bays, alerts and audit logs. A relational database fits these relationships and constraints well.

### Prisma
Prisma provides schema-driven migrations, typed database access and explicit relationships.

### Socket.IO
Operators need to see vehicle, queue, alert, service and camera changes without repeatedly refreshing the dashboard. Socket.IO provides the realtime notification layer.

### Explicit State Machine
The vehicle cannot arbitrarily jump from one operational stage to another. Backend transition rules keep the workflow predictable and protect data integrity.

### Simulator
The assignment allows simulated cameras and external services. The simulator makes the end-to-end workflow reproducible without physical hardware or manual database editing.

## Scaling Approach

The current system is intentionally a focused prototype. For a larger deployment covering hundreds or thousands of sites, I would introduce:

- Horizontal API scaling and load balancing
- Redis for distributed caching/shared realtime coordination
- Kafka or another message broker for high-volume event ingestion
- Socket.IO adapter/shared pub-sub infrastructure
- Database indexing and read replicas
- Partitioning/archival for historical events
- Background workers
- Centralized logging and metrics
- Rate limiting
- Health checks and monitoring

These components are deliberately outside the current prototype scope.

## Production Improvements

Before production I would add:

- Refresh tokens
- Stronger secret management
- Rate limiting
- Automated unit/integration tests
- Distributed realtime infrastructure
- Centralized observability
- More comprehensive retry/fallback handling for external services
- Backup/recovery strategy
- CI/CD
- Load testing
- Stronger audit/compliance controls

## Project Structure

```text
project/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── server.js
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
│
├── postman/
├── .env.example
└── README.md
```

## Submission Checklist

- [x] Working full-stack prototype
- [x] README and setup instructions
- [ ] Architecture diagram finalized
- [ ] ER/database diagram finalized
- [ ] Postman collection
- [ ] `.env.example`
- [x] Event simulator
- [ ] Live deployment URL
- [ ] 5–8 minute demo
- [ ] Technical design notes

## Assignment Coverage

| Requirement | Status |
|---|---|
| Backend API | ✅ |
| Relational database | ✅ |
| Vehicle simulator | ✅ |
| Journey state machine | ✅ |
| Verification flow | ✅ |
| Eligibility decision | ✅ |
| Queue management | ✅ |
| Bay assignment | ✅ |
| Service workflow | ✅ |
| Vehicle exit | ✅ |
| Realtime events | ✅ |
| Station dashboard | ✅ |
| Command center | ✅ |
| Authentication | ✅ |
| RBAC | ✅ |
| Alerts | ✅ |
| Camera simulation | ✅ |
| Audit logs | ✅ |
| Journey history | ✅ |
| KPI dashboard | ✅ |
| Failure scenarios | ✅ |
| Postman collection | 🔄 |
| Deployment | 🔄 |

## Final Note

This project prioritizes a reliable end-to-end operational workflow over optional infrastructure complexity.

The core flow is:

```text
Vehicle Entry
      ↓
Identification
      ↓
Verification
      ↓
Eligibility
      ↓
Queue
      ↓
Bay Assignment
      ↓
Service
      ↓
Exit
      ↓
History + Audit
```

Advanced infrastructure such as Kafka, Redis, WebRTC, real camera streaming, CI/CD and large-scale load testing can be introduced as the system grows, but are intentionally outside the current prototype scope.
