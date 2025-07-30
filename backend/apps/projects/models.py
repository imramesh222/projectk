import uuid
from django.db import models
from apps.organization.models import Salesperson, Verifier, ProjectManager, Developer, Support
from apps.users.models import User

class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    contact = models.CharField(max_length=255)
    salesperson = models.ForeignKey(Salesperson, on_delete=models.CASCADE)

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    cost = models.FloatField()
    discount = models.FloatField()
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    created_by = models.ForeignKey(Salesperson, on_delete=models.SET_NULL, null=True, related_name='created_projects')
    verifier = models.ForeignKey(Verifier, on_delete=models.SET_NULL, null=True)
    manager = models.ForeignKey(ProjectManager, on_delete=models.SET_NULL, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    amount = models.FloatField()
    verified = models.BooleanField(default=False)
    project = models.OneToOneField(Project, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=64)
    developer = models.ForeignKey(Developer, on_delete=models.SET_NULL, null=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

class SupportTicket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    issue = models.CharField(max_length=255)
    support = models.ForeignKey(Support, on_delete=models.SET_NULL, null=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)