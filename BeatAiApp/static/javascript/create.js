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

var toggleGrid = document.getElementById("toggleGrid");
if(toggleGrid.addEventListener) {
    toggleGrid.addEventListener("click", function() {
        document.getElementById("linesNo").classList.toggle("toggleVisible");
        document.getElementById("linesYes").classList.toggle("toggleVisible");

        showGrid = !showGrid
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

    //console.log("CLICK: " + event.target.classList[0])

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
            }
            
            break
        case "fullWall":

            if(map[nRow][nColumn] == 0){
                map[nRow][nColumn] = 2
                var wall = new Wall(nRow, nColumn)
                walls.push(wall)
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