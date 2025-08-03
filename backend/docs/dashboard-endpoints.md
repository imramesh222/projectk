# Dashboard Endpoints by Role

## Table of Contents
1. [Authentication](#authentication)
2. [Common Endpoints](#common-endpoints)
3. [Super Admin Dashboard](#1-super-admin-dashboard)
4. [Organization Admin Dashboard](#2-organization-admin-dashboard)
5. [Project Manager Dashboard](#3-project-manager-dashboard)
6. [Developer Dashboard](#4-developer-dashboard)
7. [Sales Dashboard](#5-sales-dashboard)
8. [Support Dashboard](#6-support-dashboard)
9. [Verifier Dashboard](#7-verifier-dashboard)

## Authentication
All dashboard endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Common Endpoints
Available to all authenticated users:

### User Profile
- `GET /api/v1/dashboard/profile/`
  - Get current user's profile information
  - **Response**: User details including role and organization

### Notifications
- `GET /api/v1/dashboard/notifications/`
  - Get user notifications
  - **Query Params**:
    - `unread_only` (boolean): Filter only unread notifications
    - `limit` (int): Number of notifications to return

### Global Search
- `GET /api/v1/dashboard/search/`
  - Search across the platform
  - **Query Params**:
    - `q` (string): Search query
    - `type` (string): Filter by type (project, task, user, etc.)

## 1. Super Admin Dashboard

### Overview
- `GET /api/v1/dashboard/superadmin/overview/`
  - **Response**:
    ```json
    {
      "system_health": {
        "status": "healthy",
        "database_status": "online",
        "cache_status": "online",
        "storage_usage": 65.5
      },
      "user_metrics": {
        "total_users": 150,
        "new_users_this_week": 12,
        "active_users": 89
      },
      "organization_metrics": {
        "total_organizations": 25,
        "active_organizations": 18
      },
      "recent_activities": [
        {
          "id": 1,
          "action": "user_created",
          "user": "user@example.com",
          "timestamp": "2025-08-02T12:30:45Z"
        }
      ]
    }
    ```

## 2. Organization Admin Dashboard

### Organization Overview
- `GET /api/v1/dashboard/admin/overview/`
  - **Response**:
    ```json
    {
      "organization": {
        "id": "org-123",
        "name": "Acme Corp",
        "member_count": 15,
        "project_count": 7,
        "active_since": "2023-01-15"
      },
      "project_metrics": {
        "total_projects": 7,
        "active_projects": 5,
        "on_hold": 1,
        "completed": 1
      },
      "member_activity": [
        {
          "user_id": "user-123",
          "name": "John Doe",
          "role": "developer",
          "last_active": "2025-08-02T14:30:00Z"
        }
      ]
    }
    ```

## 3. Project Manager Dashboard

### Project Overview
- `GET /api/v1/dashboard/manager/overview/`
  - **Response**:
    ```json
    {
      "project_stats": {
        "total": 5,
        "in_progress": 3,
        "on_hold": 1,
        "completed": 1,
        "overdue": 0
      },
      "task_stats": {
        "total": 42,
        "completed": 25,
        "in_progress": 12,
        "not_started": 5,
        "blocked": 0
      },
      "team_workload": [
        {
          "assigned_to__email": "dev1@example.com",
          "total_tasks": 8,
          "completed_tasks": 5,
          "in_progress_tasks": 3
        }
      ],
      "upcoming_deadlines": [
        {
          "id": "task-123",
          "title": "Implement user authentication",
          "due_date": "2025-08-10T23:59:59Z",
          "project": "Project X",
          "status": "in_progress"
        }
      ]
    }
    ```

## 4. Developer Dashboard

### Developer Overview
- `GET /api/v1/dashboard/developer/overview/`
  - **Response**:
    ```json
    {
      "task_stats": {
        "total": 8,
        "completed": 3,
        "in_progress": 3,
        "not_started": 2,
        "blocked": 0
      },
      "current_tasks": [
        {
          "id": "task-123",
          "title": "Fix login issue",
          "status": "in_progress",
          "due_date": "2025-08-10T23:59:59Z",
          "project": "Project X"
        }
      ],
      "recent_activity": [
        {
          "id": "task-122",
          "title": "Update documentation",
          "status": "completed",
          "updated_at": "2025-08-02T14:30:00Z",
          "project": "Project X"
        }
      ]
    }
    ```

## 5. Sales Dashboard

### Sales Overview
- `GET /api/v1/dashboard/sales/overview/`
  - **Response**:
    ```json
    {
      "pipeline": {
        "leads": 12,
        "contacted": 8,
        "proposal_sent": 5,
        "negotiation": 3,
        "closed_won": 2,
        "closed_lost": 1
      },
      "recent_deals": [
        {
          "id": "client-123",
          "name": "Acme Corp",
          "status": "proposal_sent",
          "value": 50000,
          "last_contact": "2025-08-01T10:30:00Z"
        }
      ],
      "revenue_metrics": {
        "monthly_revenue": 150000,
        "quarterly_revenue": 450000,
        "annual_revenue": 1800000
      }
    }
    ```

## 6. Support Dashboard

### Support Overview
- `GET /api/v1/dashboard/support/overview/`
  - **Response**:
    ```json
    {
      "ticket_stats": {
        "total": 42,
        "open": 15,
        "in_progress": 8,
        "waiting": 5,
        "resolved": 10,
        "closed": 4
      },
      "recent_tickets": [
        {
          "id": "ticket-123",
          "subject": "Login issues",
          "status": "open",
          "priority": "high",
          "created_at": "2025-08-02T10:15:00Z",
          "client": "Acme Corp"
        }
      ],
      "performance_metrics": {
        "avg_resolution_time_hours": 8.5,
        "tickets_resolved_this_week": 12
      }
    }
    ```

## 7. Verifier Dashboard

### Verification Overview
- `GET /api/v1/dashboard/verifier/overview/`
  - **Response**:
    ```json
    {
      "pending_verification": {
        "documents": 0,
        "users": 5,
        "other_items": 0
      },
      "verification_stats": {
        "pending": 5,
        "processed_today": 0,
        "processed_this_week": 12,
        "rejection_rate": 0.15
      },
      "recent_activity": []
    }
    ```

### Ticket Management
- `GET /api/v1/dashboard/support/tickets/` - List tickets
- `POST /api/v1/dashboard/support/tickets/` - Create ticket
- `GET /api/v1/dashboard/support/tickets/{id}/` - Ticket details
- `PATCH /api/v1/dashboard/support/tickets/{id}/` - Update ticket

## 7. Verifier Dashboard

### Verification Queue
- `GET /api/v1/dashboard/verifier/queue/` - Items to verify
- `GET /api/v1/dashboard/verifier/stats/` - Verification stats

### Verification Actions
- `POST /api/v1/dashboard/verifier/verify/{id}/` - Approve/Reject item
- `GET /api/v1/dashboard/verifier/history/` - Verification history

## Common Endpoints

### User Profile
- `GET /api/v1/dashboard/profile/` - Get profile
- `PATCH /api/v1/dashboard/profile/` - Update profile
- `GET /api/v1/dashboard/notifications/` - User notifications
- `POST /api/v1/dashboard/notifications/mark-read/` - Mark as read

### Search
- `GET /api/v1/dashboard/search/` - Global search
  - Query params: q, type, limit

## Implementation Notes

1. **Authentication**: All endpoints require JWT authentication
2. **Permissions**: Each endpoint enforces role-based access control
3. **Pagination**: All list endpoints support pagination
4. **Filtering**: Most list endpoints support filtering by various criteria
5. **Sorting**: Results can be sorted by different fields
6. **Rate Limiting**: Sensitive endpoints have rate limiting applied
7. **Caching**: Frequently accessed data is cached where appropriate
