//To make it change in like a form
var population = 30
var genToLoad = 0
var genToShow = 0
var genOutputs = []
var genLoading = -1
var movement = 0

var showLines = false;
var incLean = true;

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
    if (mode === modes.AI || mode === modes.AI_LOADING)
        endComunicationAi()
});



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