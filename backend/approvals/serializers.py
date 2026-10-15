from rest_framework import serializers
from .models import Validation


class ValidationSerializer(serializers.ModelSerializer):
    validateur_nom = serializers.CharField(source='validateur.get_full_name', read_only=True)

    class Meta:
        model = Validation
        fields = [
            'id_validation', 'demande', 'validateur', 'validateur_nom',
            'date_validation', 'decision', 'commentaire', 'niveau',
        ]
        read_only_fields = ['id_validation', 'date_validation', 'validateur']