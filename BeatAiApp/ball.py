import math
import json

class Ball:
    def __init__(self, nRow, nColumn, sideSquare, width, height):
        self.nRow = nRow
        self.nColumn = nColumn

        self.x = self.nColumn * sideSquare
        self.y = self.nRow * sideSquare

        self.startX = self.x
        self.startY = self.y

        self.dir = "horizontal" # or vertical
        self.speed = sideSquare / 8
        self.initSide = "left"
        self.side = "left" # or right, up, down

        self.sideSquare = sideSquare
        self.height = height
        self.width = width

    def getJson(self):
        b = {
            "nRow" : self.nRow,
            "nColumn" : self.nColumn,
            "x" : self.x,
            "y" : self.y,
            "dir" : self.dir,
            "speed" : self.speed,
            "initSide" : self.initSide,
            "side" : self.side
        }

        return json.dumps(b)

    def getNowColumn(self):
        return math.floor(self.x / self.sideSquare)

    def getNowRow(self):
        return math.floor(self.y / self.sideSquare)

    def move(self, walls):
        if(self.dir == "horizontal"):

            if(self.side == "left"):
                self.x -= self.speed

                #Now I have to check all the wall in the line
                for wall in walls:
                    if(self.x < wall.x + self.sideSquare and self.x + self.sideSquare > wall.x + self.sideSquare and self.y == wall.y):                        
                        self.x = wall.x + self.sideSquare
                        self.side = "right"
                        return

                if(self.x < 0):
                    self.x = 0
                    self.side = "right"
                    return

            elif(self.side == "right"):
                self.x += self.speed

                #print("Dentro la funzione: " + str(self.x))

                #Now I have to check all the wall in the line
                for wall in walls:
                    if(self.x + self.sideSquare > wall.x and self.x < wall.x and self.y == wall.y):
                        self.x = wall.x - self.sideSquare
                        self.side = "left"
                        return

                if(self.x + self.sideSquare > self.width):
                    self.x = self.width - self.sideSquare
                    self.side = "left"
                    return

        elif(self.dir == "vertical"):

            if(self.side == "up"):
                self.y -= self.speed

                #Now I have to check all the wall in the line
                for wall in walls:
                    if(self.y < wall.y + self.sideSquare and self.y + self.sideSquare > wall.y + self.sideSquare and self.x == wall.x):
                        self.y = wall.y + self.sideSquare
                        self.side = "down"
                        return

                if(self.y < 0):
                    self.y = 0
                    self.side = "down"
                    return

            elif(self.side == "down"):
                self.y += self.speed

                #Now I have to check all the wall in the line
                for wall in walls:
                    if(self.y + self.sideSquare > wall.y and self.y < wall.y and self.x == wall.x):
                        self.y = wall.y - self.sideSquare
                        self.side = "up"
                        return
                    
                if(self.y + self.sideSquare > self.height):
                    self.y = self.height - self.sideSquare
                    self.side = "up"
                    return
    
    def __str__(self):
        return 'x: ' + str(self.x) + ' y: ' + str(self.y) + ' side: ' + str(self.side); 