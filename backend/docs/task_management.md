# Task Management with Celery

This document explains how task management works in the system, including signals, notifications, and background tasks.

## Overview

The task management system uses:
- Django Signals for handling model events
- Celery for background task processing
- Redis as the message broker
- Django Celery Beat for scheduling periodic tasks

## Key Components

### 1. Task Model

Located in `apps/tasks/models.py`, the Task model includes:
- Status tracking (pending, in_progress, completed, blocked)
- Priority levels (low, medium, high, critical)
- Due date tracking
- Developer assignment
- Project association

### 2. Signals

#### Task Signals (`apps/tasks/signals.py`)

- `handle_task_updates`: Handles task creation and status updates
- `check_deadline`: Checks for approaching deadlines on task save

### 3. Celery Tasks (`apps/tasks/tasks.py`)

#### Main Tasks

1. `notify_task_assigned`
   - Triggered when a task is assigned to a developer
   - Sends a notification to the assigned developer

2. `notify_task_status_update`
   - Triggered when a task's status changes
   - Sends a notification about the status update

3. `check_task_deadlines`
   - Runs hourly to check for tasks due in the next 24 hours
   - Sends notifications for approaching deadlines

4. `test_task_signals`
   - Test function to verify task signals and notifications

#### Scheduled Tasks

Configured in `backend/celery.py`:

1. **Hourly** - `check_task_deadlines`
   - Checks for tasks due in the next 24 hours
   - Sends notifications for approaching deadlines

2. **Weekdays at 9:00 AM** - `send_daily_task_reminders`
   - Sends a daily summary of tasks to users

## Development Setup

1. **Start Redis**
   ```bash
   redis-server
   ```

2. **Start Celery Worker**
   ```bash
   celery -A backend worker -l info
   ```

3. **Start Celery Beat** (for scheduled tasks)
   ```bash
   celery -A backend beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
   ```

## Testing Tasks

### Run Test Task

To test the task signals and notifications:

```python
from apps.tasks.tasks import test_task_signals

# Run the test task
test_task_signals.delay()
```

### Check Task Status

```python
from celery.result import AsyncResult

# Replace with your task ID
task = AsyncResult('your-task-id')
print(task.status)  # PENDING, STARTED, SUCCESS, FAILURE, etc.
print(task.result)  # Task return value
```

## Monitoring

1. **Flower** - Web-based tool for monitoring Celery
   ```bash
   pip install flower
   celery -A backend flower
   ```
   Then visit: http://localhost:5555

2. **Django Admin**
   - View scheduled tasks at `/admin/django_celery_beat/`
   - View task results at `/admin/django_celery_results/`

## Best Practices

1. **Task Design**
   - Keep tasks small and focused
   - Handle exceptions properly
   - Use retries for transient failures

2. **Performance**
   - Use `transaction.on_commit()` for database consistency
   - Batch operations when possible
   - Use `select_related` and `prefetch_related` to optimize DB queries

3. **Error Handling**
   - Implement proper error handling in tasks
   - Set appropriate retry policies
   - Log errors for debugging

## Troubleshooting

### Common Issues

1. **Tasks not running**
   - Check if Redis is running
   - Verify the Celery worker is connected
   - Check task queue configuration

2. **Task results not appearing**
   - Ensure `CELERY_RESULT_BACKEND` is configured
   - Check for unapplied migrations

3. **Scheduled tasks not running**
   - Verify Celery Beat is running
   - Check the schedule in Django Admin

For more information, refer to the [Celery documentation](https://docs.celeryq.dev/).
