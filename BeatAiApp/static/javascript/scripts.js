const modes = {
    DEFAULT: "default",
    EXPLANATION: "explanation",
	CREATE: "create",
	PLAY: "play",
	AI: "ai",
    AI_LOADING: "ai_loading",
    BALLS_SHOWING: "balls_showing"
}

let mode = modes.DEFAULT

//navbar
function activeSubNav(type) {
    if(mode === modes.EXPLANATION) 
        return

    change = false
    switch (type) {
        case 'create':
            change = startCreateLevel()
            break;
        case 'play':
            change = startPlayLevel()
            break;
        case 'ai':
            change = startAiPlayLevel();            
        break;
    }
    if(change)
        document.getElementById("mainNavActive").setAttribute("id", "mainNavInactive");
}

function backToMainNav(type) {
    switch (type) {
        case 'create':
            document.getElementById("subNavActive").setAttribute("id", "createNavInactive");
            endCreateLevel()
            break;
        case 'play':
            document.getElementById("subNavActive").setAttribute("id", "playNavInactive");
            endPlayLevel()
            break;
        case 'ai':
            document.getElementById("subNavActive").setAttribute("id", "aiNavInactive");
            if(mode !== modes.DEFAULT){
                endComunicationAi();
            }
            endAiPlayLevel();
        break;
    }
    document.getElementById("mainNavInactive").setAttribute("id", "mainNavActive");
}


document.getElementById("btnExpl").onclick = function() {setExplanation(true)}

document.getElementById("btnCrtLevel").onclick = function() {activeSubNav('create')}
document.getElementById("btnPlayLevel").onclick = function() {activeSubNav('play')}
document.getElementById("btnAiLevel").onclick = function() {activeSubNav('ai')}

document.getElementById("btnCrtBack").onclick = function() {backToMainNav('create')}
document.getElementById("btnPlayBack").onclick = function() {backToMainNav('play')}
document.getElementById("btnAiBack").onclick = function() {backToMainNav('ai')}

// CERATE GAME
//variable for the play
var player = null 
var players = []
var speedPlayer = 6
var walls = []
var balls = []
//var ends =  []
var end = null
const navsContainer = document.getElementById("navsContainer")
const gameDiv = document.getElementById("gameContainer")
const canvas = document.querySelector('canvas')
const modPanelBall  = document.getElementById("modifierBall")

//Modifier Ball Div
const arrowUpImg = document.getElementById("arrowUpImg")
const arrowLeftImg = document.getElementById("arrowLeftImg")
const arrowRightImg = document.getElementById("arrowRightImg")
const arrowDownImg = document.getElementById("arrowDownImg")
const modBallImg = document.getElementById("modBallImg")


const ctx = canvas.getContext('2d')
 
const rows = 15
const columns = 30
const minPadding = 50

var showGrid = false

var map = new Array(rows)
for(var i=0; i<rows; i++) {
    map[i] = new Array(columns);

    for(var j=0; j<columns; j++)
        map[i][j] = 0
}

var sideSquare = 0
var mouseDown = false
var selectedItem = ""
var modPanelBool = false
var selectedBall = null

var numbs = gameDiv.style.paddingLeft.length
var pLeft = parseInt(gameDiv.style.paddingLeft.substring(0,numbs))
numbs = gameDiv.style.paddingTop.length
var pTop = parseInt(gameDiv.style.paddingTop.substring(0,numbs))

var xImg
var yImg

var exBall = false

var playerPlaced = false
var attemptCounter = 0

var win = false //this variable is used for the signel player
var incomingWin = false
var winAi = false //This variable is specify for the winning of AI

var images = new Map()

//loadImages
var img = new Image()
img.src = "/static/img/player.svg"
images.set('player', img)
img = new Image()
img.src = "/static/img/fullWall.svg"
images.set('fullWall', img)
img = new Image()
img.src = "/static/img/x.svg"
images.set('remove', img)
img = new Image()
img.src = "/static/img/end.svg"
images.set('end', img)
img = new Image()
img.src = "/static/img/ball.svg"
images.set('ball', img)

let secondsPassed;
let oldTimeStamp;
let fps;

function gameLoop(timeStamp) {
    // Calculate the number of seconds passed since the last frame
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;

    // Calculate fps
    fps = Math.round(1 / secondsPassed);

    // console.log(fps)

    switch(mode) {
        case modes.BALLS_SHOWING:

            moveObjects(walls, balls)

            break
        case modes.PLAY:

            if(player !== null){ //I have to move this to the initual button to generalize the condition
                player.move(walls)
                moveObjects(walls, balls)
                checkCollision()
            }
            break
        case modes.AI:
        case modes.AI_LOADING:

            if(genOutputs.length > genToShow) {
                //console.log(genOutputs.length + " - " + genToShow)
                if(!winAi){
                    aiPlay();
                }

                if(incomingWin){
                    winAi = checkWinAI(players)
                    if(winAi){
                        incomingWin = false
                        endComunicationAi()
                    }
                }
            }

            //incomingWin and winAi will stop asking new generation if somewin
            if(mode !== modes.DEFAULT && !incomingWin && !winAi && genLoading < genToLoad){
                console.log("Gen Loading" + genLoading)
                console.log("Gen to Load " + genToLoad)
                console.log("richiesta di una nuova generazione")
                requestGeneration();
                genLoading++;
            }
            break
    }

    draw()

    window.requestAnimationFrame(gameLoop);
}

function drawGrid() {

    var w = gameDiv.clientWidth
    var h = gameDiv.clientHeight

    var possibleHeight = h - minPadding 
    sideSquare = Math.floor(possibleHeight / rows)

    var rest = possibleHeight % rows

    if ((sideSquare * columns) > (w - minPadding)) {

        possibleWidth = w - minPadding
        sideSquare = Math.floor(possibleWidth / columns)

        rest = possibleWidth % columns
        
        canvas.width = sideSquare * columns
        canvas.height = sideSquare * rows

        paddingVertical = h - canvas.height 
        gameDiv.style.paddingTop = String(paddingVertical / 2) + "px"
        gameDiv.style.paddingBottom = String(paddingVertical / 2) + "px"

        gameDiv.style.paddingLeft = String((minPadding + rest) / 2) + "px"
        gameDiv.style.paddingRight = String((minPadding + rest) / 2) + "px"
        
    } else {
        canvas.height = sideSquare * rows
        canvas.width = sideSquare * columns

        paddingHorizontal = w - canvas.width
        gameDiv.style.paddingLeft = String(paddingHorizontal / 2) + "px"
        gameDiv.style.paddingRight = String(paddingHorizontal / 2) + "px"

        gameDiv.style.paddingTop = String((minPadding + rest) / 2) + "px"
        gameDiv.style.paddingBottom = String((minPadding + rest) / 2) + "px"
    }
    if(showGrid) {
        for(var i = 1; i < rows; i++) {
            drawLine([0, sideSquare * i], [canvas.width, sideSquare * i], '#898989', 1)
        }

        for(var j = 1; j < columns; j++) {
            drawLine([sideSquare * j, 0], [sideSquare * j, canvas.height], '#898989', 1)
        }
    }
}

function drawLine(begin, end, stroke = 'black', width = 1) {
    
    ctx.strokeStyle = stroke
    ctx.lineWidth = width    

    ctx.beginPath()
    ctx.moveTo(...begin)
    ctx.lineTo(...end)   
    ctx.stroke()
}

function drawMap() {
    for(var i = 0; i < rows; i++) {
        for(var j = 0; j < columns; j++){
            
            switch (map[i][j]) {
                case 0:
                    break;
                case 1:
                    switch(mode) {
                        case modes.DEFAULT:
                        case modes.CREATE:
                        case modes.BALLS_SHOWING:
                            if (player !== null)
                                ctx.drawImage(images.get('player'), player.nColumn * sideSquare, player.nRow * sideSquare, sideSquare, sideSquare)
                            break
                    }
                    break
                case 2:
                    ctx.drawImage(images.get('fullWall'), j * sideSquare, i * sideSquare, sideSquare, sideSquare)
                    break
                case 3:
                    ctx.drawImage(images.get('end'), j * sideSquare, i * sideSquare, sideSquare, sideSquare)
                    break
                case 4:

                    switch(mode) {
                        case modes.DEFAULT:
                        case modes.CREATE:
                        case modes.AI_LOADING:
                            ctx.drawImage(images.get('ball'), j * sideSquare, i * sideSquare, sideSquare, sideSquare)
                            break
                        case modes.PLAY:
                        case modes.AI:
                        case modes.BALLS_SHOWING:
                            var indexBall = findElement(balls, i, j)
                            var ball = balls[indexBall]

                            ctx.drawImage(images.get('ball'), ball.x, ball.y, sideSquare, sideSquare)
                            break
                    }    

                    break
            }
        }
    }

    //this is to solve the problem of the aposition of player and other stuff, now the player is the last thing I paint
    if(mode === modes.PLAY || mode === modes.AI_LOADING){
        ctx.drawImage(images.get('player'), player.x, player.y, sideSquare, sideSquare)
    } else if(mode === modes.AI) {
        
        if(showLines){
            ctx.strokeStyle = "#898989";
            ctx.beginPath()

            mesureLines()
        }

        players.forEach(player => {

            ctx.drawImage(images.get('player'), player.x, player.y, sideSquare, sideSquare)
            
            //draw lines of player
            if(showLines){
                ctx.moveTo(player.x, player.y + (sideSquare / 2));
                ctx.lineTo(player.x - player.lines.leftLine, player.y + (sideSquare / 2));
                ctx.stroke();

                ctx.moveTo(player.x + sideSquare, player.y + (sideSquare / 2));
                ctx.lineTo(player.x + sideSquare + player.lines.rightLine, player.y + (sideSquare / 2));
                ctx.stroke();

                ctx.moveTo(player.x + (sideSquare / 2), player.y );
                ctx.lineTo(player.x + (sideSquare / 2), player.y - player.lines.upLine);
                ctx.stroke();

                ctx.moveTo(player.x + (sideSquare / 2), player.y + sideSquare );
                ctx.lineTo(player.x + (sideSquare / 2), player.y + sideSquare + player.lines.downLine);
                ctx.stroke();

                ctx.moveTo(player.x + sideSquare, player.y);
                ctx.lineTo(player.x + sideSquare + player.lines.upRightLine, player.y - player.lines.upRightLine);
                ctx.stroke();

                ctx.moveTo(player.x, player.y);
                ctx.lineTo(player.x - player.lines.upLeftLine, player.y - player.lines.upLeftLine);
                ctx.stroke();

                ctx.moveTo(player.x + sideSquare, player.y + sideSquare);
                ctx.lineTo(player.x + sideSquare + player.lines.downRightLine, player.y + sideSquare + player.lines.downRightLine);
                ctx.stroke();

                ctx.moveTo(player.x, player.y + sideSquare);
                ctx.lineTo(player.x - player.lines.downLeftLine, player.y + sideSquare + player.lines.downLeftLine);
                ctx.stroke();
            }
        })

        if(showLines)
            ctx.strokeStyle = "#FFFFFF";
    }
}

function draw() {
    ctx.clearRect(0,0, canvas.width, canvas.height)

    drawGrid()
    
    drawMap()

    if (selectedItem != "" && selectedItem != "modifier" && selectedItem != "modifierJustInseredBall" && xImg !== null && yImg !== null)
        ctx.drawImage(images.get(selectedItem), xImg, yImg, sideSquare, sideSquare)

}

var explBackBtn = document.getElementById("buttonContainer");
if(explBackBtn.addEventListener) {
    explBackBtn.addEventListener("mouseover", function() {
        document.getElementById("explBackPath").classList.toggle("explPathAnimation");
    })   

    explBackBtn.addEventListener("mouseout", function() {
        document.getElementById("explBackPath").classList.toggle("explPathAnimation");
    })  

    explBackBtn.addEventListener("click", function() {
        if(mode === modes.EXPLANATION) {
            setExplanation(false)
        }
    })
}

function setLoadingIcon(value) {
    if(value) {
        var elem = document.getElementById("loadingHidden")
        if(elem)
            elem.setAttribute("id", "loadingVisible")
    } else {
        var elem = document.getElementById("loadingVisible")
        if(elem)
            elem.setAttribute("id", "loadingHidden")
    }
}

function setExplanation(value) {
    if(value) {
        var elem = document.getElementById("explHidden")
        if(elem){
            elem.setAttribute("id", "explVisible")
            mode = modes.EXPLANATION
        }
    } else {
        var elem = document.getElementById("explVisible")
        if(elem) {
            elem.setAttribute("id", "explHidden")
            mode = modes.DEFAULT
        }
    }
}

function setWin(ai = false) {
    var elem = document.getElementById("winHiddenInitial")

    if (!elem)
        elem = document.getElementById("winHidden")

    if(elem) {
        elem.setAttribute("id", "winVisible")

        document.getElementById("winTitle").classList.toggle("animationRemoveWinTitle")
        document.getElementById("winTitle").classList.toggle("animationWinTitle")
        if (!ai) {
            document.getElementById("winSubTitle").classList.toggle("animationRemoveWinSubTitle")
            document.getElementById("winSubTitle").classList.toggle("animationWinSubTitle")
        }
        return
    }
}

function removeWin(ai = false) {
    var elem = document.getElementById("winVisible")
    if(elem) {
        elem.setAttribute("id", "winHidden")

        document.getElementById("winTitle").classList.toggle("animationWinTitle")
        document.getElementById("winTitle").classList.toggle("animationRemoveWinTitle")
        if (!ai) {
            document.getElementById("winSubTitle").classList.toggle("animationWinSubTitle")
            document.getElementById("winSubTitle").classList.toggle("animationRemoveWinSubTitle")
        }   
    } 
}

function editIncLean() {

    if(navsContainer.offsetWidth < 900) {
        document.getElementById("incLeanTitle").textContent = "Inc. Lean."
        document.getElementById("popTitle").textContent = "Pop."
        document.getElementById("genTitle").textContent = "Gen."
    } else {
        document.getElementById("incLeanTitle").textContent = "Incremental Learning"
        document.getElementById("popTitle").textContent = "Population"
        document.getElementById("genTitle").textContent = "Generation"
    }
}

window.onload = function() {
    window.requestAnimationFrame(gameLoop)

    editIncLean()
}

//To fix the resize when AI PLAY
window.onresize = function() {
    editIncLean()
    restartGame(resizing = true)
}

function moveObjects(walls, balls) {
    balls.forEach(function(ball) {
        ball.move(walls)
    })
}

function restartGame(resizing = false) {
    if(mode !== modes.AI && mode !== modes.AI_LOADING && mode !== modes.BALLS_SHOWING) {
        if(!resizing && mode === modes.PLAY) {
            if(win) {
                attemptCounter = 0;
                removeWin()
            } else {
                attemptCounter++;
            }
            document.getElementById("attemptCounter").textContent = attemptCounter    
        }

        if(player !== null) {
            player.x = player.nColumn * sideSquare
            player.y = player.nRow * sideSquare
        }
        
        if(end !== null) {
            end.x = end.nColumn * sideSquare
            end.y = end.nRow * sideSquare
        }

        win = false        
    }

    balls.forEach(ball => {
        ball.side = ball.initSide
        ball.x = ball.startX
        ball.y = ball.startY
    })
}

function Player(nColumn, nRow) {
    this.nColumn = nColumn;
    this.nRow = nRow;

    this.x = nColumn * sideSquare;
    this.y = nRow * sideSquare;
   
    this.speed = sideSquare / 10;
   
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;

    this.lines = new Lines();

    this.move = function(walls) {

        if (this.up){
            this.y -= this.speed

            //rounding the value near the grid
            if (this.y % sideSquare < this.speed)
                this.y = Math.floor(this.y / sideSquare) * sideSquare

            //check the edge of the canvas

            if(this.y < 0)
                this.y = 0
            
            //Going UP I can find a wall only in the nCol and nCol 
            //instead I have to check only one Column if the player is perfect in a single column

            var nCol = Math.floor(this.x / sideSquare)
            var nRow = Math.floor(this.y / sideSquare)

            if(this.x % sideSquare == 0) {
                for(var i = 0; i <= nRow; i++){

                    var index = findElement(walls, i, nCol)

                    if (index != -1) {
                        
                        if(this.y < walls[index].y + sideSquare)
                            this.y = walls[index].y + sideSquare
                    }
                }
            } else {
                for(var i = 0; i <= nRow; i++){
                    for(var j = nCol; j <= (nCol + 1); j++) {

                        var index = findElement(walls, i, j)

                        if (index != -1) {
                            
                            if(this.y < walls[index].y + sideSquare)
                                this.y = walls[index].y + sideSquare
                        }
                    }
                }
            }
        }
        else if (this.down){
            this.y += this.speed

            //rounding
            if ((sideSquare - ((this.y + sideSquare) % sideSquare)) < this.speed)
                this.y = Math.floor((this.y + sideSquare) / sideSquare) * sideSquare

            //check the edge of the canvas

            if(this.y + sideSquare > canvas.height)
                this.y = canvas.height - sideSquare

            //check the walls

            var nCol = Math.floor(this.x / sideSquare)
            var nRow = Math.floor((this.y + sideSquare) / sideSquare)

            if(this.x % sideSquare == 0) {
                for(var i = nRow; i < rows; i++){

                    var index = findElement(walls, i, nCol)

                    if (index != -1) {
                        
                        if(this.y + sideSquare > walls[index].y)
                            this.y = walls[index].y - sideSquare
                    }
                }
            } else { // To finish
                for(var i = nRow; i < rows; i++){
                    for(var j = nCol; j <= (nCol + 1); j++) {

                        var index = findElement(walls, i, j)

                        if (index != -1) {
                            
                            if(this.y + sideSquare > walls[index].y)
                                this.y = walls[index].y - sideSquare
                        }
                    }
                }
            }
        }

        if (this.left){
            this.x -= this.speed

            //rounding the value near the grid
            if (this.x % sideSquare < this.speed)
                this.x = Math.floor(this.x / sideSquare) * sideSquare

            //check the edge of the canvas

            if(this.x < 0)
                this.x = 0

            //check the wall

            var nCol = Math.floor(this.x / sideSquare)
            var nRow = Math.floor(this.y / sideSquare)

            if(this.y % sideSquare == 0) {
                for(var i = 0; i <= nCol; i++){

                    var index = findElement(walls, nRow, i)

                    if (index != -1) {
                        
                        if(this.x < walls[index].x + sideSquare)
                            this.x = walls[index].x + sideSquare
                    }
                }
            } else {
                for(var i = 0; i <= nCol; i++){
                    for(var j = nRow; j <= (nRow + 1); j++) {

                        var index = findElement(walls, j, i)

                        if (index != -1) {
                            
                            if(this.x < walls[index].x + sideSquare)
                                this.x = walls[index].x + sideSquare
                        }
                    }
                }
            }

        } else if (this.right) {
            this.x += this.speed

            //rounding
            if ((sideSquare - ((this.x + sideSquare) % sideSquare)) < this.speed)
                this.x = Math.floor((this.x + sideSquare) / sideSquare) * sideSquare

            //check the edge of the canvas

            if(this.x + sideSquare > canvas.width)
                this.x = canvas.width - sideSquare

            //check the wall
            var nCol = Math.floor((this.x + sideSquare) / sideSquare)
            var nRow = Math.floor(this.y / sideSquare)

            if(this.y % sideSquare == 0) {
                for(var i = nCol; i < columns; i++){

                    var index = findElement(walls, nRow, i)

                    if (index != -1) {
                        
                        if(this.x + sideSquare > walls[index].x)
                            this.x = walls[index].x - sideSquare
                    }
                }
            } else {
                for(var i = nCol; i < columns; i++){
                    for(var j = nRow; j <= (nRow + 1); j++) {

                        var index = findElement(walls, j, i)

                        if (index != -1) {
                            
                            if(this.x + sideSquare > walls[index].x)
                                this.x = walls[index].x - sideSquare
                        }
                    }
                }
            }
        }
    };
}

function Lines() {
    this.leftLine = null
    this.rightLine= null
    this.upLine = null
    this.downLine = null
    this.upRightLine = null
    this.upLeftLine = null
    this.downRightLine = null
    this.downLeftLine = null
}

function Wall(nRow, nColumn) {
    this.nRow = nRow
    this.nColumn = nColumn

    this.x = this.nColumn * sideSquare
    this.y = this.nRow * sideSquare

    this.vertical = ""
    this.horizontal = ""

    this.playerStopUp = false
    this.playerStopDown = false
    this.playerStopLeft = false
    this.playerStopRight = false
}

function Ball(nRow, nColumn) {
    this.nRow = nRow
    this.nColumn = nColumn

    this.x = this.nColumn * sideSquare
    this.y = this.nRow * sideSquare

    this.startX = this.x
    this.startY = this.y

    this.dir = "horizontal" // or vertical
    this.speed = sideSquare / 8
    this.initSide = "left"
    this.side = "left" // or right, up, down

    this.getNowColumn = function() {
        return Math.floor(this.x / sideSquare)
    }

    this.getNowRow = function() {
        return Math.floor(this.y / sideSquare)
    }

    this.move = function(walls) {
        switch(this.dir) {
            case "horizontal":

                if(this.side == "left") {
                    this.x -= this.speed

                    //Now I have to check all the wall in the line
                    walls.forEach(wall => {
                        if(this.x < wall.x + sideSquare && this.x + sideSquare > wall.x + sideSquare && this.y == wall.y) {
                            this.x = wall.x + sideSquare
                            this.side = "right"
                            return
                        }
                    })

                    if(this.x < 0) {
                        this.x = 0
                        this.side = "right"
                    }

                } else if(this.side == "right") {
                    this.x += this.speed

                    //Now I have to check all the wall in the line
                    walls.forEach(wall => {
                        if(this.x + sideSquare > wall.x && this.x < wall.x && this.y == wall.y) {
                            this.x = wall.x - sideSquare
                            this.side = "left"
                            return
                        }
                    })

                    if(this.x + sideSquare > canvas.width) {
                        this.x = canvas.width - sideSquare
                        this.side = "left"
                    }
                }

                break
            case "vertical":

                if(this.side == "up") {
                    this.y -= this.speed

                    //Now I have to check all the wall in the line
                    walls.forEach(wall => {
                        if(this.y < wall.y + sideSquare && this.y + sideSquare > wall.y + sideSquare && this.x == wall.x) {
                            this.y = wall.y + sideSquare
                            this.side = "down"
                            return
                        }
                    })

                    if(this.y < 0) {
                        this.y = 0
                        this.side = "down"
                    }

                } else if(this.side == "down") {
                    this.y += this.speed

                    //Now I have to check all the wall in the line
                    walls.forEach(wall => {
                        if(this.y + sideSquare > wall.y && this.y < wall.y && this.x == wall.x) {
                            this.y = wall.y - sideSquare
                            this.side = "up"
                            return
                        }
                    })

                    if(this.y + sideSquare > canvas.height) {
                        this.y = canvas.height - sideSquare
                        this.side = "up"
                    }
                }

                break
        }
    }
}

function End(nRow, nColumn) {
    this.nRow = nRow
    this.nColumn = nColumn

    this.x = this.nColumn * sideSquare
    this.y = this.nRow * sideSquare
}

function findElement(array, nRow, nColumn) {
    indexElement = -1
    array.forEach(function(element, index) {
        if(element.nRow == nRow && element.nColumn == nColumn){
            indexElement = index
            return
        }
    })

    return indexElement
}