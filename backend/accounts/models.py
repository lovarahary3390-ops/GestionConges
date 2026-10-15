import re

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from employees.models import Service

# Autorise lettres (avec accents), espaces, apostrophes et tirets
NOM_REGEX = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$")


def valider_nom(valeur, champ="Ce champ"):
    valeur = (valeur or "").strip()
    if not valeur:
        raise ValidationError(f"{champ} est obligatoire.")
    if not NOM_REGEX.match(valeur):
        raise ValidationError(f"{champ} ne doit pas contenir de chiffres.")
    return valeur


class Employe(AbstractUser):
    ROLE_CHOICES = [
        ('EMPLOYE', 'Employé'),
        ('RESPONSABLE', 'Responsable'),
        ('ADMIN', 'Administrateur'),
    ]

    id_employe = models.AutoField(primary_key=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    poste = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EMPLOYE')
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employes'
    )
    date_embauche = models.DateField(default=timezone.now)

    class Meta:
        db_table = 'employe'
        verbose_name = 'Employé'
        verbose_name_plural = 'Employés'
        constraints = [
            models.UniqueConstraint(
                fields=['first_name', 'last_name'],
                name='unique_nom_prenom_employe',
            )
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

    def clean(self):
        super().clean()
        self.first_name = valider_nom(self.first_name, "Le prénom")
        self.last_name = valider_nom(self.last_name, "Le nom")

        # Doublon nom + prénom, insensible à la casse, en excluant l'employé en cours de modification
        doublon = Employe.objects.filter(
            first_name__iexact=self.first_name,
            last_name__iexact=self.last_name,
        ).exclude(pk=self.pk)
        if doublon.exists():
            raise ValidationError(
                "Cet employé existe déjà. Le nom et le prénom sont déjà utilisés."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)