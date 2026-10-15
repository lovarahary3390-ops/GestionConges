import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import Employe

u = Employe.objects.get(username='Admin')
u.role = 'ADMIN'
u.save()
print('Corrigé :', u.username, '->', u.role)