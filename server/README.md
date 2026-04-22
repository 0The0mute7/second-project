# BEYOND 40% - Supabase Backend

## Quick Start

### Prerequisites
- Node.js
- npm
- A Supabase project

### Environment
Create `server/.env` with:

```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=change_this_to_a_real_secret
```

### Database Setup
Run [`supabase-schema.sql`](./supabase-schema.sql) in the Supabase SQL editor to create:
- `users`
- `activities`
- `messages`

### Start Server
Development:
```bash
npm.cmd run dev
```

Production:
```bash
npm.cmd start
```

Server runs on `http://localhost:5000`.

## API Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`

### Users
- `GET /api/users/profile`
- `GET /api/users/search/query?q=term`
- `GET /api/users/:username`
- `PUT /api/users/profile`

### Activities
- `POST /api/activities`
- `GET /api/activities`
- `GET /api/activities/:id`
- `PUT /api/activities/:id`
- `DELETE /api/activities/:id`
- `POST /api/activities/:id/like`

### Friends
- `POST /api/friends/add/:friendUsername`
- `POST /api/friends/remove/:friendUsername`
- `GET /api/friends`
- `GET /api/friends/feed/all`

### Messages
- `POST /api/messages/send`
- `GET /api/messages/conversation/:otherUser`
- `GET /api/messages`
- `DELETE /api/messages/:id`

## Auth
Protected routes expect:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```
