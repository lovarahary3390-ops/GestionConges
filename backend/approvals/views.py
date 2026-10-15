from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Validation
from .serializers import ValidationSerializer
from leaves.models import DemandeConge, SoldeConge
from notifications.models import Notification

LIBELLES = {'APPROUVEE': 'approuvée', 'REFUSEE': 'refusée'}


class IsResponsableOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('RESPONSABLE', 'ADMIN')
        )


class ValidationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ValidationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Validation.objects.all()
        return Validation.objects.filter(demande__employe=user)


def _erreur(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({"detail": message}, status=code)


class DemandeCongeWorkflowViewSet(viewsets.ViewSet):
    permission_classes = [IsResponsableOrAdmin]

    def _traiter(self, request, pk, decision):
        commentaire = (request.data.get('commentaire') or '').strip()

        # RÈGLE : un refus doit toujours être motivé
        if decision == 'REFUSEE' and not commentaire:
            return _erreur("Un motif de refus est obligatoire.")

        # Tout est dans une transaction : si une étape échoue, rien n'est enregistré
        with transaction.atomic():
            # RÈGLE : verrou sur la demande, deux clics simultanés ne la traitent qu'une fois
            try:
                demande = DemandeConge.objects.select_for_update().get(pk=pk)
            except DemandeConge.DoesNotExist:
                return _erreur("Demande introuvable.", status.HTTP_404_NOT_FOUND)

            valideur = request.user
            employe = demande.employe

            # RÈGLE : on ne valide jamais sa propre demande
            if employe.pk == valideur.pk:
                return _erreur(
                    "Vous ne pouvez pas traiter votre propre demande.",
                    status.HTTP_403_FORBIDDEN,
                )

            # RÈGLE : un responsable ne traite que les demandes de son service
            if valideur.role == 'RESPONSABLE':
                if valideur.service_id is None or employe.service_id != valideur.service_id:
                    return _erreur(
                        "Cette demande n'appartient pas à votre service.",
                        status.HTTP_403_FORBIDDEN,
                    )

            # RÈGLE : une demande ne se traite qu'une seule fois
            if demande.statut != 'EN_ATTENTE':
                return _erreur("Cette demande a déjà été traitée.")

            if decision == 'APPROUVEE':
                # RÈGLE : la durée est recalculée côté serveur (on ne fait pas confiance au client)
                if demande.date_fin < demande.date_debut:
                    return _erreur("Les dates de cette demande sont invalides.")
                if demande.date_debut.year != demande.date_fin.year:
                    return _erreur(
                        "Cette demande couvre deux années. "
                        "L'employé doit la scinder en deux demandes."
                    )
                jours = (demande.date_fin - demande.date_debut).days + 1

                # RÈGLE : pas de chevauchement avec un congé déjà approuvé
                chevauchement = DemandeConge.objects.filter(
                    employe=employe,
                    statut='APPROUVEE',
                    date_debut__lte=demande.date_fin,
                    date_fin__gte=demande.date_debut,
                ).exclude(pk=demande.pk)
                if chevauchement.exists():
                    return _erreur(
                        "Cette période chevauche un congé déjà approuvé pour cet employé."
                    )

                # RÈGLE : le solde doit exister et être suffisant (verrouillé pendant la mise à jour)
                solde = SoldeConge.objects.select_for_update().filter(
                    employe=employe, annee=demande.date_debut.year
                ).first()
                if solde is None:
                    return _erreur(
                        f"Aucun solde de congé défini pour {demande.date_debut.year}."
                    )
                if jours > solde.jours_restants:
                    return _erreur(
                        f"Solde de congés insuffisant : {solde.jours_restants} jour(s) "
                        f"restant(s) pour {jours} jour(s) demandé(s)."
                    )

                solde.jours_pris += jours
                solde.jours_restants -= jours
                solde.save()
                demande.nombre_jours = jours

            # RÈGLE : un refus ne touche jamais au solde
            demande.statut = decision
            demande.save()

            Validation.objects.create(
                demande=demande,
                validateur=valideur,
                decision=decision,
                commentaire=commentaire,
                niveau='MANAGER' if valideur.role == 'RESPONSABLE' else 'DIRECTION',
            )

            message = (
                f"Votre demande de congé du {demande.date_debut} au {demande.date_fin} "
                f"a été {LIBELLES[decision]}."
            )
            if decision == 'REFUSEE':
                message += f" Motif : {commentaire}"
            Notification.objects.create(employe=employe, message=message)

        return Response({
            "detail": f"Demande {LIBELLES[decision]}.",
            "statut": demande.statut,
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        return self._traiter(request, pk, 'APPROUVEE')

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        return self._traiter(request, pk, 'REFUSEE')