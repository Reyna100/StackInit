# API Contract

This document is the source of truth for communication between the generated React frontend and generated backend. The contract is independent of the selected backend framework (Express, NestJS, Fastify) and ORM (Prisma, Sequelize, Drizzle).

---

## 1. General

| Item | Value |
|------|-------|
| Base URL (development) | `http://localhost:3000` |
| API Prefix | `/api` |
| Content-Type | `application/json` |
| Charset | `UTF-8` |

All endpoints below are prefixed with `/api`. The frontend must not connect directly to the database; all data access goes through HTTP APIs defined here.

---

## 2. Health Endpoint

Used by the frontend to verify backend reachability and by load balancers / orchestration for liveness checks.

### Request

```
GET /api/health
```

- **Authentication:** None
- **Query Parameters:** None
- **Request Body:** None
- **Headers:**
  - `Accept: application/json` (optional)

### Success Response

- **Status Code:** `200 OK`
- **Headers:**
  - `Content-Type: application/json`
- **Body:**

```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Health indicator. Always `"ok"` on success. |
| `message` | `string` | Human-readable message. |
| `timestamp` | `string` | ISO 8601 UTC timestamp of the response. |
| `uptime` | `number` | Process uptime in seconds (as returned by `process.uptime()`). |

> Note: The minimal required fields are `status` and `message`. `timestamp` and `uptime` are included in the default implementation but clients should treat them as optional and not fail if absent.

#### Example cURL

```bash
curl http://localhost:3000/api/health
```

#### Example Frontend Usage (JavaScript)

```javascript
const res = await fetch('http://localhost:3000/api/health');
const data = await res.json();
if (data.status === 'ok') {
  console.log('Backend reachable');
}
```

---

## 3. HTTP Status Codes

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| `200` | OK | Request succeeded (e.g., `GET /api/health`). |
| `404` | Not Found | Route does not exist. |
| `500` | Internal Server Error | Unhandled server error. |

Future endpoints should follow standard HTTP semantics. Additional codes (`400`, `401`, `422`, etc.) may be introduced as the application grows, but must be documented here before implementation.

---

## 4. Error Response Format

All error responses must use a consistent JSON shape:

```json
{
  "status": "error",
  "message": "Description of what went wrong",
  "error": "Optional detailed error (only in development)"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | `string` | Yes | Always `"error"`. |
| `message` | `string` | Yes | Human-readable error description. |
| `error` | `string` | No | Detailed error / stack hint. Only included when `NODE_ENV !== "production"`. |

### Examples

**404 Not Found**

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "status": "error",
  "message": "Route not found"
}
```

**500 Internal Server Error**

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "status": "error",
  "message": "Internal server error"
}
```

---

## 5. CORS

The backend must enable CORS for the frontend origin during development:

- Allowed origin: `http://localhost:5173` (Vite default)
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`
- Allowed headers: `Content-Type, Authorization`

Production CORS origins should be configured via environment variables.

---

## 6. Versioning

The current contract is unversioned (`/api/*`). If breaking changes are introduced, they must be documented here and communicated via a version prefix (e.g., `/api/v2/health`) before implementation.

---

## 7. Extending the Contract

When adding new endpoints:

1. Update this document first.
2. Define: HTTP method, path, request format, response format, status codes, and error format.
3. Implement backend and frontend against the updated contract.

Do not invent business APIs without updating this file.
