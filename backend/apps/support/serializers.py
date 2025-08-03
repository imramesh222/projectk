from rest_framework import serializers
from .models import SupportTicket

class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = '__all__'
        ref_name = 'support.SupportTicket'  # Unique ref_name to avoid conflicts