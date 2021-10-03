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

//To make it change in like a form
var population = 30
var genToLoad = 0
var genToShow = 0
var genOutputs = []
var genLoading = -1
var movement = 0

var showLines = false;
var incLean = true;

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
    showGrid = false
    if(showGrid) {
        for(var i = 1; i < rows; i++) {
            drawLine([0, sideSquare * i], [canvas.width, sideSquare * i], 'black', 1)
        }

        for(var j = 1; j < columns; j++) {
            drawLine([sideSquare * j, 0], [sideSquare * j, canvas.height], 'black', 1)
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

var modImg = document.getElementById("modifierImage") //modifierImage element
if (modImg.addEventListener){
    modImg.addEventListener("click", function() {
        selectedItem = 'modifier'
    })
}

var plImg = document.getElementById("playerImage") //playerImage element
if (plImg.addEventListener){
    plImg.addEventListener("click", function() {
        selectedItem = 'player'
        disableModifier()
    })
}

var wlImg = document.getElementById("wallImage") //wallImage element
if (wlImg.addEventListener){
    wlImg.addEventListener("click", function() {
        selectedItem = 'fullWall'
        disableModifier()
    })
}

var blImg = document.getElementById("ballImage") //ballImage element
if (blImg.addEventListener){
    blImg.addEventListener("click", function() {
        selectedItem = 'ball'
        disableModifier()
    })
}

var endImg = document.getElementById("endImage") //wallImage element
if (endImg.addEventListener){
    endImg.addEventListener("click", function() {
        selectedItem = 'end'
        disableModifier()
    })
}

var rmImg = document.getElementById("removeImage") //removeImage element
if (rmImg.addEventListener){
    rmImg.addEventListener("click", function() {
        selectedItem = 'remove'
        disableModifier()
    })
}

var showBtn = document.getElementById("showMovements") //removeImage element
if (showBtn.addEventListener){
    showBtn.addEventListener("click", function() {
        if(mode === modes.CREATE) {
            selectedItem = ''
            disableModifier()
            mode = modes.BALLS_SHOWING
        }
    })
}

var stopBtn = document.getElementById("stopMovements") //removeImage element
if (stopBtn.addEventListener){
    stopBtn.addEventListener("click", function() {
        if(mode === modes.BALLS_SHOWING) {
            selectedItem = ''
            restartGame()
            mode = modes.CREATE
        }
    })
}

addEventListener('mousedown', event => {
    //add the item to the map if is possible
    if (event.clientX > pLeft && event.clientX < (pLeft + canvas.width)) {
        if (event.clientY > (pTop + navsContainer.clientHeight) && event.clientY < (pTop + navsContainer.clientHeight + canvas.height)){
            if (selectedItem != ""){
                mouseDown = true
            console.log("iN HERE")
            }
        }
    }
})

addEventListener('mouseup', event => {
    if (selectedItem != ""){
        mouseDown = false
        console.log("OUT HERE")
    }
})

//Una soluzioni potrebbe essere andare a scorrere i tag e SE ho clicclato sull'interdo DIV, quindi il blocco crosso 
//che tiene tutto potrei andare  a dire di salvare le nuove x - y

addEventListener('click', event => {

    console.log("CLICK: " + event.target.classList[0])

    if (event.target.classList[0] !== "arrows" && event.target.classList[0] !== "gameDiv" && event.clientX > pLeft && event.clientX < (pLeft + canvas.width)) {
        if (event.clientY > (pTop + navsContainer.clientHeight) && event.clientY < (pTop + navsContainer.clientHeight + canvas.height)){
            if (selectedItem != "")
                if(selectedItem == "modifier")
                    modifing(event.clientX, event.clientY) 
                else    
                    positioning(event.clientX, event.clientY) 
        }
    } else if (event.target.classList[0] === "arrows") {
        paddings = getPaddingsLeftTop()
        setxyImg(event.clientX, event.clientY, paddings[0], paddings[1])
    }
})

addEventListener('mousemove', (event) => {

    if (event.target.classList[0] !== "arrows" && selectedItem != "" && selectedItem != "modifier") {
        paddings = getPaddingsLeftTop()
        pLeft = paddings[0]
        pTop = paddings[1]

        if (event.clientX > pLeft && event.clientX < (pLeft + canvas.width)) {
            if (event.clientY > (pTop + navsContainer.clientHeight) && event.clientY < (pTop + navsContainer.clientHeight + canvas.height)){
                setxyImg(event.clientX, event.clientY, pLeft, pTop)
                if (mouseDown){
                    positioning(event.clientX, event.clientY)
                }
            } else {
                xImg = null
                yImg = null
            }
        } else {
            xImg = null
            yImg = null
        }
    }
})

function getPaddingsLeftTop() {
    numbs = gameDiv.style.paddingLeft.length
    pLeft = parseInt(gameDiv.style.paddingLeft.substring(0,numbs))
    numbs = gameDiv.style.paddingTop.length
    pTop = parseInt(gameDiv.style.paddingTop.substring(0,numbs))
    
    a = [pLeft, pTop]

    return a
}

function setxyImg(x, y, pLeft, pTop) {
    xImg = x - pLeft - (sideSquare/2)
    yImg = y - navsContainer.clientHeight - pTop - (sideSquare/2)
}


function positioning(clientX, clientY) {
    x = clientX - pLeft
    y = clientY - pTop - navsContainer.clientHeight

    nColumn = Math.floor(x / sideSquare)
    nRow = Math.floor(y / sideSquare)

    switch(selectedItem){
        case "player":
            
            if (!playerPlaced && map[nRow][nColumn] == 0) {
                map[nRow][nColumn] = 1
                playerPlaced = true
                player = new Player(nColumn, nRow)

                walls.forEach(wall => {
                    wall.setPlayerPosition(player)
                })
            }
            
            break
        case "fullWall":

            if(map[nRow][nColumn] == 0){
                map[nRow][nColumn] = 2
                var wall = new Wall(nRow, nColumn)
                walls.push(wall)

                if(player !== null)
                    wall.setPlayerPosition(player)

            }
            break
        
        case "ball":
                
            if(map[nRow][nColumn] == 0){
                map[nRow][nColumn] = 4
                var ball = new Ball(nRow, nColumn)
                balls.push(ball)
                
                
                selectedItem = 'modifierJustInseredBall'
                exBall = true
                modifing(clientX, clientY)
                
            }
        break
        
        case "remove":

            if (map[nRow][nColumn] == 1) {
                playerPlaced = false
                player = null
            } else if(map[nRow][nColumn] == 2) {
                var indexWall = findElement(walls, nRow, nColumn)
                if(indexWall != -1)
                    walls.splice(indexWall, 1)
            } else if(map[nRow][nColumn] == 3) {
                //var indexEnd = findElement(ends, nRow, nColumn)
                //if(indexEnd != -1)
                //    ends.splice(indexEnd, 1)
                end = null
            } else if(map[nRow][nColumn] == 4) {
                var indexBall = findElement(balls, nRow, nColumn)
                if(indexBall != -1)
                    balls.splice(indexBall, 1)
            } //have to finish the removing of all other stuff 

            map[nRow][nColumn] = 0
            
            break
        
        case 'end':

            if(map[nRow][nColumn] == 0 && end === null){
                map[nRow][nColumn] = 3
                end = new End(nRow, nColumn)
                //ends.push(end)
            }

            break
    }

}

function modifing(clientX, clientY) {
    x = clientX - pLeft
    y = clientY - pTop - navsContainer.clientHeight

    nColumn = Math.floor(x / sideSquare)
    nRow = Math.floor(y / sideSquare)


    switch(map[nRow][nColumn]) {
        case 4:
            if (selectedBall === null) {
                var indexBall = findElement(balls, nRow, nColumn)
                selectedBall = balls[indexBall]
                
                //ableModifier(clientX, clientY - navsContainer.clientHeight)
                numbs = gameDiv.style.paddingLeft.length
                pLeft = parseInt(gameDiv.style.paddingLeft.substring(0,numbs))
                numbs = gameDiv.style.paddingTop.length
                pTop = parseInt(gameDiv.style.paddingTop.substring(0,numbs))
                ableModifier(selectedBall.startX + (sideSquare / 2) + pLeft, selectedBall.startY + (sideSquare / 2) + pTop)
            }
            break
        default:
            //console.log("disabilitato dal modifing")
            disableModifier()
            break
    }
}

function ableModifier(x, y) {
    modPanelBool = true

    var side = sideSquare * 2 * 3
    var dimImg = (sideSquare * 2) - 20

    modPanelBall.style.height = side + "px"
    modPanelBall.style.width = side + "px"

    modPanelBall.style.top = (y - (side/2)) + "px"
    modPanelBall.style.left = (x - (side/2)) + "px"

    arrowUpImg.style.width = dimImg + "px"
    arrowUpImg.style.height = dimImg + "px"

    arrowLeftImg.style.width = dimImg + "px"
    arrowLeftImg.style.height = dimImg + "px"
    
    arrowRightImg.style.width = dimImg + "px"
    arrowRightImg.style.height = dimImg + "px"
    
    arrowDownImg.style.width = dimImg + "px"
    arrowDownImg.style.height = dimImg + "px"

    modPanelBall.style.display = "flex"
}

function disableModifier() {
    if(modPanelBool){
        modPanelBool = false
        modPanelBall.style.top = "0px"
        modPanelBall.style.left = "0px"
        modPanelBall.style.display = "none"
        selectedBall = null
        
        if(exBall){
            selectedItem = 'ball'
            exBall = false
        }
    }
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

if (arrowUpImg.addEventListener){
    arrowUpImg.addEventListener("click", function() {
        if(selectedBall !== null){
            selectedBall.dir = "vertical"
            selectedBall.initSide = "up"
            selectedBall.side = "up"
            //console.log("disabilitato dal tasto")
            disableModifier()
        }
    })
}

if (arrowLeftImg.addEventListener){
    arrowLeftImg.addEventListener("click", function() {
        if(selectedBall !== null){
            selectedBall.dir = "horizontal"
            selectedBall.initSide = "left"
            selectedBall.side = "left"
            disableModifier()
        }
    })
}

if (arrowRightImg.addEventListener){
    arrowRightImg.addEventListener("click", function() {
        if(selectedBall !== null){
            selectedBall.dir = "horizontal"
            selectedBall.side = "right"
            selectedBall.initSide = "right"
            disableModifier()
        }
    })
}

if (arrowDownImg.addEventListener){
    arrowDownImg.addEventListener("click", function() {
        if(selectedBall !== null){
            selectedBall.dir = "vertical"
            selectedBall.initSide = "down"
            selectedBall.side = "down"
            disableModifier()
        }
    })
}

function startCreateLevel() {
    mode = modes.CREATE
    document.getElementById("createNavInactive").setAttribute("id", "subNavActive");
    return true
}

function endCreateLevel() {
    mode = modes.DEFAULT
    selectedItem = ""
    xImg = null
    yImg = null
    disableModifier()
    canvas.style.cursor = "default"
}

window.onload = function() {
    window.requestAnimationFrame(gameLoop)

    editIncLean()
}

window.onresize = function() {
    editIncLean()
    restartGame(resizing = true)
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


//PLAY GAME

function startPlayLevel() {
    if (player == null || end == null) {
        Swal.fire( {
            title: 'Something is missing',
            text: 'Make sure you have placed the player and the end',
            iconHtml: '<img style = "height: 100%; background-color: #898989;" src="/static/img/warning.svg">',
            customClass: {
                icon: 'iconWarning'
              },        
            confirmButtonColor: "#2F2F2F"
        })    

        return false
    } else {
        document.getElementById("playNavInactive").setAttribute("id", "subNavActive");
        mode = modes.PLAY
        return true
    }
}

function endPlayLevel() {
    mode = modes.DEFAULT
    win = false
    removeWin()
    restartGame()
}

//I can make a change, I can work always with an array and if I'm not in AI mode I can work always with only the first element
function checkCollision() {

    //now I have to check the collision with the balls
    //to check this is really easy, the circle has a formula, simply check if

    //(x - x0)^2 + (y - y0)^2 = r^2
    var r = sideSquare / 2

    balls.forEach(ball => {
        var x0 = (ball.x) + r
        var y0 = (ball.y) + r

        var result1corner = Math.pow((player.x - x0), 2) + Math.pow((player.y - y0), 2)
        var result2corner = Math.pow(((player.x + sideSquare) - x0), 2) + Math.pow((player.y - y0), 2)
        var result3corner = Math.pow(((player.x + sideSquare) - x0), 2) + Math.pow(((player.y + sideSquare) - y0), 2)
        var result4corner = Math.pow((player.x - x0), 2) + Math.pow(((player.y + sideSquare) - y0), 2)

        var result1edge = Math.pow(((player.x + r) - x0), 2) + Math.pow((player.y - y0), 2)
        var result2edge = Math.pow(((player.x + sideSquare) - x0), 2) + Math.pow(((player.y + r) - y0), 2)
        var result3edge = Math.pow(((player.x + r) - x0), 2) + Math.pow(((player.y + sideSquare) - y0), 2)
        var result4edge = Math.pow((player.x - x0), 2) + Math.pow(((player.y + r) - y0), 2)

        if(result1corner < Math.pow(r, 2) || result2corner < Math.pow(r, 2) || result3corner < Math.pow(r, 2) || result4corner < Math.pow(r, 2)){
            restartGame()
        }

        if(result1edge < Math.pow(r, 2) || result2edge < Math.pow(r, 2) || result3edge < Math.pow(r, 2) || result4edge < Math.pow(r, 2)){
            restartGame()
        }
            
    })

    //check contact with the end, so win the game
    //I can make it surely more efficient

    if (!win) {
        if(player.x < end.x + sideSquare && player.x + sideSquare > end.x + sideSquare  && player.y == end.y) {
            win = true
            setWin()
        } else if(player.x + sideSquare > end.x && player.x < end.x  && player.y == end.y) {
            win = true
            setWin()
        } else if(player.y < end.y + sideSquare && player.y + sideSquare > end.y + sideSquare  && player.x == end.x) {
            win = true
            setWin()
        } else if(player.y + sideSquare > end.y && player.y < end.y  && player.x == end.x) {
            win = true
            setWin()
        } else if(player.x < end.x + sideSquare && player.x + sideSquare > end.x + sideSquare && player.y < end.y + sideSquare && player.y + sideSquare > end.y + sideSquare) {
            win = true
            setWin()
        } else if(player.x < end.x + sideSquare && player.x + sideSquare > end.x + sideSquare && player.y + sideSquare > end.y && player.y < end.y) {
            win = true
            setWin()
        } else if(player.x + sideSquare > end.x && player.x < end.x && player.y < end.y + sideSquare && player.y + sideSquare > end.y + sideSquare) {
            win = true
            setWin()
        } else if(player.x + sideSquare > end.x && player.x < end.x && player.y + sideSquare > end.y && player.y < end.y) {
            win = true
            setWin()
        }
    }
}

//this function will be called only before send the inputs
function mesureLines() {

    players.forEach(player => {

        var xC = player.x + (sideSquare / 2)
        var yC = player.y + (sideSquare / 2)
        //var nC = Math.floor(xC / sideSquare) //number of column
        //var nR = Math.floor(yC / sideSquare) //number of rows
    
        //start from the left
        var nColumnLeft = Math.floor(player.x / sideSquare)
        var nRowHorizontal = Math.floor(yC / sideSquare)
        var nSquareDistance = 0
        player.lines.leftLine = ((nColumnLeft) * sideSquare) + (player.x % sideSquare)
    
        for(var i = nColumnLeft; i >= 0; i--) {
            if(map[nRowHorizontal][i] != 0) {
                if (map[nRowHorizontal][i] == 2 || map[nRowHorizontal][i] == 3) {
                    nSquareDistance = (nColumnLeft - i) - 1 //otherwise the line will go to the end of the wall
                    player.lines.leftLine = (nSquareDistance * sideSquare) + (player.x % sideSquare)
                    break
                } 
            }
    
            var foudABall = false
            balls.forEach(ball => {
                switch(ball.dir) {
                    case 'horizontal':
                        if ((ball.getNowRow() == nRowHorizontal) && (ball.getNowColumn() == i || (ball.getNowColumn() + 1) == i)) //I have to cover two block with the ball
                            foudABall = true
                        break
                    case 'vertical':
                        if ((ball.getNowRow() == nRowHorizontal || (ball.getNowRow() + 1) == nRowHorizontal) && (ball.getNowColumn() == i))
                        foudABall = true
                        break
                }
    
                if(foudABall)
                    return
            })
    
            if (foudABall){
                nSquareDistance = (nColumnLeft - i) - 1
                player.lines.leftLine = (nSquareDistance * sideSquare) + (player.x % sideSquare)
                break
            }
    
        }
    
        //now the right line
        var nColumnRight = Math.floor((player.x + sideSquare) / sideSquare)
        nSquareDistance = 0
        player.lines.rightLine = ((columns - nColumnRight - 1) * sideSquare) + (sideSquare - ((player.x + sideSquare) % sideSquare))
    
        for(var i = nColumnRight; i < columns; i++) {
            if(map[nRowHorizontal][i] != 0) {
                if (map[nRowHorizontal][i] == 2 || map[nRowHorizontal][i] == 3) {
                    nSquareDistance = (i - nColumnRight) - 1 //otherwise the line will go to the end of the wall
                    player.lines.rightLine = (nSquareDistance * sideSquare) + (sideSquare - (player.x % sideSquare))
                    break
                }
            }
    
            var foudABall = false
            balls.forEach(ball => {
                switch(ball.dir) {
                    case 'horizontal':
                        if ((ball.getNowRow() == nRowHorizontal) && (ball.getNowColumn() == i || (ball.getNowColumn() + 1) == i)) //I have to cover two block with the ball
                            foudABall = true
                        break
                    case 'vertical':
                        if ((ball.getNowRow() == nRowHorizontal || (ball.getNowRow() + 1) == nRowHorizontal) && (ball.getNowColumn() == i))
                        foudABall = true
                        break
                }
    
                if(foudABall)
                    return
            })
    
            if (foudABall){
                nSquareDistance = (i - nColumnRight) - 1 
                player.lines.rightLine = (nSquareDistance * sideSquare) + (sideSquare - (player.x % sideSquare))
                break
            }
    
        }
    
        //now up line
        var nRowUp = Math.floor(player.y / sideSquare)
        var nColumnVertical = Math.floor(xC / sideSquare)
        nSquareDistance = 0
        player.lines.upLine = ((nRowUp) * sideSquare) + (player.y % sideSquare)
    
        for(var i = nRowUp; i >= 0; i--) {
            if(map[i][nColumnVertical] != 0) {
                if (map[i][nColumnVertical] == 2 || map[i][nColumnVertical] == 3) {
                    nSquareDistance = (nRowUp - i) - 1 //otherwise the line will go to the end of the wall
                    player.lines.upLine = (nSquareDistance * sideSquare) + (player.y % sideSquare)
                    break
                }
            }
    
            var foudABall = false
            balls.forEach(ball => {
                switch(ball.dir) {
                    case 'horizontal':
                        if ((ball.getNowRow() == i) && (ball.getNowColumn() == nColumnVertical || (ball.getNowColumn() + 1) == nColumnVertical)) //I have to cover two block with the ball
                            foudABall = true
                        break
                    case 'vertical':
                        if ((ball.getNowRow() == i || (ball.getNowRow() + 1) == i) && (ball.getNowColumn() == nColumnVertical))
                        foudABall = true
                        break
                }
    
                if(foudABall)
                    return
            })
    
            if (foudABall){
                nSquareDistance = (nRowUp - i) - 1 //otherwise the line will go to the end of the wall
                player.lines.upLine = (nSquareDistance * sideSquare) + (player.y % sideSquare)
                break
            }
        }
    
        //down line
        var nRowDown = Math.floor((player.y + sideSquare) / sideSquare)
        nSquareDistance = 0
        player.lines.downLine = ((rows - nRowDown - 1) * sideSquare) + (sideSquare - ((player.y + sideSquare) % sideSquare))
    
        for(var i = nRowDown; i < rows; i++) {
            if(map[i][nColumnVertical] != 0) {
                if (map[i][nColumnVertical] == 2 || map[i][nColumnVertical] == 3) {
                    nSquareDistance = (i - nRowDown) - 1 //otherwise the line will go to the end of the wall
                    player.lines.downLine = (nSquareDistance * sideSquare) + (sideSquare - (player.y % sideSquare))
                    break
                }
            }
    
            var foudABall = false
            balls.forEach(ball => {
                switch(ball.dir) {
                    case 'horizontal':
                        if ((ball.getNowRow() == i) && (ball.getNowColumn() == nColumnVertical || (ball.getNowColumn() + 1) == nColumnVertical)) //I have to cover two block with the ball
                            foudABall = true
                        break
                    case 'vertical':
                        if ((ball.getNowRow() == i || (ball.getNowRow() + 1) == i) && (ball.getNowColumn() == nColumnVertical))
                        foudABall = true
                        break
                }
    
                if(foudABall)
                    return
            })
    
            if (foudABall){
                nSquareDistance = (i - nRowDown) - 1 //otherwise the line will go to the end of the wall
                player.lines.downLine = (nSquareDistance * sideSquare) + (sideSquare - (player.y % sideSquare))
                break
            }
        }
    
        //up right line (maybe change the algoritm)
        var xD = player.x + sideSquare // x for diagonal line
        var yD = player.y // y for diagonal line
    
        var nColD = Math.floor(xD / sideSquare)
        var nRowD = Math.floor(yD / sideSquare)
        
        var xl = xD % sideSquare
        var yl = yD % sideSquare 
    
        if((sideSquare - xl) == yl || (player.x % sideSquare == 0 && player.y % sideSquare == 0)) {
            //console.log("DIAGONALE")
            //check if the player is in a perfect rectangle
            
            if(player.x % sideSquare == 0 && player.y % sideSquare == 0) { //if that I have to adjust the number of col and row
                nColD -= 1
            }
    
            var nSquareDistanceX = (columns - 1) - nColD
            var nSquareDistanceY = nRowD
    
            nSquareDistance = Math.min(nSquareDistanceX, nSquareDistanceY)
    
            player.lines.upRightLine = nSquareDistance * sideSquare + (player.y % sideSquare)
    
            for(var i = 0; i <= nSquareDistance; i++) {
                if(map[nRowD - i][nColD + i] == 2 || map[nRowD - i][nColD + i] == 3) {
                    if(player.y % sideSquare == 0)
                        player.lines.upRightLine = (i - 1) * sideSquare
                    else
                        player.lines.upRightLine = (i - 1) * sideSquare + (player.y % sideSquare)
                    break
                } else if(map[nRowD - i][nColD + i] == 0) {
                    if(((nRowD - i - 1) >= 0 && (nColD + i + 1) < columns) && (map[nRowD - i - 1][nColD + i] == 2 || map[nRowD - i - 1][nColD + i] == 3) && (map[nRowD - i][nColD + i + 1] == 2 || map[nRowD - i][nColD + i + 1] == 3)) {
                        if(player.y % sideSquare == 0)
                            player.lines.upRightLine = (i) * sideSquare
                        else
                            player.lines.upRightLine = (i) * sideSquare + (player.y % sideSquare)
                        break
                    }
                }
    
                var foudABall = false
                balls.forEach(ball => {
                    switch(ball.dir) {
                        case 'horizontal':
                            if ((ball.getNowRow() == (nRowD - i)) && ((ball.getNowColumn() == (nColD + i)) || (ball.getNowColumn() + 1) == (nColD + i))) //I have to cover two block with the ball
                                foudABall = true
                            break
                        case 'vertical':
                            if ((ball.getNowRow() == (nRowD - i) || (ball.getNowRow() + 1) == (nRowD - i)) && (ball.getNowColumn() == (nColD + i)))
                                foudABall = true
                            break
                    }
    
                    if(foudABall)
                        return
                })
    
                if (foudABall){
                    if(player.y % sideSquare == 0)
                        player.lines.upRightLine = (i - 1) * sideSquare
                    else
                        player.lines.upRightLine = (i - 1) * sideSquare + (player.y % sideSquare)
                    break
                }
                    
            }
    
        } else {
    
            //check if I'm on the ledge of a column
            if(player.x % sideSquare == 0)
                nColD -= 1
    
            //lenght of line till the edge
            var maxY = player.y
            var maxX = canvas.width - (player.x + sideSquare)
            
            player.lines.upRightLine = Math.min(maxX, maxY) 
    
            //check the diagonals square
            var nSquareDistanceX = (columns - 1) - nColD
            var nSquareDistanceY = nRowD
            
            nSquareDistance = Math.min(nSquareDistanceX, nSquareDistanceY)
    
            if((sideSquare - xl) < yl || player.x % sideSquare == 0) {
                //sotto
                //console.log("SOTTO")
    
                for(var i = 0; i <= nSquareDistance * 2; i++) {
                    
                    if(i % 2 == 0) {
                        nColD += 1
                        if(nColD >= columns)
                            nColD = columns - 1
                    } else {
                        nRowD -= 1
                        if(nRowD < 0)
                            nRowD = 0
                    }
    
                    if(map[nRowD][nColD] == 2 || map[nRowD][nColD] == 3) {
                        if(i % 2 == 0) {
                            player.lines.upRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                        } else {
                            player.lines.upRightLine = player.y - ((nRowD + 1) * sideSquare)
                        }
                        break
                    }
    
                    var foudABall = false
                    balls.forEach(ball => {
                        switch(ball.dir) {
                            case 'horizontal':
                                if ((ball.getNowRow() == (nRowD)) && ((ball.getNowColumn() == (nColD)) || (ball.getNowColumn() + 1) == (nColD))) //I have to cover two block with the ball
                                    foudABall = true
                                break
                            case 'vertical':
                                if ((ball.getNowRow() == (nRowD) || (ball.getNowRow() + 1) == (nRowD)) && (ball.getNowColumn() == (nColD)))
                                    foudABall = true
                                break
                        }
    
                        if(foudABall)
                            return
                    })
    
                    if (foudABall){
                        if(i % 2 == 0) {
                            player.lines.upRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                        } else {
                            player.lines.upRightLine = player.y - ((nRowD + 1) * sideSquare)
                        }
                        break
                    }
                }
            } else if((sideSquare - xl) > yl) {
                //sopra
                //console.log("SOPRA")
                for(var i = 0; i <= nSquareDistance * 2; i++) {
                    
                    if(i % 2 == 0) {
                        nRowD -= 1
                        if(nRowD < 0)
                            nRowD = 0
                    } else {
                        nColD += 1
                        if(nColD >= columns)
                            nColD = columns - 1
                    }
    
                    if(map[nRowD][nColD] == 2 || map[nRowD][nColD] == 3) {
    
                        if(i % 2 == 0) {
                            player.lines.upRightLine = player.y - ((nRowD + 1) * sideSquare)
                        } else {
                            player.lines.upRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                        }
    
                        break
                    }
    
                    var foudABall = false
                    balls.forEach(ball => {
                        switch(ball.dir) {
                            case 'horizontal':
                                if ((ball.getNowRow() == (nRowD)) && ((ball.getNowColumn() == (nColD)) || (ball.getNowColumn() + 1) == (nColD))) //I have to cover two block with the ball
                                    foudABall = true
                                break
                            case 'vertical':
                                if ((ball.getNowRow() == (nRowD) || (ball.getNowRow() + 1) == (nRowD)) && (ball.getNowColumn() == (nColD)))
                                    foudABall = true
                                break
                        }
    
                        if(foudABall)
                            return
                    })
    
                    if (foudABall){
                        if(i % 2 == 0) {
                            player.lines.upRightLine = player.y - ((nRowD + 1) * sideSquare)
                        } else {
                            player.lines.upRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                        }
                        break
                    }
                }
            }
    
        }     
    
        //up left line (maybe change the algoritm)
        var xD = player.x // x for diagonal line
        var yD = player.y // y for diagonal line
    
        var nColD = Math.floor(xD / sideSquare)
        var nRowD = Math.floor(yD / sideSquare)
        
        var xl = xD % sideSquare
        var yl = yD % sideSquare 
    
        if(xl == yl || (player.x % sideSquare == 0 && player.y % sideSquare == 0)) {
            //console.log("DIAGONALE")
            
            nSquareDistance = Math.min(nColD, nRowD)
    
            player.lines.upLeftLine = nSquareDistance * sideSquare + (player.y % sideSquare)
    
            for(var i = 0; i <= nSquareDistance; i++) {
                if(map[nRowD - i][nColD - i] == 2 || map[nRowD - i][nColD - i] == 3) {
                    if(player.y % sideSquare == 0)
                        player.lines.upLeftLine = (i - 1) * sideSquare
                    else
                        player.lines.upLeftLine = (i - 1) * sideSquare + (player.y % sideSquare)
                    break
                } else if(map[nRowD - i][nColD - i] == 0) {
                    if(((nRowD - i - 1) >= 0 && (nColD - i - 1) >= 0) && (map[nRowD - i - 1][nColD - i] == 2 || map[nRowD - i - 1][nColD - i] == 3) && (map[nRowD - i][nColD - i - 1] == 2 || map[nRowD - i][nColD - i - 1] == 3)) {
                        if(player.y % sideSquare == 0)
                            player.lines.upLeftLine = (i) * sideSquare
                        else {
                            player.lines.upLeftLine = (i) * sideSquare + (player.y % sideSquare)
                        }
                        break
    
                    }
                }
    
                var foudABall = false
                balls.forEach(ball => {
                    switch(ball.dir) {
                        case 'horizontal':
                            if ((ball.getNowRow() == (nRowD - i)) && ((ball.getNowColumn() == (nColD - i)) || (ball.getNowColumn() + 1) == (nColD - i)))
                                foudABall = true
                            break
                        case 'vertical':
                            if ((ball.getNowRow() == (nRowD - i) || (ball.getNowRow() + 1) == (nRowD - i)) && (ball.getNowColumn() == (nColD - i)))
                                foudABall = true
                            break
                    }
    
                    if(foudABall)
                        return
                })
    
                if (foudABall){
                    if(player.y % sideSquare == 0)
                        player.lines.upLeftLine = (i - 1) * sideSquare
                    else
                        player.lines.upLeftLine = (i - 1) * sideSquare + (player.y % sideSquare)
                    break
                }
    
            }
    
        } else {
    
            //lenght of line till the edge
            var maxY = player.y
            var maxX = player.x
            var maxDistance
    
            player.lines.upLeftLine = Math.min(player.x, player.y) 
    
            nSquareDistance = Math.min(nColD, nRowD)
    
            if(xl < yl || player.x % sideSquare == 0) {
                //sotto
                //console.log("SOTTO")
    
                for(var i = 0; i <= nSquareDistance * 2; i++) {
                    
                    if(i % 2 == 0) {
                        nColD -= 1
                        if(nColD < 0)
                            nColD = 0
                    } else {
                        nRowD -= 1
                        if(nRowD < 0)
                            nRowD = 0
                    }
    
                    if(map[nRowD][nColD] == 2 || map[nRowD][nColD] == 3) {
    
                        if(i % 2 == 0) {
                            player.lines.upLeftLine = (player.x) - ((nColD + 1) * sideSquare)  
                        } else {
                            player.lines.upLeftLine = player.y - ((nRowD + 1) * sideSquare)
                        }
    
                        break
                    }
    
                    var foudABall = false
                    balls.forEach(ball => {
                        switch(ball.dir) {
                            case 'horizontal':
                                if ((ball.getNowRow() == (nRowD)) && ((ball.getNowColumn() == (nColD)) || (ball.getNowColumn() + 1) == (nColD))) //I have to cover two block with the ball
                                    foudABall = true
                                break
                            case 'vertical':
                                if ((ball.getNowRow() == (nRowD) || (ball.getNowRow() + 1) == (nRowD)) && (ball.getNowColumn() == (nColD)))
                                    foudABall = true
                                break
                        }
    
                        if(foudABall)
                            return
                    })
    
                    if (foudABall){
                        if(i % 2 == 0) 
                            player.lines.upLeftLine = (player.x) - ((nColD + 1) * sideSquare)  
                         else 
                            player.lines.upLeftLine = player.y - ((nRowD + 1) * sideSquare)
                        break
                    }
                }
            } else if(xl > yl) {
                //sopra
                //console.log("SOPRA")
                for(var i = 0; i <= nSquareDistance * 2; i++) {
                    
                    if(i % 2 == 0) {
                        nRowD -= 1
                        if(nRowD < 0)
                            nRowD = 0
                    } else {
                        nColD -= 1
                        if(nColD < 0)
                            nColD = 0
                    }
    
                    if(map[nRowD][nColD] == 2 || map[nRowD][nColD] == 3) {
    
                        if(i % 2 == 0) {
                            player.lines.upLeftLine = player.y - ((nRowD + 1) * sideSquare)
                        } else {
                            player.lines.upLeftLine = (player.x) - ((nColD + 1) * sideSquare)
                        }
    
                        break
                    }
    
                    var foudABall = false
                    balls.forEach(ball => {
                        switch(ball.dir) {
                            case 'horizontal':
                                if ((ball.getNowRow() == (nRowD)) && ((ball.getNowColumn() == (nColD)) || (ball.getNowColumn() + 1) == (nColD))) //I have to cover two block with the ball
                                    foudABall = true
                                break
                            case 'vertical':
                                if ((ball.getNowRow() == (nRowD) || (ball.getNowRow() + 1) == (nRowD)) && (ball.getNowColumn() == (nColD)))
                                    foudABall = true
                                break
                        }
    
                        if(foudABall)
                            return
                    })
    
                    if (foudABall){
                        if(i % 2 == 0) {
                            player.lines.upLeftLine = player.y - ((nRowD + 1) * sideSquare)
                        } else {
                            player.lines.upLeftLine = (player.x) - ((nColD + 1) * sideSquare)
                        }
                        break
                    }
                }
            }
        }     
    
        //down right line
        xD = player.x + sideSquare // x for diagonal line
        yD = player.y + sideSquare// y for diagonal line
    
        nColD = Math.floor(xD / sideSquare)
        nRowD = Math.floor(yD / sideSquare)
        
        xl = xD % sideSquare
        yl = yD % sideSquare 
    
        if(xl == yl || (player.x % sideSquare == 0 && player.y % sideSquare == 0)) {
            //console.log("DIAGONALE")
    
            //check if the player is in a perfect rectangle
            if(player.x % sideSquare == 0 && player.y % sideSquare == 0) { //if that I have to adjust the number of col and row
                nColD -= 1
                nRowD -= 1
            }
    
            var nSquareDistanceX = (columns - 1) - nColD
            var nSquareDistanceY = (rows - 1) - nRowD
    
            nSquareDistance = Math.min(nSquareDistanceX, nSquareDistanceY)
    
            player.lines.downRightLine = (nSquareDistance * sideSquare) + (sideSquare - (player.y % sideSquare))  //CORREGGERE
    
            for(var i = 0; i <= nSquareDistance; i++) {
                if(map[nRowD + i][nColD + i] == 2 || map[nRowD + i][nColD + i] == 3) {
                    if(player.y % sideSquare == 0)
                        player.lines.downRightLine = (i - 1) * sideSquare
                    else
                        player.lines.downRightLine = (i - 1) * sideSquare + (sideSquare - (player.y % sideSquare))
                    break
                } else if(map[nRowD + i][nColD + i] == 0) {
                    if(((nRowD + i + 1) < rows && (nColD + i + 1) < columns) && (map[nRowD + i + 1][nColD + i] == 2 || map[nRowD + i + 1][nColD + i] == 3) && (map[nRowD + i][nColD + i + 1] == 2 || map[nRowD + i][nColD + i + 1] == 3)) {
                        if(player.y % sideSquare == 0)
                            player.lines.downRightLine = (i) * sideSquare
                        else
                            player.lines.downRightLine = (i) * sideSquare + (sideSquare - (player.y % sideSquare))
                        break
    
                    }
                }
    
                var foudABall = false
                balls.forEach(ball => {
                    switch(ball.dir) {
                        case 'horizontal':
                            if ((ball.getNowRow() == (nRowD + i)) && ((ball.getNowColumn() == (nColD + i)) || (ball.getNowColumn() + 1) == (nColD + i)))
                                foudABall = true
                            break
                        case 'vertical':
                            if ((ball.getNowRow() == (nRowD + i) || (ball.getNowRow() + 1) == (nRowD + i)) && (ball.getNowColumn() == (nColD + i)))
                                foudABall = true
                            break
                    }
    
                    if(foudABall)
                        return
                })
    
                if (foudABall){
                    if(player.y % sideSquare == 0)
                        player.lines.downRightLine = (i - 1) * sideSquare
                    else
                        player.lines.downRightLine = (i - 1) * sideSquare + (sideSquare - (player.y % sideSquare))
                    break
                }
            }
    
        } else {
    
            //check if I'm on the ledge of a column
            if(player.x % sideSquare == 0){ //if that I have to adjust the number of col and row
                nColD -= 1
            }
            if(player.y % sideSquare == 0){ //if that I have to adjust the number of col and row
                nRowD -= 1
            }
    
            //lenght of line till the edge
            var maxY = canvas.height - (player.y + sideSquare)
            var maxX = canvas.width - (player.x + sideSquare)
            
            player.lines.downRightLine = Math.min(maxX, maxY) 
    
            //check the diagonals square
            var nSquareDistanceX = (columns - 1) - nColD
            var nSquareDistanceY = (rows - 1) - nRowD
            
            nSquareDistance = Math.min(nSquareDistanceX, nSquareDistanceY)
    
            if((xl > yl || player.x % sideSquare == 0) && player.y % sideSquare != 0) {
                //sopra
                //console.log("SOPRA")
                for(var i = 0; i <= nSquareDistance * 2; i++) {
                    
                    if(i % 2 == 0) {
                        nColD += 1
                        if(nColD >= columns)
                            nColD = columns - 1
                    } else {
                        nRowD += 1
                        if(nRowD >= rows)
                            nRowD = rows - 1
                    }
    
                    if(map[nRowD][nColD] == 2 || map[nRowD][nColD] == 3) {
    
                        if(i % 2 == 0) {
                            player.lines.downRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                        } else {
                            player.lines.downRightLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                        }
    
                        break
                    }
    
                    var foudABall = false
                    balls.forEach(ball => {
                        switch(ball.dir) {
                            case 'horizontal':
                                if ((ball.getNowRow() == (nRowD)) && ((ball.getNowColumn() == (nColD)) || (ball.getNowColumn() + 1) == (nColD))) //I have to cover two block with the ball
                                    foudABall = true
                                break
                            case 'vertical':
                                if ((ball.getNowRow() == (nRowD) || (ball.getNowRow() + 1) == (nRowD)) && (ball.getNowColumn() == (nColD)))
                                    foudABall = true
                                break
                        }
    
                        if(foudABall)
                            return
                    })
    
                    if (foudABall){
                        if(i % 2 == 0) {
                            player.lines.downRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                        } else {
                            player.lines.downRightLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                        }
                        break
                    }
                }
            } else if(xl < yl || player.y % sideSquare == 0) {
                //sotto
                //console.log("SOTTO")
    
                for(var i = 0; i <= nSquareDistance * 2; i++) { //Non capisco molto questa cosa ma Vabbè
                    
                    if(i % 2 == 0) {
                        nRowD += 1
                        if(nRowD >= rows)
                            nRowD = rows - 1
                    } else {
                        nColD += 1
                        if(nColD >= columns)
                            nColD = columns - 1
                    }
    
                    if(map[nRowD][nColD] == 2 || map[nRowD][nColD] == 3) {
    
                        if(i % 2 == 0) {
                            player.lines.downRightLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                        } else {
                            player.lines.downRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                        }
    
                        break
                    }
    
                    var foudABall = false
                    balls.forEach(ball => {
                        switch(ball.dir) {
                            case 'horizontal':
                                if ((ball.getNowRow() == (nRowD)) && ((ball.getNowColumn() == (nColD)) || (ball.getNowColumn() + 1) == (nColD))) //I have to cover two block with the ball
                                    foudABall = true
                                break
                            case 'vertical':
                                if ((ball.getNowRow() == (nRowD) || (ball.getNowRow() + 1) == (nRowD)) && (ball.getNowColumn() == (nColD)))
                                    foudABall = true
                                break
                        }
    
                        if(foudABall)
                            return
                    })
    
                    if (foudABall){
                        if(i % 2 == 0) {
                            player.lines.downRightLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                        } else {
                            player.lines.downRightLine = (nColD * sideSquare) - (player.x + sideSquare)
                        }
                        break
                    }
                }
            }
    
        }    
    
        //down left line (maybe change the algoritm)
        var xD = player.x // x for diagonal line
        var yD = player.y + sideSquare // y for diagonal line
    
        var nColD = Math.floor(xD / sideSquare)
        var nRowD = Math.floor(yD / sideSquare)
        
        var xl = xD % sideSquare
        var yl = yD % sideSquare 
    
        if((sideSquare - xl) == yl || (player.x % sideSquare == 0 && player.y % sideSquare == 0)) {
            //console.log("DIAGONALE")
            //check if the player is in a perfect rectangle
            
            if(player.x % sideSquare == 0 && player.y % sideSquare == 0) { //if that I have to adjust the number of col and row
                nRowD -= 1
            }
    
            var nSquareDistanceX = nColD
            var nSquareDistanceY = (rows - 1) - nRowD
    
            nSquareDistance = Math.min(nSquareDistanceX, nSquareDistanceY)
    
            player.lines.downLeftLine = (nSquareDistance * sideSquare) + (sideSquare - (player.y % sideSquare))
    
            for(var i = 0; i <= nSquareDistance; i++) {
                if(map[nRowD + i][nColD - i] == 2 || map[nRowD + i][nColD - i] == 3) {
                    if(player.y % sideSquare == 0)
                        player.lines.downLeftLine = (i - 1) * sideSquare
                    else
                        player.lines.downLeftLine = (i - 1) * sideSquare + (sideSquare - (player.y % sideSquare))
                    break
                } else if(map[nRowD + i][nColD - i] == 0) {
                    if(((nRowD + i + 1) < rows && (nColD - i - 1) >= 0) && (map[nRowD + i + 1][nColD - i] == 2 || map[nRowD + i + 1][nColD - i] == 3) && (map[nRowD + i][nColD - i - 1] == 2 || map[nRowD + i][nColD - i + 1] == 3)) {
                        if(player.y % sideSquare == 0)
                            player.lines.downLeftLine = (i) * sideSquare
                        else
                            player.lines.downLeftLine = (i) * sideSquare + (sideSquare - (player.y % sideSquare))
                        break
    
                    }
                }
    
                var foudABall = false
                balls.forEach(ball => {
                    switch(ball.dir) {
                        case 'horizontal':
                            if ((ball.getNowRow() == (nRowD + i)) && ((ball.getNowColumn() == (nColD - i)) || (ball.getNowColumn() + 1) == (nColD - i)))
                                foudABall = true
                            break
                        case 'vertical':
                            if ((ball.getNowRow() == (nRowD + i) || (ball.getNowRow() + 1) == (nRowD + i)) && (ball.getNowColumn() == (nColD - i)))
                                foudABall = true
                            break
                    }
    
                    if(foudABall)
                        return
                })
    
                if (foudABall){
                    if(player.y % sideSquare == 0)
                        player.lines.downLeftLine = (i - 1) * sideSquare
                    else
                        player.lines.downLeftLine = (i - 1) * sideSquare + (sideSquare - (player.y % sideSquare))
                    break
                }
            }
    
        } else {
    
            //check if I'm on the ledge of a column
            if(player.y % sideSquare == 0)
                nRowD -= 1
    
            //lenght of line till the edge
            var maxY = canvas.height - (player.y + sideSquare)
            var maxX = player.x
            
            player.lines.downLeftLine = Math.min(maxX, maxY) 
    
            //check the diagonals square
            var nSquareDistanceX = nColD
            var nSquareDistanceY = (rows - 1) - nRowD
            
            nSquareDistance = Math.min(nSquareDistanceX, nSquareDistanceY)
    
            if(((sideSquare - xl) < yl || player.y % sideSquare == 0) && (player.x % sideSquare != 0)) {
                //sotto
                //console.log("SOTTO")
    
                for(var i = 0; i <= nSquareDistance * 2; i++) {
                    
                    if(i % 2 == 0) {
                        nRowD += 1
                        if(nRowD >= rows)
                            nRowD = rows - 1
                    } else {
                        nColD -= 1
                        if(nColD < 0)
                            nColD = 0
                    }
    
                    if(map[nRowD][nColD] == 2 || map[nRowD][nColD] == 3) {
    
                        if(i % 2 == 0) {
                            player.lines.downLeftLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                        } else {
                            player.lines.downLeftLine = player.x - ((nColD + 1) * sideSquare)
                        }
    
                        break
                    }
    
                    var foudABall = false
                    balls.forEach(ball => {
                        switch(ball.dir) {
                            case 'horizontal':
                                if ((ball.getNowRow() == (nRowD)) && ((ball.getNowColumn() == (nColD)) || (ball.getNowColumn() + 1) == (nColD))) //I have to cover two block with the ball
                                    foudABall = true
                                break
                            case 'vertical':
                                if ((ball.getNowRow() == (nRowD) || (ball.getNowRow() + 1) == (nRowD)) && (ball.getNowColumn() == (nColD)))
                                    foudABall = true
                                break
                        }
    
                        if(foudABall)
                            return
                    })
    
                    if (foudABall){
                        if(i % 2 == 0) {
                            player.lines.downLeftLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                        } else {
                            player.lines.downLeftLine = player.x - ((nColD + 1) * sideSquare)
                        }
                        break
                    }
                }
            } else if((sideSquare - xl) > yl || player.x % sideSquare == 0) {
                //sopra
                //console.log("SOPRA")
                for(var i = 0; i <= nSquareDistance * 2; i++) {
                    
                    if(i % 2 == 0) {
                        nColD -= 1
                        if(nColD < 0)
                            nColD = 0
                    } else {
                        nRowD += 1
                        if(nRowD >= rows)
                            nRowD = rows - 1
                    }
    
                    if(map[nRowD][nColD] == 2 || map[nRowD][nColD] == 3) {
    
                        if(i % 2 == 0) {
                            player.lines.downLeftLine = player.x - ((nColD + 1) * sideSquare)
                        } else {
                            player.lines.downLeftLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                        }
    
                        break
                    }
    
                    var foudABall = false
                    balls.forEach(ball => {
                        switch(ball.dir) {
                            case 'horizontal':
                                if ((ball.getNowRow() == (nRowD)) && ((ball.getNowColumn() == (nColD)) || (ball.getNowColumn() + 1) == (nColD))) //I have to cover two block with the ball
                                    foudABall = true
                                break
                            case 'vertical':
                                if ((ball.getNowRow() == (nRowD) || (ball.getNowRow() + 1) == (nRowD)) && (ball.getNowColumn() == (nColD)))
                                    foudABall = true
                                break
                        }
    
                        if(foudABall)
                            return
                    })
    
                    if (foudABall){
                        if(i % 2 == 0) {
                            player.lines.downLeftLine = player.x - ((nColD + 1) * sideSquare)
                        } else {
                            player.lines.downLeftLine = ((nRowD) * sideSquare) - (player.y + sideSquare)
                        }
                        break
                    }
                }
            }
        }
    })
    
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

    this.setPlayerPosition = function(player) {
        //set the vertical
        if(player.y + sideSquare <= this.y) {
            this.vertical = 'up'
        } else if (player.y >= this.y + sideSquare){
            this.vertical = 'down'
        } else {
            this.vertical = ""
        }

        //set the horizontal
        if(player.x + sideSquare <= this.x) {
            this.horizontal = 'left'
        } else if (player.x >= this.x + sideSquare){
            this.horizontal = 'right'
        } else {
            this.horizontal = ""
        }
    }
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

function checkKeyDown(e) {

    e = e || window.event;

    if(mode == modes.PLAY) {
        if (e.keyCode == '38') {
            // up arrow
            if (player !== null){
                player.up = true
            }
        }
        
        if (e.keyCode == '40') {
            // down arrow
            if (player !== null){
                player.down = true
            }
        }
        
        if (e.keyCode == '37') {
            // left arrow
            if (player !== null){
                player.left = true
            }
        }
        
        if (e.keyCode == '39') {
            // right arrow
            if (player !== null){
                player.right = true
            }
        }
    }
}

function checkKeyUp(e) {

    e = e || window.event;

    if(mode == modes.PLAY) {
        if (e.keyCode == '38') {
            // up arrow
            if (player !== null)
                player.up = false
        }
        
        if (e.keyCode == '40') {
            // down arrow
            if (player !== null)
                player.down = false
            }
        
        if (e.keyCode == '37') {
            // left arrow
            if (player !== null)
                player.left = false
        }
        
        if (e.keyCode == '39') {
            // right arrow
            if (player !== null)
                player.right = false
        }
    }
}

window.onkeydown = checkKeyDown;
window.onkeyup = checkKeyUp;


//AI PLAY GAME
idClient = -1

var playAiBtn = document.getElementById("playAiBtn");
if(playAiBtn.addEventListener) {
    playAiBtn.addEventListener("click", function() {
       //the problems are solved by the startComunicationAi function
       startComunicationAi()
       removeWin(ai = true)
    })   
}

var stopAiBtn = document.getElementById("stopAiBtn");
if(stopAiBtn.addEventListener) {
    stopAiBtn.addEventListener("click", function() {
        if (mode === modes.AI || mode === modes.AI_LOADING) {
            endComunicationAi()
        }
    })   
}

var toggleLines = document.getElementById("toggleLines");
if(toggleLines.addEventListener) {
    toggleLines.addEventListener("click", function() {
        document.getElementById("linesNo").classList.toggle("toggleVisible");
        document.getElementById("linesYes").classList.toggle("toggleVisible");

        showLines = !showLines
    })   
}

var toggleLines = document.getElementById("toggleIncLean");
if(toggleLines.addEventListener) {
    toggleLines.addEventListener("click", function() {

        document.getElementById("IncLeanNo").classList.toggle("toggleVisible");
        document.getElementById("IncLeanYes").classList.toggle("toggleVisible");

        incLean = !incLean
    })   
}

var popNumber = document.getElementById("popNumber");
popNumber.textContent = population

var moreBtn = document.getElementById("moreBtn");
if(moreBtn.addEventListener) {
    moreBtn.addEventListener("mouseover", function() {
        document.getElementById("morePath").classList.toggle("popPathAnimation");
    })   

    moreBtn.addEventListener("mouseout", function() {
        document.getElementById("morePath").classList.toggle("popPathAnimation");
    })   

    moreBtn.addEventListener("click", function() {
        population += 5
        
        if (population > 200)
            population = 200
        
        popNumber.textContent = population

    })
}

var lessBtn = document.getElementById("lessBtn");
if(lessBtn.addEventListener) {
    lessBtn.addEventListener("mouseover", function() {
        document.getElementById("lessPath").classList.toggle("popPathAnimation");
    })   

    lessBtn.addEventListener("mouseout", function() {
        document.getElementById("lessPath").classList.toggle("popPathAnimation");
    })   

    lessBtn.addEventListener("click", function() {
        population -= 5

        if (population < 5)
            population = 5

        popNumber.textContent = population
    })
}

function checkWinAI(players) {
    w = false
    players.forEach(player =>{
        if(player.x < end.x + sideSquare && player.x + sideSquare > end.x + sideSquare  && player.y == end.y) {
            setWin(ai=true)
            w = true
        } else if(player.x + sideSquare > end.x && player.x < end.x  && player.y == end.y) {
            setWin(ai=true)
            w = true
        } else if(player.y < end.y + sideSquare && player.y + sideSquare > end.y + sideSquare  && player.x == end.x) {
            setWin(ai=true)
            w = true
        } else if(player.y + sideSquare > end.y && player.y < end.y  && player.x == end.x) {
            setWin(ai=true)
            w = true
        } else if(player.x < end.x + sideSquare && player.x + sideSquare > end.x + sideSquare && player.y < end.y + sideSquare && player.y + sideSquare > end.y + sideSquare) {
            setWin(ai=true)
            w = true
        } else if(player.x < end.x + sideSquare && player.x + sideSquare > end.x + sideSquare && player.y + sideSquare > end.y && player.y < end.y) {
            setWin(ai=true)
            w = true
        } else if(player.x + sideSquare > end.x && player.x < end.x && player.y < end.y + sideSquare && player.y + sideSquare > end.y + sideSquare) {
            setWin(ai=true)
            w = true
        } else if(player.x + sideSquare > end.x && player.x < end.x && player.y + sideSquare > end.y && player.y < end.y) {
            setWin(ai=true)
            w = true
        }
    });

    return w
}


function startAiPlayLevel() {
    //setting mode

    if (player == null || end == null) {
        Swal.fire( {
            title: 'Something is missing',
            text: 'Make sure you have placed the player and the end',
            iconHtml: '<img style = "height: 100%; background-color: #898989;" src="/static/img/warning.svg">',
            customClass: {
                icon: 'iconWarning'
              },        
            confirmButtonColor: "#2F2F2F"
        })    

        return false
    } else {
        document.getElementById("aiNavInactive").setAttribute("id", "subNavActive");

        return true
    }
}

function endAiPlayLevel() {
    mode = modes.DEFAULT
    incomingWin = false
    winAi = false    
    restartGame()
    removeWin(ai = true)
}

function endComunicationAi() {

    mode = modes.DEFAULT
    setLoadingIcon(false)
    restartGame()
    incomingWin = false
    winAi = false

    genToLoad = 0
    genToShow = 0
    genOutputs = []
    genLoading = -1
    movement = 0
    players = []

    var csrf = $("input[name=csrfmiddlewaretoken]").val()

    //send the message to stop the play
    $.ajax ({
        url : 'input/endAiPlay',
        type : "post",
        data : {
            value: "stopPlay",
            idClient : idClient,
            csrfmiddlewaretoken : csrf
        },
        success: function(response) {
            console.log(response.value)
        }
    })
}

function startComunicationAi() {
    //start the AI only if the mode is to default - avoid the double clicking
    if(mode !== modes.DEFAULT)
        return

    //Creating the initiale message to start the AI play
    var ballsString = []

    balls.forEach(ball => {
        var ballObj = {
            nCol: ball.nColumn,
            nRow: ball.nRow,
            dir: ball.dir,
            initSide: ball.initSide
        }

        ballsString.push(JSON.stringify(ballObj))
    })

    var csrf = $("input[name=csrfmiddlewaretoken]").val()

    //send the message to start the AI PLAY GAME and in the mainwhile active a loading animation
    $.ajax ({
        url : 'input/startAiPlay',
        type : "post",
        data : {
            value: "Start AI Play",
            map: JSON.stringify(map),
            balls: ballsString,
            columns: columns,
            rows: rows,
            incremental: incLean,
            population: population,
            csrfmiddlewaretoken : csrf
        },
        success: function(response) {
            
            console.log(response.value)
            idClient = response.idClient
            console.log(idClient)
            
            mode = modes.AI_LOADING
            setLoadingIcon(true)
        }
    })
}

function aiPlay() {

    if(movement == 0){
        for(var i = 0; i < genOutputs[genToShow].length; i++) {
            pl = new Player(player.nColumn, player.nRow)
            players.push(pl)
        }
        restartGame();

        //setting the mode to AI to show the players
        mode = modes.AI
        setLoadingIcon(false)
    }

    toRemove = []

    //console.log("Questa è la dimensione di tutti i movimetni dei giocatori (dovrebbe essere fissa a 30) " + genOutputs[genToShow].length + " - " + players.length)

    genOutputs[genToShow].forEach(function(outs, i){

        //console.log(outs.length)
        
        // If the previous was the last movement I have to remove
        if(outs.length <= movement) {
            toRemove.push(i)
        } else {
            players[i].y = ((outs[movement][0]) * canvas.height) / (rows * 10)
            players[i].x = ((outs[movement][1]) * canvas.width) / (columns * 10)
        }

    })

    moveObjects(walls, balls)

    //remove the player I have to remove
    toRemove.forEach(index => {
        genOutputs[genToShow].splice(index, 1)
        players.splice(index, 1)
    })

    if(players.length <= 0){
        //console.log("QUI NON DOVREBBE ENTRARE MAI MA PERCHE' CAZZO NON LO FA?")
        movement = 0
        genToShow++;

        //update the write
        document.getElementById("generationCount").textContent = genToShow
        mode = modes.AI_LOADING
        
        if(!winAi){
            setLoadingIcon(true)
        }

    } else {
        movement++;
    }

}


function requestGeneration() {

    var csrf = $("input[name=csrfmiddlewaretoken]").val()

    console.log("Sending request generation for: " + genToLoad)

    $.ajax ({
        url : 'input/generation',
        type : "post",
        data : {
            value: "NewGenerationNeeded",
            generation: genToLoad,
            idClient : idClient,
            csrfmiddlewaretoken : csrf
        },
        // async: false,
        success: function(response) {

            if(response.value !== 'Stopped') {

                console.log("Arrived generation: " +  genToLoad)
            
                //to initialize

                if(response.win === true){
                    incomingWin = true
                    console.log("This generation win: " + genToLoad)
                    genToLoad = 0
                } else {
                    genToLoad++;
                }

                var outputs = JSON.parse(response.outputsGeneration)

                genOutputs.push(outputs)

                //console.log("Lughezza dell'ouutput " + outputs[0].length)
                //console.log("COntenuto: \n " + response.outputsGeneration)
                console.log("COntenuto: \n " + outputs[0][0])
            }
            else {
                console.log("arrived usefull generation")
            }
        },
        error: function() {
            //Have to make an error screen, something like "Something bad append..."
            console.log("Error in request generation")
            //Request again the generation, don't know if this is a proper way
            requestGeneration()
        }
    })
}

window.addEventListener("beforeunload", function(event) { 
    endComunicationAi()
});