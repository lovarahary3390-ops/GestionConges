
from django.contrib import admin
from .models import TypeConge, SoldeConge, DemandeConge


@admin.register(TypeConge)
class TypeCongeAdmin(admin.ModelAdmin):
    list_display = ('__str__',)
    search_fields = ('__str__',)


@admin.register(SoldeConge)
class SoldeCongeAdmin(admin.ModelAdmin):
    list_display = ('__str__',)


@admin.register(DemandeConge)
class DemandeCongeAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'statut', 'date_debut', 'date_fin')
    list_filter = ('statut',)