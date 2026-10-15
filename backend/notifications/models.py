from django.db import models
from django.conf import settings


class Notification(models.Model):
    id_notification = models.AutoField(primary_key=True)
    employe = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)
    lu = models.BooleanField(default=False)

    class Meta:
        db_table = 'notification'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-date_creation']

    def __str__(self):
        return f"Notification #{self.id_notification} - {self.employe} ({'lu' if self.lu else 'non lu'})"
