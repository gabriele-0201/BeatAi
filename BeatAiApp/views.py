import json
from typing import Tuple
from django.shortcuts import render
from django.http import HttpResponse, response
from django.views.generic import View

from django.http import JsonResponse
from .player import Player
from .wall import Wall
from .ball import Ball
from .lines import Lines
import threading
import os
import neat
import math
import time

import logging

logger = logging.getLogger(__name__)

gen = 0

# Every element rapresent the outputs of each generation
# Each output is made by an array, each element is a player
# For every player there is an array of tuple wich represent the movement
# Tuple = (upDown, rightLeft)
generationOutputs = []

nets = []
ge = []
players = []  

walls = []
balls = []

rows = -1
columns = -1
height = -1
width = -1
sideSquare = 10

cicleToRemove = 90

cicleToDecrease = 30

minDistance = -1

possibleMov = 40

win = False
incLean = True

idClient = -1

local_dir = ''

stopThread = False
thread = None

# Create your views here.

def index(request):
    resetVaribleServer()

    return render(request, "main/base.html", {})


def startAiPlay(request):
    global map, balls, width, height, rows, columns, incLean, local_dir, thread

    if request.is_ajax():
        print(request.POST.get("value"))

        #load the map
        map = json.loads(request.POST.get("map"))

        incLean = True if request.POST.get("incremental") == 'true' else False

        #load nColumns and nRows
        rows = int(request.POST.get("rows"))
        columns = int(request.POST.get("columns"))
        width = columns * sideSquare
        height = rows * sideSquare

        #load the array of ball
        ballsSring = request.POST.getlist("balls[]")
        for ballStr in ballsSring:
            ballJson = json.loads(ballStr)
            
            ball = Ball(ballJson['nRow'],ballJson['nCol'] , sideSquare, width, height)
            
            ball.dir = ballJson['dir']
            ball.initSide = ballJson['initSide']

            balls.append(ball)
        

        local_dir = os.path.dirname(__file__)

        setIdClient()
    
        setPopulation(int(request.POST.get("population")))

        # Determine path to configuration file. This path manipulation is
        # here so that the script will run successfully regardless of the
        # current working directory.
        config_path = os.path.join(local_dir, 'neatConfigs/clients/' + str(idClient) + '.txt')

        #start the main funciton in a thread to separate the request and response of the algorithm and the web page
        thread = threading.Thread(target = run, args = (config_path, ))
        thread.start() #run(config_path)
        

        return JsonResponse({"value": "Started Ai Play"}, status = 200)

    else:
        return JsonResponse({"value": "BadRequest"}, status = 200)

def stopAiPlay(request):
    global thread, stopThread
    if request.is_ajax():
        print(request.POST.get("value"))

        #Have to block and delate the Thread
        try:
            delateConfig()
        except:
            print("errore nell'elim config")

        with threading.Lock():
            stopThread = True
        
        try:
            if (thread.is_alive()):
                thread.join()
        except:
            print("errore nel Thread")


        resetVaribleServer()

        print("arrivato in fondo")

        return JsonResponse({"value": "Stopped Ai Play"}, status = 200)
    else:
        return JsonResponse({"value": "BadRequest"}, status = 200)


def newGeneration(request):
    global generationOutputs

    if request.is_ajax():
        #print("arrivedRequest")
        logger.debug("arrivedRequest")

        genRequest = int(request.POST.get('generation'))

        #give to the server two more generation to make the thing more fluent

        while genRequest >= gen and not stopThread:
            continue
        
        #If arrived an unexpected generation respond with an error
        try:
            response = generationOutputs[genRequest]
        except:
            return JsonResponse({"value": "BadGenerationRequest"}, status = 400)

        responseJson = json.dumps(response)

        print("sentResponse")

        #print(responseJson)

        if(stopThread):
            return JsonResponse({"value": "Stopped"}, status = 200)
        else:
            return JsonResponse({
                "value": "GenerationRedy",
                "outputsGeneration": responseJson,
                "win" : win
                }, status = 200)

    else :
        return JsonResponse({"value": "BadRequest"}, status = 400)

#Setting the IP of the client
def setIdClient():
    global idClient

    config_list_path = os.path.join(local_dir, 'neatConfigs/clients/')

    files = os.listdir(config_list_path)

    ids = [n[:(len(n) - 4)] for n in files]

    ids.sort()

    idClient = 1 if len(ids) == 0 else (int(ids[-1]) + 1)

    print(idClient)


def setPopulation(pop):
    config_path = os.path.join(local_dir, 'neatConfigs/config-feedforward.txt')

    with open(config_path, 'r') as f:
        data = f.read()

    data = data.replace('POPULATION_TO_BE_SET', str(pop))

    new_config_path = os.path.join(local_dir, 'neatConfigs/clients/' + str(idClient) + '.txt')

    print(new_config_path)

    with open(new_config_path, 'w') as f:
        f.write(data)

def delateConfig():

    config_file = os.path.join(local_dir, 'neatConfigs/clients/' + str(idClient) + '.txt')

    if os.path.isfile(config_file):
        os.remove(config_file)
    else:
        print(f'Error: {config_file} not a valid filename')

def resetVaribleServer():
    global gen, generationOutputs, nets, ge, players, walls, balls, rows, columns, height, width, minDistance, win, incLean, idClient, local_dir, stopThread, possibleMov, thread
    
    gen = 0
    generationOutputs = []
    nets = []
    ge = []
    players = []  
    walls = []
    balls = []
    rows = -1
    columns = -1
    height = -1
    width = -1
    minDistance = -1
    possibleMov = 40
    win = False
    incLean = True
    idClient = -1
    local_dir = ''
    stopThread = False
    thread = None

def run(config_file):
    global end, walls, balls, minDistance

    #create end object and walls array

    end = End(findElement(3))
    
    createWallArray()

    minDistance = -1

    """
    runs the NEAT algorithm to train a neural network to play the game
    :param config_file: location of config file
    :return: None
    """
    config = neat.config.Config(neat.DefaultGenome, neat.DefaultReproduction,
                         neat.DefaultSpeciesSet, neat.DefaultStagnation,
                         config_file)

    # Create the population, which is the top-level object for a NEAT run.
    p = neat.Population(config)

    # Add a stdout reporter to show progress in the terminal.
    #p.add_reporter(neat.StdOutReporter(True))
    #stats = neat.StatisticsReporter()
    #p.add_reporter(stats)
    #p.add_reporter(neat.Checkpointer(5))

    winner = p.run(eval_genomes, None)

    print('\nBest genome:\n{!s}'.format(winner))

def findElement(n):
    for i in range(len(map)):
        for j in range(len(map[i])):
            if(map[i][j] == n):
                return i, j
    
    return -1, -1

def moveObjects(walls, balls):
    for ball in balls:
        ball.move(walls)
        #print(str(ball.x) + " - " + str(ball.y))

def createWallArray():
    global walls

    for i in range(len(map)):
        for j in range(len(map[i])):
            if(map[i][j] == 2):
                walls.append(Wall(i, j, sideSquare))

def restartGame(balls):
    for ball in balls:
        ball.side = ball.initSide
        ball.x = ball.startX
        ball.y = ball.startY

def currentMillis():
    return round(time.time() * 1000)

class End:
    def __init__(self, nRowAndNcol):
        self.x = nRowAndNcol[1] * sideSquare
        self.y = nRowAndNcol[0] * sideSquare

def eval_genomes(genomes, config):
    global nets, ge, inputs, outputs, gen, generationOutputs, minDistance, walls, possibleMov

    # start by creating lists holding the genome itself, the
    # neural network associated with the genome and the
    # bird object that uses that network to play
    
    for genome_id, genome in genomes:
        genome.fitness = 0  # start with fitness level of 0
        net = neat.nn.FeedForwardNetwork.create(genome, config)
        nets.append(net)
        ge.append(genome)
        players.append(Player(findElement(1), sideSquare, width, height, rows, columns))
    
    generationOutputs.append([[] for _ in range(len(genomes))])

    toRemove = []
    
    if(incLean and gen != 0 and gen % 5 == 0):
        possibleMov = possibleMov + 50

    for i, genomeTuple in enumerate(genomes):
        genome = genomeTuple[1]

        running = True

        #This is the only way to stop the neat algorithm
        if(stopThread):
            genome.fitness = 1000000
            break

        restartGame(balls)

        minDistance = getDistance(players[i], end)

        movements = 0

        while running and movements <= possibleMov:

            mesureLinesS(players[i])

            #create the output
            #Now the outputs have to be an array of array (the interith array has only two values, the first Up/Down and the secondo Left/Right)

            outputArray = nets[i].activate((players[i].lines.upLine, players[i].lines.downLine, players[i].lines.leftLine, players[i].lines.rightLine, players[i].lines.upRightLine, players[i].lines.upLeftLine, players[i].lines.downRightLine, players[i].lines.downLeftLine, players[i].x, players[i].y, end.x, end.y))

            output = []

            if (outputArray[0] > 0.5):
                output.append('up')
            elif (outputArray[0] < -0.5):
                output.append('down')
            else:
                output.append('')

            if (outputArray[1] > 0.5):
                output.append('right')
            elif (outputArray[1] < -0.5):
                output.append('left')
            else:
                output.append('')

            generationOutputs[gen][i].append(output)

            #Now I have to remove fitness If the output make a move to a lenght of zero
            #for i, genome in enumerate(ge):
            
            '''
            if(players[i].lines.upLine == 0 and generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][0] == 'up'):
                genome.fitness -= 3

            if(players[i].lines.downLine == 0 and generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][0] == 'down'):
                genome.fitness -= 3

            if(players[i].lines.rightLine == 0 and generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][1] == 'right'):
                genome.fitness -= 3

            if(players[i].lines.leftLine == 0 and generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][1] == 'left'):
                genome.fitness -= 3
            '''

            if(generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][0] == 'up'): # little bit sketchy
                generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][0] = players[i].moveUp(walls)
            elif(generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][0]  == 'down'):
                generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][0] = players[i].moveDown(walls)
            else:
                generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][0] = players[i].y

            if(generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][1]  == 'right'):
                generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][1] = players[i].moveRight(walls)
            elif(generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][1]  == 'left'):
                generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][1] = players[i].moveLeft(walls)
            else:
                generationOutputs[gen][i][len(generationOutputs[gen][i]) - 1][1] = players[i].x


            players[i].addToHistory()
            moveObjects(walls, balls)

            #The collision is simply if some player is dead or not
            #lower the fitness and remove the player who collide with the balls or other objects
            #to remove properly the objects I have to sort the indexes before use the array to remove them

            #Remove fitness if the player is stall in a single place for too many time

            if(players[i].haveToDecrease(cicleToDecrease)):
                genome.fitness -= 2
                #players[i].clearHistory()
                #print("descrease to: " + str(i))

            if(checkCollisionAIS(players[i])):
                genome.fitness -= 50
                running = False
                toRemove.append(i)
                break

            if(checkWinAi(players[i])):
                genome.fitness = 1000000
                running = False
                break

            if(players[i].haveToRemove(cicleToRemove)):
                genome.fitness -= 10
                running = False
                toRemove.append(i)
                break

            #add fitness to the player who is more near to the end

            nowDistance = getDistance(players[i], end)
            #print(nowDistance)

            if(math.ceil(nowDistance) < math.floor(minDistance)):
                genome.fitness += 10
                minDistance = nowDistance

            if(incLean):
                movements = movements + 1


    toRemove.sort(reverse=True)

    for index in toRemove:
        nets.pop(index)
        ge.pop(index)
        players.pop(index)

    if(incLean):
        while len(nets) > 0:
            nets.pop()
            ge.pop()
            players.pop()

    gen = gen + 1

    print("Generazione pronta: " + str(int(gen - 1)))

    return


def getDistance(player, end):
    xDistance = abs((player.x + (sideSquare / 2)) - (end.x + (sideSquare / 2)))
    yDistance = abs((player.y + (sideSquare / 2)) - (end.y + (sideSquare / 2))) 

    return math.sqrt((xDistance * xDistance) + (yDistance * yDistance))

def mesureLinesS(player):

    xC = player.x + (sideSquare / 2)
    yC = player.y + (sideSquare / 2)

    #start from the left
    nColumnLeft = math.floor(player.x / sideSquare)
    nRowHorizontal = math.floor(yC / sideSquare)
    nSquareDistance = 0
    player.lines.leftLine = ((nColumnLeft) * sideSquare) + (player.x % sideSquare)

    for i in range(nColumnLeft, -1, -1):
        if(map[nRowHorizontal][i] != 0): 
            if (map[nRowHorizontal][i] == 2 or map[nRowHorizontal][i] == 3):
                nSquareDistance = (nColumnLeft - i) - 1 #otherwise the line will go to the end of the wall
                player.lines.leftLine = (nSquareDistance * sideSquare) + (player.x % sideSquare)
                break

        foudABall = False
        for ball in balls:
            if(ball.dir == 'horizontal'):
                if ((ball.getNowRow() == nRowHorizontal) and (ball.getNowColumn() == i or (ball.getNowColumn() + 1) == i)): #I have to cover two block with the ball
                    foudABall = True
                break
            elif(ball.dir == 'vertical'):
                if ((ball.getNowRow() == nRowHorizontal or (ball.getNowRow() + 1) == nRowHorizontal) and (ball.getNowColumn() == i)):
                    foudABall = True
                break


        if (foudABall):
            nSquareDistance = (nColumnLeft - i) - 1
            player.lines.leftLine = (nSquareDistance * sideSquare) + (player.x % sideSquare)
            break
        

    #now the right line
    nColumnRight = math.floor((player.x + sideSquare) / sideSquare)
    nSquareDistance = 0

    player.lines.rightLine = (( columns - nColumnRight - 1) * sideSquare) + (sideSquare - ((player.x + sideSquare) % sideSquare))

    for i in range(nColumnRight, columns):
        if(map[nRowHorizontal][i] != 0):
            if (map[nRowHorizontal][i] == 2 or map[nRowHorizontal][i] == 3) :
                nSquareDistance = (i - nColumnRight) - 1 #otherwise the line will go to the end of the wall
                player.lines.rightLine = (nSquareDistance * sideSquare) + (sideSquare - (player.x % sideSquare))
                break
            
        

        foudABall = False
        for ball in balls:
            if(ball.dir == 'horizontal'):
                if ((ball.getNowRow() == nRowHorizontal) and (ball.getNowColumn() == i or (ball.getNowColumn() + 1) == i)): #I have to cover two block with the ball
                    foudABall = True
                break
            elif(ball.dir == 'vertical'):
                if ((ball.getNowRow() == nRowHorizontal or (ball.getNowRow() + 1) == nRowHorizontal) and (ball.getNowColumn() == i)):
                    foudABall = True
                break


        if (foudABall):
            nSquareDistance = (i - nColumnRight) - 1 
            player.lines.rightLine = (nSquareDistance * sideSquare) + (sideSquare - (player.x % sideSquare))
            break
        

    #now up line
    nRowUp = math.floor(player.y / sideSquare)
    nColumnVertical = math.floor(xC / sideSquare)
    nSquareDistance = 0
    player.lines.upLine = ((nRowUp) * sideSquare) + (player.y % sideSquare)

    for i in range(nRowUp, -1, -1):
        if(map[i][nColumnVertical] != 0):
            if (map[i][nColumnVertical] == 2 or map[i][nColumnVertical] == 3):
                nSquareDistance = (nRowUp - i) - 1 #otherwise the line will go to the end of the wall
                player.lines.upLine = (nSquareDistance * sideSquare) + (player.y % sideSquare)
                break

        foudABall = False
        for ball in balls:
            if(ball.dir == 'horizontal'):
                if ((ball.getNowRow() == i) and (ball.getNowColumn() == nColumnVertical or (ball.getNowColumn() + 1) == nColumnVertical)): #I have to cover two block with the ball
                    foudABall = True
                break
            elif(ball.dir == 'vertical'):
                if ((ball.getNowRow() == i or (ball.getNowRow() + 1) == i) and (ball.getNowColumn() == nColumnVertical)):
                    foudABall = True
                break
        

        if (foudABall):
            nSquareDistance = (nRowUp - i) - 1 #otherwise the line will go to the end of the wall
            player.lines.upLine = (nSquareDistance * sideSquare) + (player.y % sideSquare)
            break
        
    

    #down line
    nRowDown = math.floor((player.y + sideSquare) / sideSquare)
    nSquareDistance = 0
    player.lines.downLine = ((rows - nRowDown - 1) * sideSquare) + (sideSquare - ((player.y + sideSquare) % sideSquare))

    for i in range(nRowDown, rows):
        if(map[i][nColumnVertical] != 0) :
            if (map[i][nColumnVertical] == 2 or map[i][nColumnVertical] == 3) :
                nSquareDistance = (i - nRowDown) - 1 #otherwise the line will go to the end of the wall
                player.lines.downLine = (nSquareDistance * sideSquare) + (sideSquare - (player.y % sideSquare))
                break
            
        foudABall = False
        for ball in balls:
            if(ball.dir == 'horizontal'):
                if ((ball.getNowRow() == i) and (ball.getNowColumn() == nColumnVertical or (ball.getNowColumn() + 1) == nColumnVertical)): #I have to cover two block with the ball
                    foudABall = True
                break
            elif(ball.dir == 'vertical'):
                if ((ball.getNowRow() == i or (ball.getNowRow() + 1) == i) and (ball.getNowColumn() == nColumnVertical)):
                    foudABall = True
                break

        if (foudABall):
            nSquareDistance = (i - nRowDown) - 1 #otherwise the line will go to the end of the wall
            player.lines.downLine = (nSquareDistance * sideSquare) + (sideSquare - (player.y % sideSquare))
            break
        
    
    #up right line (maybe change the algoritm)
    xD = player.x + sideSquare # x for diagonal line
    yD = player.y # y for diagonal line

    nColD = math.floor(xD / sideSquare)
    nRowD = math.floor(yD / sideSquare)
    
    xl = xD % sideSquare
    yl = yD % sideSquare 

    if((sideSquare - xl) == yl or (player.x % sideSquare == 0 and player.y % sideSquare == 0)):
        #console.log("DIAGONALE")
        #check if the player is in a perfect rectangle
        
        if(player.x % sideSquare == 0 and player.y % sideSquare == 0): #if that I have to adjust the number of col and row
            nColD -= 1
        

        nSquareDistanceX = (columns - 1) - nColD
        nSquareDistanceY = nRowD

        nSquareDistance = min(nSquareDistanceX, nSquareDistanceY)

        player.lines.upRightLine = nSquareDistance * sideSquare + (player.y % sideSquare)


        for i in range (nSquareDistance + 1):
            if(map[nRowD - i][nColD + i] == 2 or map[nRowD - i][nColD + i] == 3):
                if(player.y % sideSquare == 0):
                    player.lines.upRightLine = (i - 1) * sideSquare
                else:
                    player.lines.upRightLine = (i - 1) * sideSquare + (player.y % sideSquare)
                break
            elif(map[nRowD - i][nColD + i] == 0):
                if(((nRowD - i - 1) >= 0 and (nColD + i + 1) < columns) and (map[nRowD - i - 1][nColD + i] == 2 or map[nRowD - i - 1][nColD + i] == 3) and (map[nRowD - i][nColD + i + 1] == 2 or map[nRowD - i][nColD + i + 1] == 3)):
                    if(player.y % sideSquare == 0):
                        player.lines.upRightLine = (i) * sideSquare
                    else:
                        player.lines.upRightLine = (i) * sideSquare + (player.y % sideSquare)
                    break
                
            

            foudABall = False
            for ball in balls:
                if(ball.dir == 'horizontal'):
                    if ((ball.getNowRow() == (nRowD - i)) and ((ball.getNowColumn() == (nColD + i)) or (ball.getNowColumn() + 1) == (nColD + i))): #I have to cover two block with the ball
                        foudABall = True
                    break
                elif(ball.dir == 'vertical'):
                    if ((ball.getNowRow() == (nRowD - i) or (ball.getNowRow() + 1) == (nRowD - i)) and (ball.getNowColumn() == (nColD + i))):
                        foudABall = True
                    break
            

            if (foudABall):
                if(player.y % sideSquare == 0):
                    player.lines.upRightLine = (i - 1) * sideSquare
                else:
                    player.lines.upRightLine = (i - 1) * sideSquare + (player.y % sideSquare)
                break
    else:

        #check if I'm on the ledge of a column
        if(player.x % sideSquare == 0):
            nColD -= 1

        #lenght of line till the edge
        maxY = player.y
        maxX = width - (player.x + sideSquare)
        
        player.lines.upRightLine = min(maxX, maxY) 

        #check the diagonals square
        nSquareDistanceX = (columns - 1) - nColD
        nSquareDistanceY = nRowD
        
        nSquareDistance = min(nSquareDistanceX, nSquareDistanceY)

        if((sideSquare - xl) < yl or player.x % sideSquare == 0):
            for i in range((nSquareDistance * 2) + 1):
                
                if(i % 2 == 0):
                    nColD += 1
                    if(nColD >= columns):
                        nColD = columns - 1
                else:
                    nRowD -= 1
                    if(nRowD < 0):
                        nRowD = 0

                if(map[nRowD][nColD] == 2 or map[nRowD][nColD] == 3) :
                    if(i % 2 == 0):
                        player.lines.upRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                    else:
                        player.lines.upRightLine = player.y - ((nRowD + 1) * sideSquare)
                    
                    break
                

                foudABall = False
                for ball in balls:
                    if(ball.dir == 'horizontal'):
                        if ((ball.getNowRow() == (nRowD)) and ((ball.getNowColumn() == (nColD)) or (ball.getNowColumn() + 1) == (nColD))): #I have to cover two block with the ball
                            foudABall = True
                        break
                    elif (ball.dir == 'vertical'):
                            if ((ball.getNowRow() == (nRowD) or (ball.getNowRow() + 1) == (nRowD)) and (ball.getNowColumn() == (nColD))):
                                foudABall = True
                            break
                    

                if (foudABall):
                    if(i % 2 == 0): 
                        player.lines.upRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                    else:
                        player.lines.upRightLine = player.y - ((nRowD + 1) * sideSquare)
                    break
                
        elif((sideSquare - xl) > yl):
            #sopra
            #console.log("SOPRA")
            for i in range ((nSquareDistance * 2) + 1):
                
                if(i % 2 == 0):
                    nRowD -= 1
                    if(nRowD < 0):
                        nRowD = 0
                else:
                    nColD += 1
                    if(nColD >= columns):
                        nColD = columns - 1
                

                if(map[nRowD][nColD] == 2 or map[nRowD][nColD] == 3):

                    if(i % 2 == 0):
                        player.lines.upRightLine = player.y - ((nRowD + 1) * sideSquare)
                    else:
                        player.lines.upRightLine = (nColD * sideSquare) - (player.x + sideSquare)

                    break
                

                foudABall = False
                for ball in balls:
                    if(ball.dir == 'horizontal'):
                        if ((ball.getNowRow() == (nRowD)) and ((ball.getNowColumn() == (nColD)) or (ball.getNowColumn() + 1) == (nColD))): #I have to cover two block with the ball
                            foudABall = True
                        break
                    elif(ball.dir == 'vertical'):
                        if ((ball.getNowRow() == (nRowD) or (ball.getNowRow() + 1) == (nRowD)) and (ball.getNowColumn() == (nColD))):
                            foudABall = True
                        break


                if (foudABall):
                    if(i % 2 == 0):
                        player.lines.upRightLine = player.y - ((nRowD + 1) * sideSquare)
                    else:
                        player.lines.upRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                    break


    #up left line (maybe change the algoritm)
    xD = player.x # x for diagonal line
    yD = player.y # y for diagonal line

    nColD = math.floor(xD / sideSquare)
    nRowD = math.floor(yD / sideSquare)
    
    xl = xD % sideSquare
    yl = yD % sideSquare 

    if(xl == yl or (player.x % sideSquare == 0 and player.y % sideSquare == 0)):
        #console.log("DIAGONALE")
        
        nSquareDistance = min(nColD, nRowD)

        player.lines.upLeftLine = nSquareDistance * sideSquare + (player.y % sideSquare)

        for i in range(nSquareDistance + 1):
            if(map[nRowD - i][nColD - i] == 2 or map[nRowD - i][nColD - i] == 3):
                if(player.y % sideSquare == 0):
                    player.lines.upLeftLine = (i - 1) * sideSquare
                else:
                    player.lines.upLeftLine = (i - 1) * sideSquare + (player.y % sideSquare)
                break
            elif(map[nRowD - i][nColD - i] == 0):
                if(((nRowD - i - 1) >= 0 and (nColD - i - 1) >= 0) and (map[nRowD - i - 1][nColD - i] == 2 or map[nRowD - i - 1][nColD - i] == 3) and (map[nRowD - i][nColD - i - 1] == 2 or map[nRowD - i][nColD - i - 1] == 3)):
                    if(player.y % sideSquare == 0):
                        player.lines.upLeftLine = (i) * sideSquare
                    else:
                        player.lines.upLeftLine = (i) * sideSquare + (player.y % sideSquare)
                    break

            foudABall = False
            for ball in balls:
                if(ball.dir == 'horizontal'):
                    if ((ball.getNowRow() == (nRowD - i)) and ((ball.getNowColumn() == (nColD - i)) or (ball.getNowColumn() + 1) == (nColD - i))):
                        foudABall = True
                    break
                elif(ball.dir == 'vertical'):
                    if ((ball.getNowRow() == (nRowD - i) or (ball.getNowRow() + 1) == (nRowD - i)) and (ball.getNowColumn() == (nColD - i))):
                        foudABall = True
                    break
                

            if (foudABall):
                if(player.y % sideSquare == 0):
                    player.lines.upLeftLine = (i - 1) * sideSquare
                else:
                    player.lines.upLeftLine = (i - 1) * sideSquare + (player.y % sideSquare)
                break
    else:

        #lenght of line till the edge
        maxY = player.y
        maxX = player.x

        player.lines.upLeftLine = min(player.x, player.y) 

        nSquareDistance = min(nColD, nRowD)

        if(xl < yl or player.x % sideSquare == 0):
            #sotto
            #console.log("SOTTO")

            for i in range((nSquareDistance * 2) + 1):
                
                if(i % 2 == 0):
                    nColD -= 1
                    if(nColD < 0):
                        nColD = 0
                else:
                    nRowD -= 1
                    if(nRowD < 0):
                        nRowD = 0

                if(map[nRowD][nColD] == 2 or map[nRowD][nColD] == 3):
                    if(i % 2 == 0):
                        player.lines.upLeftLine = (player.x) - ((nColD + 1) * sideSquare)  
                    else:
                        player.lines.upLeftLine = player.y - ((nRowD + 1) * sideSquare)
                    break
                

                foudABall = False
                for ball in balls:
                    if(ball.dir == 'horizontal'):
                        if ((ball.getNowRow() == (nRowD)) and ((ball.getNowColumn() == (nColD)) or (ball.getNowColumn() + 1) == (nColD))): #I have to cover two block with the ball
                            foudABall = True
                        break
                    elif(ball.dir == 'vertical'):
                        if ((ball.getNowRow() == (nRowD) or (ball.getNowRow() + 1) == (nRowD)) and (ball.getNowColumn() == (nColD))):
                            foudABall = True
                        break


                if (foudABall):
                    if(i % 2 == 0): 
                        player.lines.upLeftLine = (player.x) - ((nColD + 1) * sideSquare)  
                    else:
                        player.lines.upLeftLine = player.y - ((nRowD + 1) * sideSquare)
                    break
                
        elif(xl > yl):
            #sopra
            #console.log("SOPRA")
            for i in range((nSquareDistance * 2) + 1):
                
                if(i % 2 == 0) :
                    nRowD -= 1
                    if(nRowD < 0):
                        nRowD = 0
                else:
                    nColD -= 1
                    if(nColD < 0):
                        nColD = 0
                

                if(map[nRowD][nColD] == 2 or map[nRowD][nColD] == 3):

                    if(i % 2 == 0):
                        player.lines.upLeftLine = player.y - ((nRowD + 1) * sideSquare)
                    else:
                        player.lines.upLeftLine = (player.x) - ((nColD + 1) * sideSquare)
                    break

                foudABall = False
                for ball in balls:
                    if(ball.dir == 'horizontal'):
                        if ((ball.getNowRow() == (nRowD)) and ((ball.getNowColumn() == (nColD)) or (ball.getNowColumn() + 1) == (nColD))): #I have to cover two block with the ball
                            foudABall = True
                        break
                    elif(ball.dir == 'vertical'):
                        if ((ball.getNowRow() == (nRowD) or (ball.getNowRow() + 1) == (nRowD)) and (ball.getNowColumn() == (nColD))):
                            foudABall = True
                        break

                if (foudABall):
                    if(i % 2 == 0):
                        player.lines.upLeftLine = player.y - ((nRowD + 1) * sideSquare)
                    else:
                        player.lines.upLeftLine = (player.x) - ((nColD + 1) * sideSquare)
                    break
                
                
    #down right line
    xD = player.x + sideSquare # x for diagonal line
    yD = player.y + sideSquare# y for diagonal line

    nColD = math.floor(xD / sideSquare)
    nRowD = math.floor(yD / sideSquare)
    
    xl = xD % sideSquare
    yl = yD % sideSquare 

    if(xl == yl or (player.x % sideSquare == 0 and player.y % sideSquare == 0)):
        #console.log("DIAGONALE")

        #check if the player is in a perfect rectangle
        if(player.x % sideSquare == 0 and player.y % sideSquare == 0): #if that I have to adjust the number of col and row
            nColD -= 1
            nRowD -= 1
        

        nSquareDistanceX = (columns - 1) - nColD
        nSquareDistanceY = (rows - 1) - nRowD

        nSquareDistance = min(nSquareDistanceX, nSquareDistanceY)

        player.lines.downRightLine = (nSquareDistance * sideSquare) + (sideSquare - (player.y % sideSquare))  #CORREGGERE

        for i in range(nSquareDistance + 1):
            if(map[nRowD + i][nColD + i] == 2 or map[nRowD + i][nColD + i] == 3):
                if(player.y % sideSquare == 0):
                    player.lines.downRightLine = (i - 1) * sideSquare
                else:
                    player.lines.downRightLine = (i - 1) * sideSquare + (sideSquare - (player.y % sideSquare))
                break
            elif(map[nRowD + i][nColD + i] == 0):
                if(((nRowD + i + 1) < rows and (nColD + i + 1) < columns) and (map[nRowD + i + 1][nColD + i] == 2 or map[nRowD + i + 1][nColD + i] == 3) and (map[nRowD + i][nColD + i + 1] == 2 or map[nRowD + i][nColD + i + 1] == 3)):
                    if(player.y % sideSquare == 0):
                        player.lines.downRightLine = (i) * sideSquare
                    else:
                        player.lines.downRightLine = (i) * sideSquare + (sideSquare - (player.y % sideSquare))
                    break

            foudABall = False
            for ball in balls:
                if(ball.dir == 'horizontal'):
                    if ((ball.getNowRow() == (nRowD + i)) and ((ball.getNowColumn() == (nColD + i)) or (ball.getNowColumn() + 1) == (nColD + i))):
                        foudABall = True
                    break
                elif(ball.dir == 'vertical'):
                    if ((ball.getNowRow() == (nRowD + i) or (ball.getNowRow() + 1) == (nRowD + i)) and (ball.getNowColumn() == (nColD + i))):
                        foudABall = True
                    break

            if (foudABall):
                if(player.y % sideSquare == 0):
                    player.lines.downRightLine = (i - 1) * sideSquare
                else:
                    player.lines.downRightLine = (i - 1) * sideSquare + (sideSquare - (player.y % sideSquare))
                break
    else:

        #check if I'm on the ledge of a column
        if(player.x % sideSquare == 0): #if that I have to adjust the number of col and row
            nColD -= 1
        if(player.y % sideSquare == 0): #if that I have to adjust the number of col and row
            nRowD -= 1

        #lenght of line till the edge
        maxY = height - (player.y + sideSquare)
        maxX = width - (player.x + sideSquare)
        
        player.lines.downRightLine = min(maxX, maxY) 

        #check the diagonals square
        nSquareDistanceX = (columns - 1) - nColD
        nSquareDistanceY = (rows - 1) - nRowD
        
        nSquareDistance = min(nSquareDistanceX, nSquareDistanceY)

        if((xl > yl or player.x % sideSquare == 0) and player.y % sideSquare != 0):
            #sopra
            #console.log("SOPRA")
            for i in range((nSquareDistance * 2) + 1):
                
                if(i % 2 == 0):
                    nColD += 1
                    if(nColD >= columns):
                        nColD = columns - 1
                else:
                    nRowD += 1
                    if(nRowD >= rows):
                        nRowD = rows - 1
                

                if(map[nRowD][nColD] == 2 or map[nRowD][nColD] == 3):

                    if(i % 2 == 0):
                        player.lines.downRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                    else:
                        player.lines.downRightLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                    break

                foudABall = False
                for ball in balls:
                    if(ball.dir == 'horizontal'):
                        if ((ball.getNowRow() == (nRowD)) and ((ball.getNowColumn() == (nColD)) or (ball.getNowColumn() + 1) == (nColD))): #I have to cover two block with the ball
                            foudABall = True
                        break
                    if(ball.dir == 'vertical'):
                        if ((ball.getNowRow() == (nRowD) or (ball.getNowRow() + 1) == (nRowD)) and (ball.getNowColumn() == (nColD))):
                            foudABall = True
                        break


                if (foudABall):
                    if(i % 2 == 0):
                        player.lines.downRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                    else:
                        player.lines.downRightLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                    break

        elif(xl < yl or player.y % sideSquare == 0):
            #sotto
            #console.log("SOTTO")

            for i in range((nSquareDistance * 2) + 1):
                
                if(i % 2 == 0):
                    nRowD += 1
                    if(nRowD >= rows):
                        nRowD = rows - 1
                else:
                    nColD += 1 
                    if(nColD >= columns):
                        nColD = columns - 1

                if(map[nRowD][nColD] == 2 and map[nRowD][nColD] == 3):

                    if(i % 2 == 0):
                        player.lines.downRightLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                    else:
                        player.lines.downRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                    break


                foudABall = False
                for ball in balls:
                    if(ball.dir == 'horizontal'):
                        if ((ball.getNowRow() == (nRowD)) and ((ball.getNowColumn() == (nColD)) or (ball.getNowColumn() + 1) == (nColD))): #I have to cover two block with the ball
                            foudABall = True
                        break
                    if(ball.dir == 'vertical'):
                        if ((ball.getNowRow() == (nRowD) or (ball.getNowRow() + 1) == (nRowD)) and (ball.getNowColumn() == (nColD))):
                            foudABall = True
                        break

                if (foudABall):
                    if(i % 2 == 0):
                        player.lines.downRightLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                    else:
                        player.lines.downRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                    break

    #down left line (maybe change the algoritm)
    xD = player.x # x for diagonal line
    yD = player.y + sideSquare # y for diagonal line

    nColD = math.floor(xD / sideSquare)
    nRowD = math.floor(yD / sideSquare)
    
    xl = xD % sideSquare
    yl = yD % sideSquare 

    if((sideSquare - xl) == yl or (player.x % sideSquare == 0 and player.y % sideSquare == 0)):
        #console.log("DIAGONALE")
        #check if the player is in a perfect rectangle
        
        if(player.x % sideSquare == 0 and player.y % sideSquare == 0): #if that I have to adjust the number of col and row
            nRowD -= 1
        

        nSquareDistanceX = nColD
        nSquareDistanceY = (rows - 1) - nRowD

        nSquareDistance = min(nSquareDistanceX, nSquareDistanceY)

        player.lines.downLeftLine = (nSquareDistance * sideSquare) + (sideSquare - (player.y % sideSquare))

        for i in range(nSquareDistance + 1):
            if(map[nRowD + i][nColD - i] == 2 and map[nRowD + i][nColD - i] == 3):
                if(player.y % sideSquare == 0):
                    player.lines.downLeftLine = (i - 1) * sideSquare
                else:
                    player.lines.downLeftLine = (i - 1) * sideSquare + (sideSquare - (player.y % sideSquare))
                break
            elif(map[nRowD + i][nColD - i] == 0):
                if(((nRowD + i + 1) < rows and (nColD - i - 1) >= 0) and (map[nRowD + i + 1][nColD - i] == 2 or map[nRowD + i + 1][nColD - i] == 3) and (map[nRowD + i][nColD - i - 1] == 2 or map[nRowD + i][nColD - i + 1] == 3)):
                    if(player.y % sideSquare == 0):
                        player.lines.downLeftLine = (i) * sideSquare
                    else:
                        player.lines.downLeftLine = (i) * sideSquare + (sideSquare - (player.y % sideSquare))
                    break

            foudABall = False
            for ball in balls:
                if(ball.dir == 'horizontal'):
                    if ((ball.getNowRow() == (nRowD + i)) and ((ball.getNowColumn() == (nColD - i)) or (ball.getNowColumn() + 1) == (nColD - i))):
                        foudABall = True
                    break
                if(ball.dir == 'vertical'):
                    if ((ball.getNowRow() == (nRowD + i) or (ball.getNowRow() + 1) == (nRowD + i)) and (ball.getNowColumn() == (nColD - i))):
                        foudABall = True
                    break
                

            if (foudABall):
                if(player.y % sideSquare == 0):
                    player.lines.downLeftLine = (i - 1) * sideSquare
                else:
                    player.lines.downLeftLine = (i - 1) * sideSquare + (sideSquare - (player.y % sideSquare))
                break
    else:

        #check if I'm on the ledge of a column
        if(player.y % sideSquare == 0):
            nRowD -= 1

        #lenght of line till the edge
        maxY = height - (player.y + sideSquare)
        maxX = player.x
        
        player.lines.downLeftLine = min(maxX, maxY) 

        #check the diagonals square
        nSquareDistanceX = nColD
        nSquareDistanceY = (rows - 1) - nRowD
        
        nSquareDistance = min(nSquareDistanceX, nSquareDistanceY)

        if(((sideSquare - xl) < yl or player.y % sideSquare == 0) and (player.x % sideSquare != 0)):
            #sotto
            #console.log("SOTTO")

            for i in range((nSquareDistance * 2) + 1):
                if(i % 2 == 0):
                    nRowD += 1
                    if(nRowD >= rows):
                        nRowD = rows - 1
                else:
                    nColD -= 1
                    if(nColD < 0):
                        nColD = 0

                if(map[nRowD][nColD] == 2 or map[nRowD][nColD] == 3):

                    if(i % 2 == 0):
                        player.lines.downLeftLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                    else:
                        player.lines.downLeftLine = player.x - ((nColD + 1) * sideSquare)
                    break

                foudABall = False
                for ball in balls:
                    if(ball.dir == 'horizontal'):
                        if ((ball.getNowRow() == (nRowD)) and ((ball.getNowColumn() == (nColD)) or (ball.getNowColumn() + 1) == (nColD))): #I have to cover two block with the ball
                            foudABall = True
                        break
                    if(ball.dir == 'vertical'):
                        if ((ball.getNowRow() == (nRowD) or (ball.getNowRow() + 1) == (nRowD)) and (ball.getNowColumn() == (nColD))):
                            foudABall = True
                        break

                if (foudABall):
                    if(i % 2 == 0):
                        player.lines.downLeftLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                    else:
                        player.lines.downLeftLine = player.x - ((nColD + 1) * sideSquare)
                    break
                
        elif((sideSquare - xl) > yl or player.x % sideSquare == 0):
            #sopra
            #console.log("SOPRA")
            for i in range((nSquareDistance * 2) + 1):
                
                if(i % 2 == 0):
                    nColD -= 1
                    if(nColD < 0):
                        nColD = 0
                else:
                    nRowD += 1
                    if(nRowD >= rows):
                        nRowD = rows - 1

                if(map[nRowD][nColD] == 2 or map[nRowD][nColD] == 3):

                    if(i % 2 == 0):
                        player.lines.downLeftLine = player.x - ((nColD + 1) * sideSquare)
                    else:
                        player.lines.downLeftLine = ((nRowD) * sideSquare) - (player.y + sideSquare)

                    break

                foudABall = False
                for ball in balls:
                    if(ball.dir == 'horizontal'):
                        if ((ball.getNowRow() == (nRowD)) and ((ball.getNowColumn() == (nColD)) or (ball.getNowColumn() + 1) == (nColD))): #I have to cover two block with the ball
                            foudABall = True
                        break
                    if(ball.dir == 'vertical'):
                        if ((ball.getNowRow() == (nRowD) or (ball.getNowRow() + 1) == (nRowD)) and (ball.getNowColumn() == (nColD))):
                            foudABall = True
                        break

                if (foudABall):
                    if(i % 2 == 0):
                        player.lines.downLeftLine = player.x - ((nColD + 1) * sideSquare)
                    else:
                        player.lines.downLeftLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                    break

def checkCollisionAIS(player):

    #(x - x0)^2 + (y - y0)^2 = r^2
    r = sideSquare / 2

    for ball in balls:
        x0 = (ball.x) + r
        y0 = (ball.y) + r
        
        result1corner = math.pow((player.x - x0), 2) + math.pow((player.y - y0), 2)
        result2corner = math.pow(((player.x + sideSquare) - x0), 2) + math.pow((player.y - y0), 2)
        result3corner = math.pow(((player.x + sideSquare) - x0), 2) + math.pow(((player.y + sideSquare) - y0), 2)
        result4corner = math.pow((player.x - x0), 2) + math.pow(((player.y + sideSquare) - y0), 2)
        
        result1edge = math.pow(((player.x + r) - x0), 2) + math.pow((player.y - y0), 2)
        result2edge = math.pow(((player.x + sideSquare) - x0), 2) + math.pow(((player.y + r) - y0), 2)
        result3edge = math.pow(((player.x + r) - x0), 2) + math.pow(((player.y + sideSquare) - y0), 2)
        result4edge = math.pow((player.x - x0), 2) + math.pow(((player.y + r) - y0), 2)

        if(result1corner < math.pow(r, 2) or result2corner < math.pow(r, 2) or result3corner < math.pow(r, 2) or result4corner < math.pow(r, 2)
            or result1edge < math.pow(r, 2) or result2edge < math.pow(r, 2) or result3edge < math.pow(r, 2) or result4edge < math.pow(r, 2)):
            return True

    return False

def checkWinAi(player):
    global win

    if(player.x < end.x + sideSquare and player.x + sideSquare > end.x + sideSquare  and player.y == end.y):
        win = True
        return True
    elif(player.x + sideSquare > end.x and player.x < end.x  and player.y == end.y):
        win = True
        return True
    elif(player.y < end.y + sideSquare and player.y + sideSquare > end.y + sideSquare  and player.x == end.x):
        win = True
        return True
    elif(player.y + sideSquare > end.y and player.y < end.y  and player.x == end.x):
        win = True
        return True
    elif(player.x < end.x + sideSquare and player.x + sideSquare > end.x + sideSquare and player.y < end.y + sideSquare and player.y + sideSquare > end.y + sideSquare):
        win = True
        return True
    elif(player.x < end.x + sideSquare and player.x + sideSquare > end.x + sideSquare and player.y + sideSquare > end.y and player.y < end.y):
        win = True
        return True
    elif(player.x + sideSquare > end.x and player.x < end.x and player.y < end.y + sideSquare and player.y + sideSquare > end.y + sideSquare):
        win = True
        return True
    elif(player.x + sideSquare > end.x and player.x < end.x and player.y + sideSquare > end.y and player.y < end.y):
        win = True
        return True
    else:
        return False