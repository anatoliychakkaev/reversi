(function ($) {
    var black = true, end_game = false, container, think_board,
    board = [
        '0 0 0 0 0 0 0 0'.split(' '),
        '0 0 0 0 0 0 0 0'.split(' '),
        '0 0 0 0 0 0 0 0'.split(' '),
        '0 0 0 w b 0 0 0'.split(' '),
        '0 0 0 b w 0 0 0'.split(' '),
        '0 0 0 0 0 0 0 0'.split(' '),
        '0 0 0 0 0 0 0 0'.split(' '),
        '0 0 0 0 0 0 0 0'.split(' ')
    ],
    costs = [
        '9 2 4 4 4 4 2 9'.split(' '),
        '2 1 3 3 3 3 1 2'.split(' '),
        '4 2 3 2 2 3 2 4'.split(' '),
        '4 3 2 1 1 2 3 4'.split(' '),
        '4 3 2 1 1 2 3 4'.split(' '),
        '4 2 3 2 2 3 2 4'.split(' '),
        '2 1 3 3 3 3 1 2'.split(' '),
        '9 2 4 4 4 4 2 9'.split(' ')
    ];
    function empty(i, j) {
        return board[i][j] != 'w' && board[i][j] != 'b';
    }
    function draw_board() {
        var html = '<table class="reversi">', data = '';
        if (end_game) {
            html += '<tr><td colspan="8" class="info">Победа ' + (end_game == 'w' ? 'белых' : 'черных') + '</td></tr>';
        } else {
            html += '<tr><td colspan="8" class="info">Ход ' + (black ? 'Черных' : 'Белых') + '</td>';
        }
        for (var i = 0; i < 8; i++) {
            html += '<tr>';
            for (var j = 0; j < 8; j++) {
                data = ' data-coords="' + i + ':' + j + '"';
                if (empty(i, j)) {
                    html += '<td class="empty"' + data +'>&nbsp;</td>';
                } else if (board[i][j] == 'b') {
                    html += '<td class="black"' + data +'>b</td>';
                } else {
                    html += '<td class="white"' + data +'>w</td>';
                }
            }
            html += '</tr>';
        }
        html += '</table>';
        container.html(html);
    }
    var matrix = { 1: [0, 1], 2: [0, -1], 3: [1, 0], 4: [-1, 0], 5: [1, -1], 6: [1, 1], 7: [-1, -1], 8: [-1, 1] };
    function clone_board_in_ai_mind() {
        var row;
        think_board = [];
        for (var i = 0; i < 8; i++) {
            row = [];
            for (var j = 0; j < 8; j++) {
                row.push(board[i][j]);
            }
            think_board.push(row);
        }
    }
    function estimate_board_in_mind(color) {
        var cost = 0;
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                if (think_board[i][j] == color) {
                    cost += parseInt(costs[i][j], 10);
                }
            }
        }
        return cost;
    }
    function move(e) {
        var cell = this;
        var coords = $(cell).attr('data-coords').split(':');
        do_move(parseInt(coords[0], 10), parseInt(coords[1], 10));
        draw_board();
        ai_move();
    }
    function ai_move() {
        if (!black) {
            setTimeout(function () {
                do_move();
                draw_board();
                if (!black && !end_game) {
                    ai_move();
                }
            }, 500);
        }
    }
    function do_move(i, j) {
        var vector_state = '', move_state = false, vector;
        var color = black ? 'b' : 'w';
        var opcolor = black ? 'w' : 'b';
        // ai move
        if (typeof i == 'undefined') {
            var variants = [];
            for (i = 0; i < 8; i++) {
                for (j = 0; j < 8; j++) {
                    if (empty(i, j)) {
                        clone_board_in_ai_mind();
                        if (vectors('think')) {
                            think_board[i][j] = color;
                            variants.push({
                                i: i,
                                j: j,
                                cost: estimate_board_in_mind(color)
                            });
                        }
                    }
                }
            }
            variants.sort(function (x, y) {
                return y.cost - x.cost;
            });
            console.log(variants);
            if (variants.length == 0) {
                return false;
            }
            i = variants[0].i;
            j = variants[0].j;
        }

        move_state = false;
        color = black ? 'b' : 'w';
        opcolor = black ? 'w' : 'b';

        function try_vector(dir, delta) {
            var t_i = i + delta * dir[0],
                t_j = j + delta * dir[1];
            if ((vector_state == 'turn' || vector_state == 'est') && delta > 0) {
                if (vector_state == 'turn') {
                    board[t_i][t_j] = color;
                } else {
                    think_board[t_i][t_j] = color;
                }
                try_vector(dir, delta - 1);
            } else if (vector_state == 'check' || vector_state == 'look' || vector_state == 'think') {
                if (0 <= t_i && t_i < 8 && 0 <= t_j && t_j < 8) {
                    if (board[t_i][t_j] == opcolor) {
                        try_vector(dir, delta + 1);
                    } else if (board[t_i][t_j] == color && delta > 1) {
                        move_state = true;
                        if (vector_state == 'check') {
                            vector_state = 'turn';
                            try_vector(dir, delta - 1);
                        } else if (vector_state == 'think') {
                            vector_state = 'est';
                            try_vector(dir, delta - 1);
                        }
                    }
                }
            }
        }
        function vectors(action) {
            console.log(action);
            move_state = false;
            for (var d in matrix) {
                if (matrix.hasOwnProperty(d)) {
                    vector_state = action;
                    try_vector(matrix[d], 1);
                }
            }
            return move_state;
        }
        function can_move(black) {
            move_state = false;
            color = black ? 'b' : 'w';
            opcolor = black ? 'w' : 'b';
            for (i = 0; i < 8; i++) {
                for (j = 0; j < 8; j++) {
                    if (empty(i, j)) {
                        if (vectors('look')) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        vectors('check');
        // successfull move
        if (move_state) {
            // mark position with color
            board[i][j] = color;
            // check possibility of move
            if (can_move(!black)) {
                // revert color
                black = !black;
            } else if (!can_move(black)) {
                end_game = true;
            }
        } else {
            console.log('invalid move');
        }
    }

    $.fn.reversi = function (color) {
        container = this;
        draw_board();
        $('td.empty').live('click', move);
    };
})(jQuery);
