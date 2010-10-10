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
    function empty(board, i, j) {
        return board[i][j] != 'w' && board[i][j] != 'b';
    }
    function draw_board() {
        var html = '<table class="reversi">', data = '';
        if (end_game) {
            html += '<tr><td colspan="8" class="info">Победа ' + (end_game == 'b' ? 'черных' : 'белых') + '</td></tr>';
        } else {
            html += '<tr><td colspan="8" class="info">Ход ' + (black ? 'Черных' : 'Белых') + '</td>';
        }
        for (var i = 0; i < 8; i++) {
            html += '<tr>';
            for (var j = 0; j < 8; j++) {
                data = ' data-coords="' + i + ':' + j + '"';
                if (empty(board, i, j)) {
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
    function try_vector(black, board, point, action, dir, delta, move_state) {
        var color = black ? 'b' : 'w',
            opcolor = black ? 'w' : 'b',
            t_i = point.i + delta * dir[0],
            t_j = point.j + delta * dir[1], new_delta = 0;
        if (typeof move_state == 'undefined') {
            move_state = false;
        }
        if (action == 'turn' && delta > 0) {
            board[t_i][t_j] = color;
            new_delta = delta - 1;
        } else if (action == 'check' || action == 'look') {
            if (0 <= t_i && t_i < 8 && 0 <= t_j && t_j < 8) {
                if (board[t_i][t_j] == opcolor) {
                    new_delta = delta + 1;
                } else if (board[t_i][t_j] == color && delta > 1) {
                    if (action == 'look') {
                        return true;
                    }
                    move_state = true;
                    action = 'turn';
                    new_delta = delta - 1;
                }
            }
        }
        if (new_delta == 0) {
            return move_state;
        } else {
            return try_vector(black, board, point, action, dir, new_delta, move_state)
        }
    }
    function vectors(black, board, point, action) {
        var move_state = false;
        for (var d in matrix) {
            if (matrix.hasOwnProperty(d)) {
                if (try_vector(black, board, point, action, matrix[d], 1)) {
                    move_state = true;
                }
            }
        }
        return move_state;
    }
    function can_move(black) {
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 8; j++) {
                if (empty(board, i, j)) {
                    if (vectors(black, board, {i: i, j: j}, 'look')) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    var matrix = { 1: [0, 1], 2: [0, -1], 3: [1, 0], 4: [-1, 0], 5: [1, -1], 6: [1, 1], 7: [-1, -1], 8: [-1, 1] };
    function clone_board(board) {
        var row, b = [];
        for (var i = 0; i < 8; i++) {
            row = [];
            for (var j = 0; j < 8; j++) {
                row.push(board[i][j]);
            }
            b.push(row);
        }
        return b;
    }
    function estimate(board, color) {
        var cost = 0, m = 1, c;
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                c = board[i][j];
                if (c != '0') {
                    m = c == color ? 1 : -1;
                    cost += parseInt(costs[i][j], 10) * m;
                }
            }
        }
        return cost;
    }
    function move(e) {
        var cell = this;
        var coords = $(cell).attr('data-coords').split(':');
        black = do_move(black, parseInt(coords[0], 10), parseInt(coords[1], 10));
        draw_board();
        ai_move(black);
    }
    function ai_move() {
        if (!black) {
            setTimeout(function () {
                black = do_move(black);
                draw_board();
                if (!black && !end_game) {
                    ai_move(black);
                }
            }, 500);
        }
    }
    function for_each_empty_cell(board, doit) {
        var i, j;
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 8; j++) {
                if (empty(board, i, j)) {
                    doit(board, i, j);
                }
            }
        }
    }
    function do_move(black, i, j) {
        // ai move
        if (typeof i == 'undefined') {
            var variants = [];
            for_each_empty_cell(board, function (board, i, j) {
                var b = clone_board(board);
                if (vectors(black, b, {i: i, j: j}, 'check')) {
                    b[i][j] = black ? 'b' : 'w';
                    variants.push({
                        i: i,
                        j: j,
                        b: b,
                        variants: [],
                        cost: 0
                    });
                }
            });
            if (variants.length == 0) {
                return false;
            }
            for (var x in variants) {
                if (variants.hasOwnProperty(x)) {
                    var v = variants[x];
                    for_each_empty_cell(v.b, function (board, i, j) {
                        var b = clone_board(board);
                        if (vectors(!black, b, {i: i, j: j}, 'check')) {
                            v.variants.push(estimate(b, black ? 'b' : 'w'));
                        }
                    });
                    v.variants.sort();
                    v.cost = v.variants.pop();
                }
            }
            variants.sort(function (x, y) {
                return y.cost - x.cost;
            });
            i = variants[0].i;
            j = variants[0].j;
        }

        // successfull move
        if (vectors(black, board, {i: i, j: j}, 'check')) {
            // mark position with color
            board[i][j] = black ? 'b' : 'w';
            // check possibility of move
            if (can_move(!black)) {
                // revert color
                black = !black;
            } else if (!can_move(black)) {
                end_game = estimate(board, 'b') > 0 ? 'b' : 'w';
            }
        } else {
            console.log('invalid move ' + (black ? 'b' : 'w')  + '' + i + '' + j);
        }
        return black;
    }

    $.fn.reversi = function (color) {
        container = this;
        draw_board();
        $('td.empty').live('click', move);
    };
})(jQuery);
