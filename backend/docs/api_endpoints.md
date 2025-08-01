## Here's a comprehensive list of all API endpoints available in your project for the frontend:

## Authentication
POST /api/v1/token/ - Obtain JWT token (login)
POST /api/v1/token/refresh/ - Refresh access token
POST /api/v1/token/verify/ - Verify token
Users
POST /api/v1/users/register/ - Register new user
GET /api/v1/users/ - List all users (admin only)
GET /api/v1/users/{id}/ - Get user details
PUT /api/v1/users/{id}/ - Update user
PATCH /api/v1/users/{id}/ - Partially update user
DELETE /api/v1/users/{id}/ - Delete user
PATCH /api/v1/users/{user_id}/update-role/ - Update user role (admin only)
Organizations
GET /api/v1/org/organizations/ - List all organizations
POST /api/v1/org/organizations/ - Create organization
GET /api/v1/org/organizations/{id}/ - Get organization details
PUT /api/v1/org/organizations/{id}/ - Update organization
PATCH /api/v1/org/organizations/{id}/ - Partially update organization
DELETE /api/v1/org/organizations/{id}/ - Delete organization
GET /api/v1/org/organizations/{pk}/members/ - List organization members
Admin Assignments
GET /api/v1/org/admin-assignments/ - List all admin assignments
POST /api/v1/org/admin-assignments/ - Create admin assignment
GET /api/v1/org/admin-assignments/{id}/ - Get admin assignment details
PUT /api/v1/org/admin-assignments/{id}/ - Update admin assignment
DELETE /api/v1/org/admin-assignments/{id}/ - Delete admin assignment
POST /api/v1/org/admin-assignments/{pk}/deactivate/ - Deactivate admin
POST /api/v1/org/admin-assignments/{pk}/reactivate/ - Reactivate admin
Clients
GET /api/v1/clients/ - List all clients
POST /api/v1/clients/ - Create client
GET /api/v1/clients/{id}/ - Get client details
PUT /api/v1/clients/{id}/ - Update client
PATCH /api/v1/clients/{id}/ - Partially update client
DELETE /api/v1/clients/{id}/ - Delete client
POST /api/v1/clients/{pk}/activate/ - Activate client
POST /api/v1/clients/{pk}/deactivate/ - Deactivate client
Tasks
GET /api/v1/tasks/tasks/ - List all tasks
POST /api/v1/tasks/tasks/ - Create task
GET /api/v1/tasks/tasks/{id}/ - Get task details
PUT /api/v1/tasks/tasks/{id}/ - Update task
PATCH /api/v1/tasks/tasks/{id}/ - Partially update task
DELETE /api/v1/tasks/tasks/{id}/ - Delete task
Support (if implemented)
GET /api/v1/support/ - List support tickets
POST /api/v1/support/ - Create support ticket
GET /api/v1/support/{id}/ - Get support ticket details
PUT /api/v1/support/{id}/ - Update support ticket
DELETE /api/v1/support/{id}/ - Delete support ticket
Notifications
GET /api/v1/notifications/ - List notifications
GET /api/v1/notifications/{id}/ - Get notification details
PATCH /api/v1/notifications/{id}/mark-read/ - Mark as read
POST /api/v1/notifications/mark-all-read/ - Mark all as read
Payments (if implemented)
GET /api/v1/billing/ - List payments
POST /api/v1/billing/ - Create payment
GET /api/v1/billing/{id}/ - Get payment details
PUT /api/v1/billing/{id}/ - Update payment
DELETE /api/v1/billing/{id}/ - Delete payment
Documentation
/swagger/ - Interactive API documentation
/redoc/ - Alternative API documentation
Notes for Frontend Implementation:
Authentication: All endpoints except /token/, /token/refresh/, and /token/verify/ require authentication.
Permissions: Some endpoints have role-based access control (admin, superadmin).
Pagination: List endpoints are paginated.
Filtering/Searching: Most list endpoints support filtering and searching.
Response Format: All endpoints return JSON.