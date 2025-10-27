from rest_framework.routers import DefaultRouter

from .views import (
    PromptTemplateVersionViewSet,
    PromptTemplateViewSet,
    PromptVersionViewSet,
    PromptViewSet,
    TagViewSet,
)

router = DefaultRouter()
router.register("tags", TagViewSet, basename="tag")
router.register("prompts", PromptViewSet, basename="prompt")
router.register("prompt-versions", PromptVersionViewSet, basename="prompt-version")
router.register("prompt-templates", PromptTemplateViewSet, basename="prompt-template")
router.register(
    "prompt-template-versions",
    PromptTemplateVersionViewSet,
    basename="prompt-template-version",
)

urlpatterns = router.urls
