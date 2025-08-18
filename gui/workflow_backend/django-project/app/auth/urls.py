from django.urls import path
from . import authViews

urlpatterns = [
    path("health/", authViews.health_check, name="health_check"),
    path("protected/", authViews.protected_view, name="protected_view"),
    path("profile/", authViews.user_profile, name="user_profile"),
    path("test-post/", authViews.test_post, name="test_post"),
]
