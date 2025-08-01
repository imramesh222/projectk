"""
Tests for user registration functionality.
"""
import json
from unittest.mock import patch, MagicMock
from django.urls import reverse
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class UserRegistrationTests(APITestCase):
    """Test user registration endpoint."""
    
    def setUp(self):
        self.url = reverse('user-register')
        self.valid_payload = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }
    
    @patch('apps.users.tasks.send_welcome_email_task.delay')
    def test_successful_registration(self, mock_email_task):
        """Test successful user registration with valid data."""
        response = self.client.post(
            self.url,
            data=json.dumps(self.valid_payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        user = User.objects.get(email=self.valid_payload['email'])
        self.assertEqual(user.email, self.valid_payload['email'])
        self.assertEqual(user.first_name, self.valid_payload['first_name'])
        self.assertEqual(user.last_name, self.valid_payload['last_name'])
        self.assertEqual(user.role, 'user')  # Default role
        self.assertTrue(user.is_active)  # Should be active by default
        
        # Check response data
        data = response.data
        self.assertEqual(data['user']['email'], self.valid_payload['email'])
        self.assertEqual(data['status'], 'success')
        self.assertTrue('tokens' in data)
        self.assertTrue('access' in data['tokens'])
        self.assertTrue('refresh' in data['tokens'])
        self.assertTrue('expires_in' in data['tokens'])
        self.assertEqual(data['account']['status'], 'active')
        self.assertFalse(data['account']['email_verification_required'])
        self.assertTrue(data['account']['welcome_email_sent'])
        self.assertEqual(data['account']['email_status'], 'scheduled')
        
        # Verify welcome email was scheduled
        mock_email_task.assert_called_once_with(user.id)
    
    def test_registration_missing_required_fields(self):
        """Test registration with missing required fields."""
        invalid_payload = {
            'email': 'test@example.com',
            # Missing password
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        response = self.client.post(
            self.url,
            data=json.dumps(invalid_payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data['errors'])
    
    @patch('apps.users.tasks.send_welcome_email_task.delay')
    def test_registration_duplicate_email(self, mock_email_task):
        """Test registration with duplicate email."""
        # Create a user first
        User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Existing',
            last_name='User'
        )
        
        response = self.client.post(
            self.url,
            data=json.dumps(self.valid_payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data['errors'])
        self.assertEqual(User.objects.count(), 1)  # No new user created
        mock_email_task.assert_not_called()
    
    @patch('apps.users.tasks.send_welcome_email_task.delay')
    def test_role_assignment_during_registration(self, mock_email_task):
        """Test that role cannot be set during registration except by superadmin."""
        # Regular user registration with role - should be ignored
        payload = self.valid_payload.copy()
        payload['role'] = 'admin'  # Try to set admin role
        
        response = self.client.post(
            self.url,
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email=payload['email'])
        self.assertEqual(user.role, 'user')  # Should be default 'user' role
    
    @override_settings(EMAIL_ENABLED=False)
    @patch('apps.users.tasks.send_welcome_email_task.delay')
    def test_registration_when_email_disabled(self, mock_email_task):
        """Test registration when email is disabled."""
        response = self.client.post(
            self.url,
            data=json.dumps(self.valid_payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        
        # Check email was not sent
        data = response.data
        self.assertFalse(data['account']['welcome_email_sent'])
        self.assertEqual(data['account']['email_status'], 'disabled')
        mock_email_task.assert_not_called()
    
    @patch('apps.users.tasks.send_welcome_email_task.delay', side_effect=Exception('Email error'))
    def test_registration_email_failure(self, mock_email_task):
        """Test that registration succeeds even if email sending fails."""
        response = self.client.post(
            self.url,
            data=json.dumps(self.valid_payload),
            content_type='application/json'
        )
        
        # Should still get a 201, but with email status failed
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        
        data = response.data
        self.assertFalse(data['account']['welcome_email_sent'])
        self.assertEqual(data['account']['email_status'], 'failed')
        mock_email_task.assert_called_once()


class UserRoleUpdateTests(APITestCase):
    """Test user role update functionality."""
    
    def setUp(self):
        # Create a regular user
        self.user = User.objects.create_user(
            email='user@example.com',
            password='testpass123',
            first_name='Regular',
            last_name='User'
        )
        
        # Create an admin user
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            role='admin'
        )
        
        # Create a superadmin user
        self.superuser = User.objects.create_user(
            email='super@example.com',
            password='superpass123',
            first_name='Super',
            last_name='Admin',
            role='superadmin'
        )
        
        self.url = reverse('user-role-update', kwargs={'user_id': str(self.user.id)})
    
    def test_update_role_unauthorized(self):
        """Test that unauthenticated users cannot update roles."""
        response = self.client.patch(
            self.url,
            data=json.dumps({'role': 'admin'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_update_role_regular_user(self):
        """Test that regular users cannot update roles."""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            self.url,
            data=json.dumps({'role': 'admin'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_admin_cannot_make_superadmin(self):
        """Test that admins cannot assign superadmin role."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            self.url,
            data=json.dumps({'role': 'superadmin'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_superadmin_can_update_roles(self):
        """Test that superadmins can update any role."""
        self.client.force_authenticate(user=self.superuser)
        response = self.client.patch(
            self.url,
            data=json.dumps({'role': 'admin'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'admin')
