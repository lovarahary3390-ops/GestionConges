from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Employe, valider_nom
from employees.serializers import ServiceSerializer


def _normaliser(valeur):
    return (valeur or "").strip()


class EmployeSerializer(serializers.ModelSerializer):
    service_detail = ServiceSerializer(source='service', read_only=True)

    class Meta:
        model = Employe
        fields = [
            'id_employe', 'username', 'first_name', 'last_name', 'email',
            'telephone', 'poste', 'role', 'service', 'service_detail',
            'is_active', 'date_joined', 'date_embauche',
        ]
        read_only_fields = ['id_employe', 'date_joined', 'date_embauche']

    def validate_first_name(self, valeur):
        valeur = _normaliser(valeur)
        try:
            return valider_nom(valeur, "Le prénom")
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages[0])

    def validate_last_name(self, valeur):
        valeur = _normaliser(valeur)
        try:
            return valider_nom(valeur, "Le nom")
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages[0])

    def validate(self, data):
        first_name = data.get('first_name', getattr(self.instance, 'first_name', None))
        last_name = data.get('last_name', getattr(self.instance, 'last_name', None))

        if first_name and last_name:
            doublon = Employe.objects.filter(
                first_name__iexact=first_name,
                last_name__iexact=last_name,
            )
            if self.instance is not None:
                doublon = doublon.exclude(pk=self.instance.pk)
            if doublon.exists():
                raise serializers.ValidationError(
                    "Cet employé existe déjà. Le nom et le prénom sont déjà utilisés."
                )
        return data


class EmployeCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Employe
        fields = [
            'username', 'first_name', 'last_name', 'email', 'password',
            'telephone', 'poste', 'role', 'service',
        ]

    def validate_first_name(self, valeur):
        valeur = _normaliser(valeur)
        try:
            return valider_nom(valeur, "Le prénom")
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages[0])

    def validate_last_name(self, valeur):
        valeur = _normaliser(valeur)
        try:
            return valider_nom(valeur, "Le nom")
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages[0])

    def validate(self, data):
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        if Employe.objects.filter(first_name__iexact=first_name, last_name__iexact=last_name).exists():
            raise serializers.ValidationError(
                "Cet employé existe déjà. Le nom et le prénom sont déjà utilisés."
            )
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        employe = Employe(**validated_data)
        employe.set_password(password)
        employe.save()  # déclenche aussi full_clean() côté modèle
        return employe


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['id_employe'] = self.user.id_employe
        data['username'] = self.user.username
        data['first_name'] = self.user.first_name
        data['last_name'] = self.user.last_name
        data['email'] = self.user.email
        return data