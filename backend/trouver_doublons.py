from accounts.models import Employe
from django.db.models import Count

with open('resultat_doublons.txt', 'w', encoding='utf-8') as f:
    total = Employe.objects.count()
    f.write(f"Nombre total d'employes : {total}\n\n")
    doublons = Employe.objects.values('first_name', 'last_name').annotate(n=Count('id_employe')).filter(n__gt=1)
    for d in doublons:
        f.write(f"{d}\n")
        for e in Employe.objects.filter(first_name=d['first_name'], last_name=d['last_name']):
            f.write(f"  - {e.id_employe} {e.username} {e.first_name!r} {e.last_name!r}\n")
    f.write("\nFIN\n")