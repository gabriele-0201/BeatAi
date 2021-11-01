from os import nice
import math
from .lines import Lines
class Player:
    
    def __init__(self, nRowAndColumn, sideSquare, width, height, rows, columns, distance = -1):
        self.sideSquare = sideSquare
        self.width = width
        self.height = height
        self.rows = rows
        self.columns = columns
        
        self.x = nRowAndColumn[1] * sideSquare
        self.y = nRowAndColumn[0] * sideSquare

        self.nRows = []
        self.nColumns = []
        self.addToHistory()

        self.speed = sideSquare / 10

        self.up = False
        self.down = False
        self.left = False
        self.right = False
        
        self.lines = Lines()

        self.distance = distance


    def getNowColumn(self):
        return math.floor(self.x / self.sideSquare)

    def getNowRow(self):
        return math.floor(self.y / self.sideSquare)

    def addToHistory(self):
        self.nRows.append(self.getNowRow())
        self.nColumns.append(self.getNowColumn())

    def clearHistory(self):
        self.nRows.clear()
        self.nColumns.clear()

    def haveToRemove(self, cicles):

        nowVal = [self.nRows[len(self.nRows) - 1], self.nColumns[len(self.nColumns) - 1]]

        for i in range((len(self.nRows) - 2), (len(self.nRows) - 2 - cicles), -1):
            
            if (i < 0):
                return False

            prevVal = [self.nRows[i], self.nColumns[i]]

            if( (prevVal[0] < (nowVal[0] - 1) or prevVal[0] > (nowVal[0] + 1)) or (prevVal[1] < (nowVal[1] - 1) or prevVal[1] > (nowVal[1] + 1))):
                return False
    
        return True


    def haveToDecrease(self, cicles):

        nowVal = [self.nRows[len(self.nRows) - 1], self.nColumns[len(self.nColumns) - 1]]

        for i in range((len(self.nRows) - 2), (len(self.nRows) - 2 - cicles), -1):
            
            if (i < 0):
                return False

            prevVal = [self.nRows[i], self.nColumns[i]]

            if( (prevVal[0] < (nowVal[0] - 1) or (prevVal[0] > nowVal[0])) or (prevVal[1] < (nowVal[1] - 1) or (prevVal[1] > nowVal[1])) ):
                return False

        return True


    def findElement(self, array, nRow, nColumn):
        indexElement = -1

        for index, element in enumerate(array): 
            if(element.nRow == nRow and element.nColumn == nColumn):
                indexElement = index
                break 
                
        return indexElement


    def moveUp(self, walls):
        self.y -= self.speed

        #rounding the value near the grid
        if (self.y % self.sideSquare < self.speed):
            self.y = math.floor(self.y / self.sideSquare) * self.sideSquare

        #check the edge of the canvas

        if(self.y < 0):
            self.y = 0
            #return self.y
        
        #Going UP I can find a wall only in the nCol and nCol 
        #instead I have to check only one Column if the player is perfect in a single column

        nCol = math.floor(self.x / self.sideSquare)
        nRow = math.floor(self.y / self.sideSquare)

        if(self.x % self.sideSquare == 0):
            for i in range(nRow + 1):

                index = self.findElement(walls, i, nCol)

                if (index != -1):
                    if(self.y < walls[index].y + self.sideSquare):
                        self.y = walls[index].y + self.sideSquare

        else:
            for i in range(nRow + 1):
                for j in range(nCol, nCol + 2, 1):

                    index = self.findElement(walls, i, j)

                    if (index != -1):
                        if(self.y < walls[index].y + self.sideSquare):
                            self.y = walls[index].y + self.sideSquare
        
        return self.y


    def moveDown(self, walls):
        self.y += self.speed

        #rounding
        if ((self.sideSquare - ((self.y + self.sideSquare) % self.sideSquare)) < self.speed):
            self.y = math.floor((self.y + self.sideSquare) / self.sideSquare) * self.sideSquare

        #check the edge of the canvas

        if(self.y + self.sideSquare > self.height):
            self.y = self.height - self.sideSquare
            #return False

        #check the walls

        nCol = math.floor(self.x / self.sideSquare)
        nRow = math.floor((self.y + self.sideSquare) / self.sideSquare)

        if(self.x % self.sideSquare == 0):
            for i in range(nRow, self.rows):

                index = self.findElement(walls, i, nCol)

                if (index != -1):
                    
                    if(self.y + self.sideSquare > walls[index].y):
                        self.y = walls[index].y - self.sideSquare
            
        else:  # To finish
            for i in range(nRow, self.rows):
                for j in range(nCol, nCol + 2, 1):

                    index = self.findElement(walls, i, j)

                    if (index != -1):
                        
                        if(self.y + self.sideSquare > walls[index].y):
                            self.y = walls[index].y - self.sideSquare
        
        return self.y

    def moveLeft(self, walls):
        self.x -= self.speed

        #rounding the value near the grid
        if (self.x % self.sideSquare < self.speed):
            self.x = math.floor(self.x / self.sideSquare) * self.sideSquare

        #check the edge of the canvas

        if(self.x < 0):
            self.x = 0
            #return self.x

        #check the wall

        nCol = math.floor(self.x / self.sideSquare)
        nRow = math.floor(self.y / self.sideSquare)

        if(self.y % self.sideSquare == 0):
            for i in range(nCol + 1):

                index = self.findElement(walls, nRow, i)

                if (index != -1):
                    
                    if(self.x < walls[index].x + self.sideSquare):
                        self.x = walls[index].x + self.sideSquare
              
        else:
            for i in range(nCol + 1):
                for j in range(nRow, nRow + 2, 1):

                    index = self.findElement(walls, j, i)

                    if (index != -1):
                        
                        if(self.x < walls[index].x + self.sideSquare):
                            self.x = walls[index].x + self.sideSquare

        return self.x

    def moveRight(self, walls):
        self.x += self.speed

        #rounding
        if ((self.sideSquare - ((self.x + self.sideSquare) % self.sideSquare)) < self.speed):
            self.x = math.floor((self.x + self.sideSquare) / self.sideSquare) * self.sideSquare
            
        #check the edge of the canvas

        if(self.x + self.sideSquare > self.width):
            self.x = self.width - self.sideSquare
            #return self.x
            
        #check the wall
        nCol = math.floor((self.x + self.sideSquare) / self.sideSquare)
        nRow = math.floor(self.y / self.sideSquare)

        if(self.y % self.sideSquare == 0): 
            for i in range(nCol, self.columns):

                index = self.findElement(walls, nRow, i)

                if (index != -1):
                    
                    if(self.x + self.sideSquare > walls[index].x):
                        self.x = walls[index].x - self.sideSquare
                
        else:
            for i in range(nCol, self.columns):
                for j in range(nRow, nRow + 2, 1):

                    index = self.findElement(walls, j, i)

                    if (index != -1):
                        
                        if(self.x + self.sideSquare > walls[index].x):
                            self.x = walls[index].x - self.sideSquare

        return self.x

    def move(self, walls):

        if (self.up):
            self.y -= self.speed

            #rounding the value near the grid
            if (self.y % self.sideSquare < self.speed):
                self.y = math.floor(self.y / self.sideSquare) * self.sideSquare

            #check the edge of the canvas

            if(self.y < 0):
                self.y = 0
            
            #Going UP I can find a wall only in the nCol and nCol 
            #instead I have to check only one Column if the player is perfect in a single column

            nCol = math.floor(self.x / self.sideSquare)
            nRow = math.floor(self.y / self.sideSquare)

            if(self.x % self.sideSquare == 0):
                for i in range(nRow + 1):

                    index = self.findElement(walls, i, nCol)

                    if (index != -1):
                        
                        if(self.y < walls[index].y + self.sideSquare):
                            self.y = walls[index].y + self.sideSquare
                    
                
            else:
                for i in range(nRow + 1):
                    for j in range(nCol, nCol + 2, 1):

                        index = self.findElement(walls, i, j)

                        if (index != -1):
                            
                            if(self.y < walls[index].y + self.sideSquare):
                                self.y = walls[index].y + self.sideSquare
        
        elif(self.down):
            self.y += self.speed

            #rounding
            if ((self.sideSquare - ((self.y + self.sideSquare) % self.sideSquare)) < self.speed):
                self.y = math.floor((self.y + self.sideSquare) / self.sideSquare) * self.sideSquare

            #check the edge of the canvas

            if(self.y + self.sideSquare > self.height):
                self.y = self.height - self.sideSquare

            #check the walls

            nCol = math.floor(self.x / self.sideSquare)
            nRow = math.floor((self.y + self.sideSquare) / self.sideSquare)

            if(self.x % self.sideSquare == 0):
                for i in range(nRow, self.rows):

                    index = self.findElement(walls, i, nCol)

                    if (index != -1):
                        
                        if(self.y + self.sideSquare > walls[index].y):
                            self.y = walls[index].y - self.sideSquare
                    
                
            else:  # To finish
                for i in range(nRow, self.rows):
                    for j in range(nCol, nCol + 2, 1):

                        index = self.findElement(walls, i, j)

                        if (index != -1):
                            
                            if(self.y + self.sideSquare > walls[index].y):
                                self.y = walls[index].y - self.sideSquare
                        
               
        if(self.left):
            self.x -= self.speed

            #rounding the value near the grid
            if (self.x % self.sideSquare < self.speed):
                self.x = math.floor(self.x / self.sideSquare) * self.sideSquare

            #check the edge of the canvas

            if(self.x < 0):
                self.x = 0

            #check the wall

            nCol = math.floor(self.x / self.sideSquare)
            nRow = math.floor(self.y / self.sideSquare)

            if(self.y % self.sideSquare == 0):
                for i in range(nCol + 1):

                    index = self.findElement(walls, nRow, i)

                    if (index != -1):
                        
                        if(self.x < walls[index].x + self.sideSquare):
                            self.x = walls[index].x + self.sideSquare
                    
                
            else:
                for i in range(nCol + 1):
                    for j in range(nRow, nRow + 2, 1):

                        index = self.findElement(walls, j, i)

                        if (index != -1):
                            
                            if(self.x < walls[index].x + self.sideSquare):
                                self.x = walls[index].x + self.sideSquare
                        
        elif (self.right):
            self.x += self.speed

            #rounding
            if ((self.sideSquare - ((self.x + self.sideSquare) % self.sideSquare)) < self.speed):
                self.x = math.floor((self.x + self.sideSquare) / self.sideSquare) * self.sideSquare

            #check the edge of the canvas

            if(self.x + self.sideSquare > self.width):
                self.x = self.width - self.sideSquare

            #check the wall
            nCol = math.floor((self.x + self.sideSquare) / self.sideSquare)
            nRow = math.floor(self.y / self.sideSquare)

            if(self.y % self.sideSquare == 0): 
                for i in range(nCol, self.columns):

                    index = self.findElement(walls, nRow, i)

                    if (index != -1):
                        
                        if(self.x + self.sideSquare > walls[index].x):
                            self.x = walls[index].x - self.sideSquare
                    
                
            else:
                for i in range(nCol, self.columns):
                    for j in range(nRow, nRow + 2, 1):

                        index = self.findElement(walls, j, i)

                        if (index != -1):
                            
                            if(self.x + self.sideSquare > walls[index].x):
                                self.x = walls[index].x - self.sideSquare