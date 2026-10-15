"""
leaves/management/commands/test_workflow.py

Commande : python manage.py test_workflow
Teste automatiquement le workflow complet : création d'une demande,
puis approbation via l'API.
"""

from django.core.management.base import BaseCommand
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Employe
from leaves.models import DemandeConge, TypeConge, SoldeConge


class Command(BaseCommand):
    help = "Teste le workflow complet de demande et d'approbation de congé."

    def handle(self, *args, **options):
        self.stdout.write("=== ÉTAPE 1 : Préparation du compte LOVA (rôle ADMIN) ===")
        lova = Employe.objects.get(username='LOVA')
        lova.role = 'ADMIN'
        lova.save()
        self.stdout.write(self.style.SUCCESS(f"OK — {lova.username} est maintenant {lova.role}"))

        self.stdout.write("\n=== ÉTAPE 2 : Création d'un solde de congé (30 jours) ===")
        solde, created = SoldeConge.objects.get_or_create(
            employe=lova,
            annee=2026,
            defaults={'jours_acquis': 30, 'jours_pris': 0, 'jours_restants': 30}
        )
        if not created:
            solde.jours_restants = 30
            solde.jours_pris = 0
            solde.save()
        self.stdout.write(self.style.SUCCESS(f"OK — Solde restant : {solde.jours_restants} jours"))

        self.stdout.write("\n=== ÉTAPE 3 : Création d'un type de congé ===")
        type_conge, _ = TypeConge.objects.get_or_create(
            libelle='Congé annuel',
            defaults={'nombre_jours_max': 30}
        )
        self.stdout.write(self.style.SUCCESS(f"OK — Type : {type_conge.libelle}"))

        self.stdout.write("\n=== ÉTAPE 4 : Création d'une demande de congé EN_ATTENTE ===")
        demande = DemandeConge.objects.create(
            employe=lova,
            type_conge=type_conge,
            date_debut='2026-10-01',
            date_fin='2026-10-05',
            nombre_jours=5,
            motif='Test automatique du workflow',
            statut='EN_ATTENTE',
        )
        self.stdout.write(self.style.SUCCESS(f"OK — Demande créée, id = {demande.id_demande}, statut = {demande.statut}"))

        self.stdout.write("\n=== ÉTAPE 5 : Appel de l'API pour approuver la demande ===")
        token = RefreshToken.for_user(lova).access_token
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = client.post(
            f'/api/leaves/{demande.id_demande}/approve/',
            {'commentaire': 'Approuvé automatiquement par le test'},
            format='json'
        )

        self.stdout.write(f"Code de statut HTTP : {response.status_code}")
        self.stdout.write(f"Réponse : {response.data}")

        self.stdout.write("\n=== ÉTAPE 6 : Vérification finale en base ===")
        demande.refresh_from_db()
        solde.refresh_from_db()
        self.stdout.write(f"Statut de la demande : {demande.statut}")
        self.stdout.write(f"Solde restant après approbation : {solde.jours_restants}")

        if response.status_code == 200 and demande.statut == 'APPROUVEE':
            self.stdout.write(self.style.SUCCESS("\n✅ WORKFLOW FONCTIONNEL DE BOUT EN BOUT"))
        else:
            self.stdout.write(self.style.ERROR("\n❌ Quelque chose n'a pas fonctionné — voir les détails ci-dessus"))