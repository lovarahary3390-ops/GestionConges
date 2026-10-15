from rest_framework.routers import DefaultRouter
from .views import TypeCongeViewSet, SoldeCongeViewSet, DemandeCongeViewSet

router = DefaultRouter()
router.register('leave-types', TypeCongeViewSet, basename='leave-type')
router.register('leave-balances', SoldeCongeViewSet, basename='leave-balance')
router.register('leaves', DemandeCongeViewSet, basename='leave')

urlpatterns = router.urls