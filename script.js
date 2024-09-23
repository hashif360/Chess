// Initialize the chessboard and game logic
var board = null; // This will hold the chessboard on the screen
var game = new Chess(); // This initializes a new chess game using the Chess.js library
var $status = $('#status'); // This connects to an HTML element where we will display the game status (like whose turn it is)
var aiDepth = 2; // AI search depth (how many moves ahead the AI thinks; increase for a harder AI)

// Function to make the AI move
function makeAIMove() {
    // Get the best possible move the AI can make using minimax algorithm
    var bestMove = getBestMove(game, aiDepth);
    game.move(bestMove); // Make the move in the game
    board.position(game.fen()); // Update the visual board to reflect the AI move
    updateStatus(); // Update the game status text (e.g., who's turn, checkmate, etc.)
}

// Minimax algorithm with alpha-beta pruning (this helps the AI think smartly)
function minimax(game, depth, alpha, beta, maximizingPlayer) {
    // Base case: if we've reached maximum depth or the game is over, evaluate the board position
    if (depth === 0 || game.game_over()) {
        return -evaluateBoard(game.board()); // Return the evaluation of the board (how good/bad the position is)
    }

    // Get all possible moves the current player can make
    var moves = game.moves();

    // If it's the AI's turn (maximizingPlayer), find the move that gives the best score
    if (maximizingPlayer) {
        var maxEval = -Infinity;
        for (var i = 0; i < moves.length; i++) {
            game.move(moves[i]); // Try a move
            var eval = minimax(game, depth - 1, alpha, beta, false); // Recursively evaluate the result of that move
            game.undo(); // Undo the move after checking
            maxEval = Math.max(maxEval, eval); // Keep track of the best (maximum) score
            alpha = Math.max(alpha, eval); // Update alpha (best move so far for AI)
            if (beta <= alpha) {
                break; // Alpha-beta pruning: stop searching if we found a move that can't be beaten
            }
        }
        return maxEval; // Return the best score found
    } 
    // If it's the opponent's turn (minimizingPlayer), find the move that gives the worst score for the AI
    else {
        var minEval = Infinity;
        for (var i = 0; i < moves.length; i++) {
            game.move(moves[i]); // Try a move
            var eval = minimax(game, depth - 1, alpha, beta, true); // Recursively evaluate the result of that move
            game.undo(); // Undo the move after checking
            minEval = Math.min(minEval, eval); // Keep track of the worst (minimum) score
            beta = Math.min(beta, eval); // Update beta (worst move so far for opponent)
            if (beta <= alpha) {
                break; // Alpha-beta pruning: stop searching if this move is already worse than another move
            }
        }
        return minEval; // Return the worst score found (for the opponent)
    }
}

// Function to evaluate the board
// This function gives a score to the current board to figure out which player has the advantage
function evaluateBoard(board) {
    var totalEvaluation = 0; // Start with a score of 0
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            totalEvaluation += getPieceValue(board[i][j], i ,j); // Add the value of each piece to the score
        }
    }
    return totalEvaluation; // Return the total score for the board
}

// Function to determine the value of a piece on the board
function getPieceValue(piece, x, y) {
    if (piece === null) {
        return 0; // If there's no piece on the square, it's worth 0
    }

    // Helper function to return the absolute value of each piece
    var getAbsoluteValue = function (piece, isWhite, x ,y) {
        // Piece values: pawn = 10, knight = 30, bishop = 30, rook = 50, queen = 90, king = 900
        var pieceValue = {
            'p': 10,
            'n': 30,
            'b': 30,
            'r': 50,
            'q': 90,
            'k': 900
        }[piece.type]; // Use the piece type to get its value
        return pieceValue; // Return the value of the piece
    };

    var absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x, y); // Get the value based on the piece type
    return piece.color === 'w' ? absoluteValue : -absoluteValue; // White pieces are positive, black pieces are negative
}

// Function to get the best move for the AI using minimax algorithm
function getBestMove(game, depth) {
    var newGameMoves = game.moves(); // Get all possible moves for the AI
    var bestMove = null; // To store the best move we find
    var bestValue = -Infinity; // Start with a very low value

    // Loop through all possible moves and evaluate them
    for (var i = 0; i < newGameMoves.length; i++) {
        var move = newGameMoves[i];
        game.move(move); // Try a move
        var boardValue = minimax(game, depth - 1, -Infinity, Infinity, false); // Evaluate the result using minimax
        game.undo(); // Undo the move after evaluating
        if (boardValue > bestValue) { // If the move is better than the previous best, update the best move
            bestValue = boardValue;
            bestMove = move;
        }
    }
    return bestMove; // Return the best move we found
}

// Function to handle the user's move when they start dragging a piece
function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) {
        return false; // Don't allow moves if the game is over
    }

    // Only allow the user to move white pieces (AI plays black)
    if (piece.search(/^b/) !== -1) {
        return false;
    }
}

// Function to handle what happens when the user drops a piece on a new square
function onDrop(source, target) {
    // Try to make the move
    var move = game.move({
        from: source, // From square
        to: target,   // To square
        promotion: 'q' // Always promote pawns to queens
    });

    // Illegal move?
    if (move === null) {
        return 'snapback'; // Return the piece to its original square
    }

    updateStatus(); // Update the game status

    // Make the AI move after a short delay (250 ms)
    window.setTimeout(makeAIMove, 250);
}

// Function to update the game status (e.g., who's turn, checkmate, draw)
function updateStatus() {
    var status = ''; // Status message

    var moveColor = 'White'; // Start with White's turn
    if (game.turn() === 'b') {
        moveColor = 'Black'; // If it's black's turn, update the message
    }

    // Check if the game is over
    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'; // Checkmate
    } else if (game.in_draw()) {
        status = 'Game over, drawn position.'; // Draw
    } else {
        status = moveColor + ' to move'; // Otherwise, it's the next player's turn

        // Is the player in check?
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'; // Add to the message if the player is in check
        }
    }

    $status.html(status); // Update the HTML with the status message
}

// Configure the chessboard (visual appearance and behavior)
var config = {
    draggable: true, // Allow the user to drag pieces
    position: 'start', // Start with the pieces in the initial chess position
    onDragStart: onDragStart, // What to do when a piece is picked up
    onDrop: onDrop, // What to do when a piece is dropped
    orientation: 'white', // The user plays as white
    pieceTheme: '{piece}.png' // Use standard piece images from Gdrive
};

// Initialize the chessboard
board = Chessboard('board', config);

// Update the game status at the start
updateStatus();
