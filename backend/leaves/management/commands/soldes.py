from django.core.management.base import BaseCommand
from leaves.models import SoldeConge


class Command(BaseCommand):
    help = "Affiche le solde de congés de chaque employé."

    def add_arguments(self, parser):
        parser.add_argument('identifiant', nargs='?', help="Identifiant d'un employé (facultatif)")
        parser.add_argument('--annee', type=int, help="Année à afficher (facultatif)")

    def handle(self, *args, **options):
        soldes = SoldeConge.objects.select_related('employe').order_by(
            'employe__last_name', 'employe__first_name', '-annee'
        )
        if options['identifiant']:
            soldes = soldes.filter(employe__username=options['identifiant'])
        if options['annee']:
            soldes = soldes.filter(annee=options['annee'])

        if not soldes.exists():
            self.stdout.write("Aucun solde trouvé.")
            return

        self.stdout.write(f"{'EMPLOYÉ':<28}{'ANNÉE':<8}{'ACQUIS':>8}{'PRIS':>8}{'RESTANTS':>10}")
        self.stdout.write("-" * 62)
        for s in soldes:
            nom = f"{s.employe.first_name} {s.employe.last_name}".strip() or s.employe.username
            self.stdout.write(
                f"{nom[:27]:<28}{s.annee:<8}{s.jours_acquis:>8}{s.jours_pris:>8}{s.jours_restants:>10}"
            )