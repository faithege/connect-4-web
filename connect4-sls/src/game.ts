import { Player, Board, Column, Place } from "./models"

export function switchCurrentPlayer(currentPlayer: Player): Player | undefined {
    switch(currentPlayer) {
        case "r":
            return "y"
        case "y":
            return "r"
        default:
            return undefined
}

function selectColumn(board:Board, columnIndex: number): Column{
    return board.map(row => row[columnIndex]).reverse() //returns an array - of type Column
}


function getColumns(board:Board): Column[]{ //returns an array of columns as opposed to an array of rows(which is what the board is)
    //board.map(row => selectColumn(board, row))
			// what I started doing, I guess ultimately I would then fill an array with the xth value for each row

		//here we start by defining an empty array of 7 places - then convert each place into an array of the xth elements
    const numberOfColumns = board[0].length
		// alone Array(x) is an abstract construct, we need to fill it for the array to be properly defined and iterable. we can fill with any dummy value (as it's being replaced), we chose undefined.
		// For each index we make use of the selectColumn function and return all the 0s, all the 1s etc
    return Array(numberOfColumns).fill(undefined).map((_, index) => selectColumn(board, index))
}

//Did this all by myself!
function getBoxDiagonals<T>(box:T[][], boxSize: number): T[][] {
    if (box.length < boxSize || box[0].length < boxSize){
        return []
    }

    const forwardDiagonal = box.map((row, rowIndex) => { return row[rowIndex] })
    const backwardDiagonal = box.map((row, rowIndex) => { return row[boxSize - rowIndex - 1] })

    return [forwardDiagonal,backwardDiagonal]
}

function getDiagonalWindows(board:Board, windowSize: number): Place[][]{
    const boxWindows = slidingBox(board, windowSize)

    // by using flatmap we will return an array of all the possible diagonals of the correct size
    return boxWindows.flatMap(box => getBoxDiagonals(box, windowSize))
}

function getRowWindows(board:Board, windowSize: number): Place[][]{
    return board.flatMap(row => slidingWindow(row, windowSize))
}

function getColumnWindows(board:Board, windowSize: number): Place[][]{
    //we have to create our columns as an array of arrays (essentially rotating the board around)
    const columns = getColumns(board)
    // and then do the same check for any winners across each column
    return columns.flatMap(column => slidingWindow(column, windowSize))
}

function findEmptyRow(column:Column): number | undefined{
    // will not return a number if column full or column does not exist
    const row = column.findIndex(row => row === '.')
    return row === -1 ? undefined : 5 - row // need to re-reverse the order
}

function placeCounter(board:Board, columnIndex: number, player: Player): Board{
    const column = selectColumn(board, columnIndex)
    const rowIndex = findEmptyRow(column)

    if (rowIndex === undefined) {  //can't check for falsie as 0 is valid answer
        throw "This column is full, please choose another";
    }
    else {
        board[rowIndex][columnIndex] = player
    }
    return board

}

function popOutCounter(board:Board, columnIndex: number): Board{
    //remove counter, and add an empty place at top of column  which shift pieces down
    const column = board.map(row => row[columnIndex])
    column.pop()
    column.unshift(".")
    const poppedColumn = column

    board.map((row, index) => row[columnIndex] = poppedColumn[index])

    return board

}

// make type agnostic (can test with numbers as generic)
export function slidingWindow<T>(array: T[], arrayWindowSize: number): T[][]{
    //number of windows = inputarray.length - window + 1

    //edge cases - if array.length<window size
    if (array.length < arrayWindowSize){
        throw "Window size larger than inputted array";
    }

    // not the most efficient but simply written
    return array.map((_, index) => array.slice(index, index + arrayWindowSize))
            .filter( slice => slice.length === arrayWindowSize)
}

//2D version of .slice
export function slice2D<T>(inputBox: T[][], xIndex: number, yIndex: number, boxSize: number): (T[][] | undefined) {
    
    // chop off top and bottom rows
    const xSlicedResult = inputBox.slice(xIndex, xIndex + boxSize)

    // handle cases where we can't fit in the size of a box eg if slice from xIndex 5 for a box size 4 on an input box of 6 - not enough space
    if (xSlicedResult.length !== boxSize){
        return undefined
    }

    // chop off left and right cols
    const ySlicedResult = xSlicedResult.map(row => row.slice(yIndex, yIndex + boxSize))

    if (ySlicedResult[0].length !== boxSize){
        return undefined
    }
    else {
        return ySlicedResult
    }
}

function slidingBox<T>(inputBox: T[][], boxWindowSize: number): T[][][]{
    // create all boxes then filter for correct sizes

    //edge case handling
    if (inputBox.length < boxWindowSize){
        // or could throw an error
        return []
    }
    

    // using flatmap flattens the first array so we get an array of Boxes by mapping across each place in the box to take it from 4D to 3D
    const boxes: (T[][] | undefined)[] = inputBox.flatMap((row,xIndex) => { return row.map((_, yIndex) => slice2D(inputBox, xIndex, yIndex, boxWindowSize)) })
    
    // Filter for the ones of the correct size
    // WHY DOES BOXES DROP UNDEFINED UNION TYPE
    return boxes.filter(box => box !== undefined)

   
}

function checkWindowsForWinner(windows: Place[][]): Player | undefined {

    const results = windows.map(window => {
        // look at each window in turn and assess whether either all rs or all ys
        if(window.every(place => (place === 'r'))){
            return "r"
        }
        else if (window.every(place => (place === 'y'))){
            return "y"
        } else {
            return undefined
        }
    } )
    // end up with an array of elements r/y/undefined (mostly undefined) [undefined, undefined, "r", undefined] for an r winner

    //if there is a winner(either r or y, not undefined, return the winner -> otherwise undefined witll be returned)
    return results.find(result => result !== undefined) 
}


function checkBoardForWinner(board:Board): Player | undefined {
    // We didn't need to define a type here but it makes it helpful in understanding the flow of the code
    const winningLength = 4
    
     //don't need to declare type, inferred
    const rowWindows = getRowWindows(board, winningLength)
    const rowWinner: Player | undefined = checkWindowsForWinner(rowWindows)

    const columnWindows = getColumnWindows(board, winningLength)
    const columnWinner: Player | undefined = checkWindowsForWinner(columnWindows)

    const diagonalWindows = getDiagonalWindows(board, winningLength)
    const diagonalWinner: Player | undefined = checkWindowsForWinner(diagonalWindows)

    //combine them together - if there are no winners, it will be an array of undefineds otherwise it will return either r or y
    const boardWinner = [rowWinner, columnWinner, diagonalWinner].find(result => result !== undefined) 
    
    return boardWinner
}

export async function processPlayerMove(userMove:string, gameBoard: Board, currentPlayer: Player): Promise<Board>{
    if (userMove.toLowerCase().startsWith('pop')){
        const column = userMove.replace('pop','')
        gameBoard = popOutCounter(gameBoard, parseInt(column)-1)
    }
    else {
        gameBoard = placeCounter(gameBoard, parseInt(userMove)-1, currentPlayer) //we need the column to be 0-based so minus 1
    }

    return gameBoard
}

// // check if winner vertical or horizontal
// const winner = checkBoardForWinner(gameBoard);
    

// if (winner){
//     //return potential winner
//     console.log(`Congratulations, you have won ${winner}`)
// }

// return winner
