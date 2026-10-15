import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import Employe

corrections = {
    1: ('Admin', 'Systeme'),
    2: ('Lova', 'Rakoto'),
    5: ('Tiana', 'Randria'),
}

for id_employe, (prenom, nom) in corrections.items():
    e = Employe.objects.get(id_employe=id_employe)
    e.first_name = prenom
    e.last_name = nom
    e.save()
    print('Corrigé :', e.id_employe, e.username, e.first_name, e.last_name)

print("=== FIN ===")