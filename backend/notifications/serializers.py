from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id_notification', 'employe', 'message', 'date_creation', 'lu']
        read_only_fields = ['id_notification', 'employe', 'date_creation']