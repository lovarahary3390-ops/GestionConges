from django.db import models
from django.conf import settings


class TypeConge(models.Model):
    id_type = models.AutoField(primary_key=True)
    libelle = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    nombre_jours_max = models.PositiveIntegerField()

    class Meta:
        db_table = 'type_conge'
        verbose_name = 'Type de congé'
        verbose_name_plural = 'Types de congé'

    def __str__(self):
        return self.libelle


class SoldeConge(models.Model):
    id_solde = models.AutoField(primary_key=True)
    employe = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='soldes'
    )
    annee = models.PositiveIntegerField()
    jours_acquis = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    jours_pris = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    jours_restants = models.DecimalField(max_digits=5, decimal_places=1, default=0)

    class Meta:
        db_table = 'solde_conge'
        verbose_name = 'Solde de congé'
        verbose_name_plural = 'Soldes de congé'
        unique_together = ('employe', 'annee')

    def __str__(self):
        return f"{self.employe} - {self.annee} ({self.jours_restants}j restants)"


class DemandeConge(models.Model):
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('APPROUVEE', 'Approuvée'),
        ('REFUSEE', 'Refusée'),
        ('ANNULEE', 'Annulée'),
    ]

    id_demande = models.AutoField(primary_key=True)
    employe = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='demandes'
    )
    type_conge = models.ForeignKey(
        TypeConge,
        on_delete=models.PROTECT,
        related_name='demandes'
    )
    date_demande = models.DateTimeField(auto_now_add=True)
    date_debut = models.DateField()
    date_fin = models.DateField()
    nombre_jours = models.DecimalField(max_digits=5, decimal_places=1)
    motif = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE')

    class Meta:
        db_table = 'demande_conge'
        verbose_name = 'Demande de congé'
        verbose_name_plural = 'Demandes de congé'

    def __str__(self):
        return f"Demande #{self.id_demande} - {self.employe} ({self.statut})"
