import json

class Wall:
    def __init__(self, nRow, nColumn, sideSquare):
        self.nRow = nRow
        self.nColumn = nColumn

        self.x = self.nColumn * sideSquare
        self.y = self.nRow * sideSquare

    def getJson(self):
        w = {
            "nRow" : self.nRow,
            "nColumn" : self.nColumn,
            "x" : self.x,
            "y" : self.y,
        }

        return json.dumps(w)

