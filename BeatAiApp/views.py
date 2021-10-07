from typing import Tuple
from django.shortcuts import render
from django.http import HttpResponse, response
from django.views.generic import View
from django.http import JsonResponse
from .models import Client, Generation
from time import sleep

from .aiHandling import eval_genomes
from .utils import *
from .player import Player
from .wall import Wall
from .ball import Ball
from .lines import Lines

import threading
import os
import neat
import json

sideSquare = 10

# Those are the views that handling all the request.

def index(request):

    #Here I could see if there was a previous connection and remember the level
    #I don't know how I could rember the clients

    return render(request, "main/base.html", {})


def startAiPlay(request):
    #global map, balls, width, height, rows, columns, incLean, local_dir, thread
    global currentIdClient

    if request.is_ajax():
        print(request.POST.get("value"))

        #Select an Id for the Client
        idClient = setIdClient()
        currentIdClient = idClient

        #load the values form the arrived message
        map = json.loads(request.POST.get("map"))
        incLean = True if request.POST.get("incremental") == 'true' else False
        rows = int(request.POST.get("rows"))
        columns = int(request.POST.get("columns"))
        width = columns * sideSquare
        height = rows * sideSquare
        population = int(request.POST.get("population"))

        #create a db object
        client = Client(
            idClient = idClient,
            population = population,
            incLean = incLean,
            rows = rows,
            columns = columns,
            height = height,
            width = width,
            map = map
        )

        setPopulation(population, idClient)

        #load the array of balls
        balls = []
        ballsSring = request.POST.getlist("balls[]")
        #print(ballsSring)
        for ballStr in ballsSring:
            ballJson = json.loads(ballStr)
            
            ball = Ball(ballJson['nRow'],ballJson['nCol'] , sideSquare, width, height)
            
            ball.dir = ballJson['dir']
            ball.initSide = ballJson['initSide']
            ball.side = ballJson['initSide']

            balls.append(ball)

        #create end save the objects

        client.balls = createJsonArrayBalls(balls)

        #end = End(findElement(3))
        client.endX = findElement(map, 3)[1] * sideSquare
        client.endY = findElement(map, 3)[0] * sideSquare
        
        #client.walls = json.dumps(createWallArray(map))
        
        #before starting the neat alghorithm I have to dave to db the object
        client.save()

        # Determine path to configuration file. This path manipulation is
        # here so that the script will run successfully regardless of the
        # current working directory.
        config_path = os.path.join(os.path.dirname(__file__), 'neatConfigs/clients/' + str(idClient) + '.txt')

        #start the main funciton in a thread to separate the request and response of the algorithm and the web page
        thread = threading.Thread(target = run, args = (config_path, idClient, ))
        thread.start()

        return JsonResponse({
            "value": "Started Ai Play",
            "idClient" : idClient
            }, status = 200)

    else:
        return JsonResponse({"value": "BadRequest"}, status = 200)

def stopAiPlay(request):
    #global thread, stopThread
    if request.is_ajax():
        print(request.POST.get("value"), flush = True)

        idClient = int(request.POST.get('idClient')) 
        client = Client.objects.get(idClient=idClient)

        client.stopThread = True
        client.save(update_fields=['stopThread'])

        #lient.save(update_fields=['stopThread'])

        while not client.finishedThread:
            #print("WAIT", flush = True)
            client.refresh_from_db()
            sleep(0.05)
            continue

        print("FINISHED WAITING", flush = True)


        #Have to block and delate the Thread
        try:
            delateConfig(idClient)
            client.delete()
        except:
            print("Error Delating the config of this client: " + idClient)

        '''
        with threading.Lock():
            stopThread = True
        '''

        #Using only the variable stopThred I hope it will be seen by the thread and finish it
        '''
        try:
            if (thread.is_alive()):
                thread.join()
        except:
            print("errore nel Thread")
        '''

        #Theorically I don't need anymore global variables so I don't have to reset it
        #resetVaribleServer()

        print("Stoppped Thread")

        return JsonResponse({"value": "Stopped Ai Play"}, status = 200)
    else:
        return JsonResponse({"value": "BadRequest"}, status = 200)


def newGeneration(request):

    if request.is_ajax():
        print("arrivedRequest", flush = True)

        idClient = int(request.POST.get('idClient')) 
        client = Client.objects.get(idClient=idClient)

        genRequest = (int(request.POST.get('generation'))) #+1 is because the count in the db and the id is starting from 1

        print("genRequest: " + str(genRequest))

        #give to the server two more generation to make the thing more fluent

        while genRequest >= client.generation_set.count() and not client.stopThread:
            continue
        
        #If arrived an unexpected generation respond with an error
        try:
            response = client.generation_set.all()[genRequest].value
        except:
            return JsonResponse({"value": "BadGenerationRequest"}, status = 400)

        #responseJson = json.dumps(response)

        print("sentResponse", flush = True)

        if(client.stopThread):
            return JsonResponse({"value": "Stopped"}, status = 200)
        else:
            return JsonResponse({
                "value": "GenerationRedy",
                "outputsGeneration": response,
                "win" : client.generation_set.all()[genRequest].win
                }, status = 200)

    else :
        return JsonResponse({"value": "BadRequest"}, status = 400)


def run(config_file, idClient):
    #global end, walls, balls, minDistance

    """
    runs the NEAT algorithm to train a neural network to play the game
    :param config_file: location of config file
    :return: None
    """
    config = neat.config.Config(neat.DefaultGenome, neat.DefaultReproduction,
                         neat.DefaultSpeciesSet, neat.DefaultStagnation,
                         config_file, config_information=idClient)

    # Create the population, which is the top-level object for a NEAT run.
    p = neat.Population(config)

    # Add a stdout reporter to show progress in the terminal.
    #p.add_reporter(neat.StdOutReporter(True))
    #stats = neat.StatisticsReporter()
    #p.add_reporter(stats)
    #p.add_reporter(neat.Checkpointer(5))

    winner = p.run(eval_genomes, None)

    print('\nBest genome:\n{!s}'.format(winner))

