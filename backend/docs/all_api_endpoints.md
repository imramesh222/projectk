# ProjectK API Endpoints Reference

## Table of Contents
1. [Authentication](#authentication)
2. [Users](#users)
3. [Organizations](#organizations)
4. [Clients](#clients)
5. [Projects](#projects)
6. [Tasks](#tasks)
7. [Support](#support)
8. [Payments](#payments)
9. [Notifications](#notifications)
10. [Dashboard](#dashboard)
11. [Documentation](#documentation)

## Authentication

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST   | `/api/v1/token/` | Obtain JWT token (login) | None |
| POST   | `/api/v1/token/refresh/` | Refresh access token | None |
| POST   | `/api/v1/token/verify/` | Verify token | None |

## Users

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| POST   | `/api/v1/users/register/` | Register new user | None |
| GET    | `/api/v1/users/` | List all users | Admin |
| GET    | `/api/v1/users/{id}/` | Get user details | Same User/Admin |
| PUT    | `/api/v1/users/{id}/` | Update user | Same User/Admin |
| PATCH  | `/api/v1/users/{id}/` | Partially update user | Same User/Admin |
| DELETE | `/api/v1/users/{id}/` | Delete user | Admin |
| PATCH  | `/api/v1/users/{id}/update-role/` | Update user role | Super Admin |
| GET    | `/api/v1/users/me/` | Get current user profile | Authenticated |
| PATCH  | `/api/v1/users/me/password/` | Change password | Authenticated |

## Organizations

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET    | `/api/v1/org/organizations/` | List organizations | Admin |
| POST   | `/api/v1/org/organizations/` | Create organization | Admin |
| GET    | `/api/v1/org/organizations/{id}/` | Get organization | Member |
| PUT    | `/api/v1/org/organizations/{id}/` | Update organization | Org Admin |
| PATCH  | `/api/v1/org/organizations/{id}/` | Partial update | Org Admin |
| DELETE | `/api/v1/org/organizations/{id}/` | Delete organization | Super Admin |
| GET    | `/api/v1/org/organizations/{id}/members/` | List members | Member |
| POST   | `/api/v1/org/organizations/{id}/members/` | Add member | Org Admin |
| GET    | `/api/v1/org/organizations/{id}/members/{user_id}/` | Get member | Member |
| PATCH  | `/api/v1/org/organizations/{id}/members/{user_id}/` | Update role | Org Admin |
| DELETE | `/api/v1/org/organizations/{id}/members/{user_id}/` | Remove member | Org Admin |

## Clients

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET    | `/api/v1/clients/` | List clients | Sales/Admin |
| POST   | `/api/v1/clients/` | Create client | Sales/Admin |
| GET    | `/api/v1/clients/{id}/` | Get client | Same Org |
| PUT    | `/api/v1/clients/{id}/` | Update client | Same Org Admin |
| PATCH  | `/api/v1/clients/{id}/` | Partial update | Same Org Admin |
| DELETE | `/api/v1/clients/{id}/` | Delete client | Admin |
| POST   | `/api/v1/clients/{id}/activate/` | Activate client | Admin |
| POST   | `/api/v1/clients/{id}/deactivate/` | Deactivate client | Admin |

## Projects

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET    | `/api/v1/projects/` | List projects | Member |
| POST   | `/api/v1/projects/` | Create project | Manager |
| GET    | `/api/v1/projects/{id}/` | Get project | Member |
| PUT    | `/api/v1/projects/{id}/` | Update project | Manager |
| PATCH  | `/api/v1/projects/{id}/` | Partial update | Manager |
| DELETE | `/api/v1/projects/{id}/` | Delete project | Admin |
| POST   | `/api/v1/projects/{id}/archive/` | Archive project | Manager |
| POST   | `/api/v1/projects/{id}/restore/` | Restore project | Admin |

## Tasks

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET    | `/api/v1/tasks/` | List tasks | Member |
| POST   | `/api/v1/tasks/` | Create task | Manager |
| GET    | `/api/v1/tasks/{id}/` | Get task | Member |
| PUT    | `/api/v1/tasks/{id}/` | Update task | Manager |
| PATCH  | `/api/v1/tasks/{id}/` | Partial update | Assigned User/Manager |
| DELETE | `/api/v1/tasks/{id}/` | Delete task | Manager |
| PATCH  | `/api/v1/tasks/{id}/status/` | Update status | Assigned User/Manager |
| POST   | `/api/v1/tasks/{id}/comments/` | Add comment | Member |
| GET    | `/api/v1/tasks/{id}/time-entries/` | List time entries | Member |
| POST   | `/api/v1/tasks/{id}/time-entries/` | Log time | Member |

## Support

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET    | `/api/v1/support/tickets/` | List tickets | Member |
| POST   | `/api/v1/support/tickets/` | Create ticket | Member |
| GET    | `/api/v1/support/tickets/{id}/` | Get ticket | Same Org |
| PUT    | `/api/v1/support/tickets/{id}/` | Update ticket | Creator/Support |
| PATCH  | `/api/v1/support/tickets/{id}/` | Partial update | Creator/Support |
| DELETE | `/api/v1/support/tickets/{id}/` | Delete ticket | Admin |
| POST   | `/api/v1/support/tickets/{id}/comments/` | Add comment | Same Org |
| PATCH  | `/api/v1/support/tickets/{id}/status/` | Update status | Support |
| PATCH  | `/api/v1/support/tickets/{id}/assign/` | Assign ticket | Support |

## Payments

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET    | `/api/v1/payments/` | List payments | Finance/Admin |
| POST   | `/api/v1/payments/` | Create payment | Finance |
| GET    | `/api/v1/payments/{id}/` | Get payment | Finance/Admin |
| PUT    | `/api/v1/payments/{id}/` | Update payment | Finance |
| PATCH  | `/api/v1/payments/{id}/` | Partial update | Finance |
| DELETE | `/api/v1/payments/{id}/` | Delete payment | Admin |
| POST   | `/api/v1/payments/{id}/process/` | Process payment | Finance |
| POST   | `/api/v1/payments/{id}/refund/` | Process refund | Finance |

## Notifications

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET    | `/api/v1/notifications/` | List notifications | Authenticated |
| GET    | `/api/v1/notifications/unread/` | Unread notifications | Authenticated |
| GET    | `/api/v1/notifications/{id}/` | Get notification | Owner |
| PATCH  | `/api/v1/notifications/{id}/read/` | Mark as read | Owner |
| PATCH  | `/api/v1/notifications/{id}/unread/` | Mark as unread | Owner |
| POST   | `/api/v1/notifications/mark-all-read/` | Mark all as read | Authenticated |
| DELETE | `/api/v1/notifications/{id}/` | Delete notification | Owner |

## Dashboard

### Common Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET    | `/api/v1/dashboard/profile/` | Get current user profile | Authenticated |
| GET    | `/api/v1/dashboard/notifications/` | Get user notifications | Authenticated |
| GET    | `/api/v1/dashboard/search/` | Global search | Authenticated |

### Super Admin Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/dashboard/superadmin/overview/` | System-wide statistics and metrics |

### Organization Admin Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/dashboard/admin/overview/` | Organization metrics and stats |
| GET    | `/api/v1/dashboard/admin/members/` | Manage organization members |
| GET    | `/api/v1/dashboard/admin/projects/` | Manage organization projects |

### Project Manager Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/dashboard/manager/overview/` | Project and team metrics |
| GET    | `/api/v1/dashboard/manager/tasks/` | Manage project tasks |
| GET    | `/api/v1/dashboard/manager/team/` | Team performance |

### Developer Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/dashboard/developer/overview/` | Personal tasks and metrics |
| GET    | `/api/v1/dashboard/developer/tasks/` | Assigned tasks |
| GET    | `/api/v1/dashboard/developer/calendar/` | Task calendar |

### Sales Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/dashboard/sales/overview/` | Sales pipeline and metrics |
| GET    | `/api/v1/dashboard/sales/clients/` | Client management |
| GET    | `/api/v1/dashboard/sales/performance/` | Sales performance |

### Support Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/dashboard/support/overview/` | Support ticket metrics |
| GET    | `/api/v1/dashboard/support/tickets/` | Manage support tickets |
| GET    | `/api/v1/dashboard/support/performance/` | Support performance |

### Verifier Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/v1/dashboard/verifier/overview/` | Verification queue and metrics |
| GET    | `/api/v1/dashboard/verifier/queue/` | Items pending verification |
| GET    | `/api/v1/dashboard/verifier/activity/` | Verification activity |

## Documentation

| Endpoint | Description |
|----------|-------------|
| `/swagger/` | Interactive API documentation (Swagger UI) |
| `/redoc/` | Alternative API documentation (ReDoc) |
| `/schema/` | API schema (JSON) |
| `/schema.yml/` | API schema (YAML) |

## Notes for Frontend Implementation

### Authentication
- All endpoints except `/token/`, `/token/refresh/`, and `/token/verify/` require authentication
- Include the JWT token in the `Authorization` header:
  ```
  Authorization: Bearer <your_jwt_token>
  ```

### Permissions
- Role-based access control is implemented for all endpoints
- Common roles: `Super Admin`, `Organization Admin`, `Project Manager`, `Developer`, `Sales`, `Support`, `Verifier`
- Some endpoints have additional permission checks

### Pagination
- List endpoints are paginated (default: 20 items per page)
- Use query parameters: `?page=<number>&page_size=<size>`
- Response includes pagination metadata:
  ```json
  {
    "count": 100,
    "next": "https://api.example.com/endpoint/?page=2",
    "previous": null,
    "results": [...]
  }
  ```

### Filtering & Searching
- Most list endpoints support filtering using query parameters
- Common filters: `?status=active&created_after=2023-01-01`
- Search: `?search=query` (searches in relevant fields)
- Ordering: `?ordering=field` or `?ordering=-field` for descending

### Response Format
- All endpoints return JSON
- Standard response structure:
  ```json
  {
    "status": "success",
    "data": { ... },
    "message": "Operation completed successfully"
  }
  ```
- Error responses include status code and error details:
  ```json
  {
    "status": "error",
    "error": {
      "code": "invalid_input",
      "message": "Validation error",
      "details": {
        "field_name": ["This field is required."]
      }
    }
  }
  ```

### Rate Limiting
- Default: 1000 requests per hour per user
- Authentication endpoints: 20 requests per minute per IP
- Response headers include rate limit information:
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 850
  X-RateLimit-Reset: 1623456789
  ```

### Versioning
- API version is included in the URL path (`/api/v1/`)
- New versions will be released with backward compatibility
- Clients should specify the `Accept` header:
  ```
  Accept: application/json; version=1.0
  ```