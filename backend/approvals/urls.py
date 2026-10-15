from rest_framework.routers import DefaultRouter
from .views import ValidationViewSet, DemandeCongeWorkflowViewSet

router = DefaultRouter()
router.register('validations', ValidationViewSet, basename='validation')
router.register('leaves', DemandeCongeWorkflowViewSet, basename='leave-workflow')

urlpatterns = router.urls