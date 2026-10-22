
from django.contrib import admin
from .models import TypeConge, SoldeConge, DemandeConge


@admin.register(TypeConge)
class TypeCongeAdmin(admin.ModelAdmin):
    list_display = ('libelle', 'nombre_jours_max')
    search_fields = ('libelle',)


@admin.register(SoldeConge)
class SoldeCongeAdmin(admin.ModelAdmin):
    list_display = (
        'employe',
        'annee',
        'jours_acquis',
        'jours_pris',
        'jours_restants',
    )
    list_filter = ('annee',)
    search_fields = (
        'employe__username',
        'employe__first_name',
        'employe__last_name',
    )
    ordering = ('employe', 'annee')


@admin.register(DemandeConge)
class DemandeCongeAdmin(admin.ModelAdmin):
    list_display = (
        '__str__',
        'statut',
        'date_debut',
        'date_fin',
    )
    list_filter = ('statut',)
