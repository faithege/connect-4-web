export function switchCurrentPlayer(currentPlayer: Player): Player {
    if(currentPlayer === "r") {
        return "y"
    }
    else if (currentPlayer === "y") {
        return "r"
    }

}