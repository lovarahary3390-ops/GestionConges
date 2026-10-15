from django.utils import timezone
from rest_framework import serializers
from .models import TypeConge, SoldeConge, DemandeConge


class TypeCongeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeConge
        fields = ['id_type', 'libelle', 'description', 'nombre_jours_max']


class SoldeCongeSerializer(serializers.ModelSerializer):
    employe_nom = serializers.CharField(source='employe.get_full_name', read_only=True)

    class Meta:
        model = SoldeConge
        fields = [
            'id_solde', 'employe', 'employe_nom', 'annee',
            'jours_acquis', 'jours_pris', 'jours_restants',
        ]
        read_only_fields = ['jours_restants']

    def validate(self, data):
        acquis = data.get('jours_acquis', getattr(self.instance, 'jours_acquis', 0))
        pris = data.get('jours_pris', getattr(self.instance, 'jours_pris', 0))
        if acquis < 0 or pris < 0:
            raise serializers.ValidationError("Les jours ne peuvent pas être négatifs.")
        if pris > acquis:
            raise serializers.ValidationError(
                "Les jours pris ne peuvent pas dépasser les jours acquis."
            )
        return data

    # jours_restants est toujours calculé : acquis - pris
    def create(self, validated_data):
        acquis = validated_data.get('jours_acquis', 0)
        pris = validated_data.get('jours_pris', 0)
        validated_data['jours_restants'] = acquis - pris
        return super().create(validated_data)

    def update(self, instance, validated_data):
        acquis = validated_data.get('jours_acquis', instance.jours_acquis)
        pris = validated_data.get('jours_pris', instance.jours_pris)
        validated_data['jours_restants'] = acquis - pris
        return super().update(instance, validated_data)


class DemandeCongeSerializer(serializers.ModelSerializer):
    employe_nom = serializers.CharField(source='employe.get_full_name', read_only=True)
    type_conge_libelle = serializers.CharField(source='type_conge.libelle', read_only=True)

    class Meta:
        model = DemandeConge
        fields = [
            'id_demande', 'employe', 'employe_nom', 'type_conge', 'type_conge_libelle',
            'date_demande', 'date_debut', 'date_fin', 'nombre_jours', 'motif', 'statut',
        ]
        # nombre_jours est calculé par le serveur : une valeur envoyée par React est ignorée
        read_only_fields = ['id_demande', 'date_demande', 'statut', 'employe', 'nombre_jours']

    def validate(self, data):
        instance = self.instance
        date_debut = data.get('date_debut', getattr(instance, 'date_debut', None))
        date_fin = data.get('date_fin', getattr(instance, 'date_fin', None))

        if not date_debut or not date_fin:
            return data

        if date_fin < date_debut:
            raise serializers.ValidationError(
                "La date de fin ne peut pas être antérieure à la date de début."
            )

        # Pas de demande dans le passé (uniquement à la création)
        if instance is None and date_debut < timezone.localdate():
            raise serializers.ValidationError(
                "La date de début ne peut pas être dans le passé."
            )

        # Une demande ne peut pas couvrir deux années (le solde est annuel)
        if date_debut.year != date_fin.year:
            raise serializers.ValidationError(
                "Une demande ne peut pas couvrir deux années. Faites deux demandes séparées."
            )

        nombre_jours = (date_fin - date_debut).days + 1

        # Employé concerné : le propriétaire de la demande, ou l'utilisateur connecté à la création
        employe = instance.employe if instance else self.context['request'].user

        # Pas de chevauchement avec une demande en attente ou approuvée
        chevauchement = DemandeConge.objects.filter(
            employe=employe,
            statut__in=['EN_ATTENTE', 'APPROUVEE'],
            date_debut__lte=date_fin,
            date_fin__gte=date_debut,
        )
        if instance is not None:
            chevauchement = chevauchement.exclude(pk=instance.pk)
        if chevauchement.exists():
            raise serializers.ValidationError(
                "Cette période chevauche une demande existante."
            )

        # Le solde doit exister et suffire
        solde = SoldeConge.objects.filter(employe=employe, annee=date_debut.year).first()
        if solde is None:
            raise serializers.ValidationError(
                f"Aucun solde de congé n'est défini pour {date_debut.year}. "
                "Contactez l'administrateur."
            )
        if nombre_jours > solde.jours_restants:
            raise serializers.ValidationError(
                f"Solde de congé insuffisant : {solde.jours_restants} jour(s) restant(s) "
                f"pour {nombre_jours} jour(s) demandé(s)."
            )

        data['nombre_jours'] = nombre_jours
        return data