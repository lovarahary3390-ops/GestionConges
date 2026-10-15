from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import TypeConge, SoldeConge, DemandeConge
from .serializers import TypeCongeSerializer, SoldeCongeSerializer, DemandeCongeSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


class TypeCongeViewSet(viewsets.ModelViewSet):
    queryset = TypeConge.objects.all()
    serializer_class = TypeCongeSerializer
    permission_classes = [IsAdminOrReadOnly]


class SoldeCongeViewSet(viewsets.ModelViewSet):
    serializer_class = SoldeCongeSerializer
    # Seul l'ADMIN peut créer ou modifier un solde ; les autres le consultent seulement
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return SoldeConge.objects.all()
        return SoldeConge.objects.filter(employe=user)


class DemandeCongeViewSet(viewsets.ModelViewSet):
    serializer_class = DemandeCongeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return DemandeConge.objects.all()
        if user.role == 'RESPONSABLE':
            return DemandeConge.objects.filter(employe__service=user.service)
        return DemandeConge.objects.filter(employe=user)

    def perform_create(self, serializer):
        serializer.save(employe=self.request.user)

    def _verifier_modifiable(self, demande):
        if demande.employe_id != self.request.user.pk:
            raise PermissionDenied("Vous ne pouvez modifier que vos propres demandes.")
        if demande.statut != 'EN_ATTENTE':
            raise ValidationError("Impossible de modifier ou supprimer une demande déjà traitée.")

    def perform_update(self, serializer):
        self._verifier_modifiable(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance):
        self._verifier_modifiable(instance)
        instance.delete()