class Wall:
    def __init__(self, nRow, nColumn, sideSquare):
        self.nRow = nRow
        self.nColumn = nColumn

        self.x = self.nColumn * sideSquare
        self.y = self.nRow * sideSquare

        self.vertical = ""
        self.horizontal = ""

        self.playerStopUp = False
        self.playerStopDown = False
        self.playerStopLeft = False
        self.playerStopRight = False

        self.sideSquare = sideSquare

    def setPlayerPosition(self, player):
        #set the vertical
        if(player.y + self.sideSquare <= self.y):
            self.vertical = 'up'
        elif (player.y >= self.y + self.sideSquare):
            self.vertical = 'down'
        else:
            self.vertical = ""

        #set the horizontal
        if(player.x + self.sideSquare <= self.x):
            self.horizontal = 'left'
        elif(player.x >= self.x + self.sideSquare):
            self.horizontal = 'right'
        else:
            self.horizontal = ""