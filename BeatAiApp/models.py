from django.db import models
from django.db.models.fields.json import JSONField
import json

# Create your models here.
class Client(models.Model):
    idClient = models.IntegerField(primary_key=True)
    population = models.IntegerField()
    incLean = models.BooleanField()
    rows = models.IntegerField()
    columns = models.IntegerField()
    height = models.IntegerField()
    width = models.IntegerField()
    stopThread = models.BooleanField(default=False)
    finishedThread = models.BooleanField(default=False)
    minDistance = models.IntegerField(default=-1)
    map = JSONField(blank=True, null=True)
    #walls = JSONField(blank=True, null=True)
    balls = JSONField(blank=True, null=True)
    endX = models.IntegerField(blank=True, null=True)
    endY = models.IntegerField(blank=True, null=True)
    possibleMov = models.IntegerField(default=40)
    cicleToRemove = models.IntegerField(default=30)
    cicleToDecrease = models.IntegerField(default=90)

class Generation(models.Model):
    output = models.ForeignKey(Client, on_delete=models.CASCADE)

    value = JSONField()
    win = models.BooleanField(default=False)

    def __str__(self):
        return json.dumps(self.value)
