import uuid
from django.db import models
from apps.users.models import User
from apps.organization.models import Organization

class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    contact = models.CharField(max_length=100)
    salesperson = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'salesperson'})
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
