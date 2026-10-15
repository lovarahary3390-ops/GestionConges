import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import Employe
from django.db.models import Count

print("=== DEBUT ===")
print("Total employes :", Employe.objects.count())

doublons = Employe.objects.values('first_name', 'last_name').annotate(n=Count('id_employe')).filter(n__gt=1)
for d in doublons:
    print("DOUBLON:", d)
    for e in Employe.objects.filter(first_name=d['first_name'], last_name=d['last_name']):
        print("   ->", e.id_employe, e.username, repr(e.first_name), repr(e.last_name))

print("=== FIN ===")