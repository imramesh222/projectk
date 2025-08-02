"""
Test script for organization member management.
Run with: python manage.py shell < scripts/test_organization_members.py
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from apps.organization.models import Organization, OrganizationMember, OrganizationRoleChoices

User = get_user_model()

class OrganizationMemberTests(APITestCase):
    """Test cases for organization member management."""
    
    def setUp(self):
        # Create test users
        self.superuser = User.objects.create_superuser(
            username='superuser',
            email='superuser@example.com',
            password='testpass123'
        )
        
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123'
        )
        
        self.regular_user = User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='testpass123'
        )
        
        # Create an organization
        self.organization = Organization.objects.create(
            name='Test Organization',
            description='Test Description',
            is_active=True
        )
        
        # Make admin_user an admin of the organization
        self.org_admin = OrganizationMember.objects.create(
            user=self.admin_user,
            organization=self.organization,
            role=OrganizationRoleChoices.ADMIN,
            is_active=True
        )
        
        # Set up API client
        self.client = APIClient()
        
    def test_add_member_as_superuser(self):
        """Test adding a member as a superuser."""
        self.client.force_authenticate(user=self.superuser)
        
        url = reverse('organization:organization-add-member', kwargs={'org_id': self.organization.id})
        data = {
            'user': self.regular_user.id,
            'role': OrganizationRoleChoices.DEVELOPER,
            'is_active': True
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(OrganizationMember.objects.count(), 2)  # admin + new member
        
    def test_add_member_as_org_admin(self):
        """Test adding a member as an organization admin."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('organization:organization-add-member', kwargs={'org_id': self.organization.id})
        data = {
            'user': self.regular_user.id,
            'role': OrganizationRoleChoices.DEVELOPER,
            'is_active': True
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
    def test_list_members(self):
        """Test listing organization members."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('organization:organization-members', kwargs={'org_id': self.organization.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only the admin member
        self.assertEqual(response.data[0]['user']['username'], self.admin_user.username)
        
    def test_list_developers(self):
        """Test listing all developers across organizations."""
        # Add a developer to the organization
        developer = User.objects.create_user(
            username='developer',
            email='developer@example.com',
            password='testpass123'
        )
        
        OrganizationMember.objects.create(
            user=developer,
            organization=self.organization,
            role=OrganizationRoleChoices.DEVELOPER,
            is_active=True
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('organization:organization-developers')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['email'], 'developer@example.com')
        
    def test_join_organization(self):
        """Test a user joining an organization."""
        self.client.force_authenticate(user=self.regular_user)
        
        url = reverse('organization:organization-join', kwargs={'org_id': self.organization.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            OrganizationMember.objects.filter(
                user=self.regular_user,
                organization=self.organization,
                role=OrganizationRoleChoices.USER,
                is_active=True
            ).exists()
        )

if __name__ == '__main__':
    import unittest
    unittest.main()
