from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("input/startAiPlay", views.startAiPlay, name = "startAiPlay"),
    path("input/endAiPlay", views.stopAiPlay, name = "endAiPlay"),
    path("input/generation", views.newGeneration, name = "newGeneration")
]