from django.db import models
from django.conf import settings
from leaves.models import DemandeConge


class Validation(models.Model):
    NIVEAU_CHOICES = [
        ('MANAGER', 'Manager'),
        ('RH', 'RH'),
        ('DIRECTION', 'Direction'),
    ]

    DECISION_CHOICES = [
        ('APPROUVEE', 'Approuvée'),
        ('REFUSEE', 'Refusée'),
    ]

    id_validation = models.AutoField(primary_key=True)
    demande = models.ForeignKey(
        DemandeConge,
        on_delete=models.CASCADE,
        related_name='validations'
    )
    validateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='validations_effectuees'
    )
    date_validation = models.DateTimeField(auto_now_add=True)
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES)
    commentaire = models.TextField(blank=True, null=True)
    niveau = models.CharField(max_length=20, choices=NIVEAU_CHOICES)

    class Meta:
        db_table = 'validation'
        verbose_name = 'Validation'
        verbose_name_plural = 'Validations'

    def __str__(self):
        return f"Validation #{self.id_validation} - {self.demande} ({self.decision})"
