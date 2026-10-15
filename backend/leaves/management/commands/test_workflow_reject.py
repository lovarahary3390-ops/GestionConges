"""
leaves/management/commands/test_workflow_reject.py

Commande : python manage.py test_workflow_reject
Teste le cas du refus : le solde ne doit PAS diminuer.
"""

from django.core.management.base import BaseCommand
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Employe
from leaves.models import DemandeConge, TypeConge, SoldeConge


class Command(BaseCommand):
    help = "Teste le workflow de refus d'une demande de congé."

    def handle(self, *args, **options):
        self.stdout.write("=== ÉTAPE 1 : Compte LOVA (ADMIN) ===")
        lova = Employe.objects.get(username='LOVA')
        lova.role = 'ADMIN'
        lova.save()

        self.stdout.write("\n=== ÉTAPE 2 : Solde actuel ===")
        solde, _ = SoldeConge.objects.get_or_create(
            employe=lova,
            annee=2026,
            defaults={'jours_acquis': 30, 'jours_pris': 0, 'jours_restants': 30}
        )
        solde_avant = solde.jours_restants
        self.stdout.write(self.style.SUCCESS(f"Solde restant AVANT refus : {solde_avant} jours"))

        self.stdout.write("\n=== ÉTAPE 3 : Type de congé ===")
        type_conge, _ = TypeConge.objects.get_or_create(
            libelle='Congé annuel',
            defaults={'nombre_jours_max': 30}
        )

        self.stdout.write("\n=== ÉTAPE 4 : Création d'une nouvelle demande EN_ATTENTE ===")
        demande = DemandeConge.objects.create(
            employe=lova,
            type_conge=type_conge,
            date_debut='2026-11-01',
            date_fin='2026-11-03',
            nombre_jours=3,
            motif='Test refus',
            statut='EN_ATTENTE',
        )
        self.stdout.write(self.style.SUCCESS(f"OK — Demande créée, id = {demande.id_demande}"))

        self.stdout.write("\n=== ÉTAPE 5 : Appel de l'API pour REFUSER la demande ===")
        token = RefreshToken.for_user(lova).access_token
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = client.post(
            f'/api/leaves/{demande.id_demande}/reject/',
            {'commentaire': 'Refusé automatiquement par le test'},
            format='json'
        )

        self.stdout.write(f"Code de statut HTTP : {response.status_code}")
        self.stdout.write(f"Réponse : {response.data}")

        self.stdout.write("\n=== ÉTAPE 6 : Vérification finale ===")
        demande.refresh_from_db()
        solde.refresh_from_db()
        self.stdout.write(f"Statut de la demande : {demande.statut}")
        self.stdout.write(f"Solde restant APRÈS refus : {solde.jours_restants}")

        if response.status_code == 200 and demande.statut == 'REFUSEE' and solde.jours_restants == solde_avant:
            self.stdout.write(self.style.SUCCESS("\n✅ REFUS FONCTIONNEL — le solde n'a pas bougé, comme attendu"))
        else:
            self.stdout.write(self.style.ERROR("\n❌ Problème détecté — voir les détails ci-dessus"))