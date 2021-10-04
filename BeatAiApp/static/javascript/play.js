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