(function ($) {
    var s = /\s+/,
    base_position = [
        '0 0 0 0 0 0 0 0'.split(s),
        '0 0 0 0 0 0 0 0'.split(s),
        '0 0 0 0 0 0 0 0'.split(s),
        '0 0 0 w b 0 0 0'.split(s),
        '0 0 0 b w 0 0 0'.split(s),
        '0 0 0 0 0 0 0 0'.split(s),
        '0 0 0 0 0 0 0 0'.split(s),
        '0 0 0 0 0 0 0 0'.split(s)
    ],
    costs = [
        '15 2 4 4 4 4 2 15'.split(s),
        '2  1 3 3 3 3 1  2'.split(s),
        '4  2 3 2 2 3 2  4'.split(s),
        '4  3 2 1 1 2 3  4'.split(s),
        '4  3 2 1 1 2 3  4'.split(s),
        '4  2 3 2 2 3 2  4'.split(s),
        '2  1 3 3 3 3 1  2'.split(s),
        '15 2 4 4 4 4 2 15'.split(s)
    ],
    matrix = { 1: [0, 1], 2: [0, -1], 3: [1, 0], 4: [-1, 0], 5: [1, -1], 6: [1, 1], 7: [-1, -1], 8: [-1, 1] };
    function Board(position, color) {
        // store matrix of cells
        this.position = position;
        // boolean color (false => white, true => black)
        // default black
        this.color = typeof color == 'undefined' ? true : color;

        // we can move?
        if (!this.can_move()) {
            // no. flip color
            this.color = !this.color;
            // can move now?
            if (!this.can_move()) {
                // no. game is over
                this.terminal_board = true;
            } else {
                // yep. repeat same player
                this.same_color_again = true;
            }
        }
    }

    function empty(board, i, j) {
        return board[i][j] != 'w' && board[i][j] != 'b';
    }

    Board.prototype.calc_board_stats = function () {
        var i, j, w = 0, b = 0;
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 8; j++) {
                if (this.position[i][j] == 'b') {
                    b++;
                } else if (this.position[i][j] == 'w') {
                    w++;
                }
            }
        }
        return {w: w, b: b};
    }
    Board.prototype.draw = function (container) {
        var black = this.color,
            end_game = this.terminal_board,
            map = {
                w: 'white',
                b: 'black',
                W: black ? 'empty' : 'move_here white',
                B: !black ? 'empty' : 'move_here black',
                0: 'empty'
            }, html = '<table class="reversi">',
            board_stats = this.calc_board_stats(),
            info = '<span style="float:right;">' + board_stats.w + ':' + board_stats.b + '</span>';
        if (end_game) {
            html += '<tr><td colspan="8" class="info">Победа ' + (board_stats.b > board_stats.w == 'b' ? 'черных' : 'белых') + info + '</td></tr>';
        } else {
            html += '<tr><td colspan="8" class="info">Ход ' + (black ? 'Черных' : 'Белых') + info + '</td>';
        }
        for (var i = 0; i < 8; i++) {
            html += '<tr>';
            for (var j = 0; j < 8; j++) {
                html += '<td class="' + map[this.position[i][j]] + '" data-coords="' + i + ':' + j + '">&nbsp;</td>';
            }
            html += '</tr>';
        }
        html += '</table>';
        container.html(html);
    }
    Board.prototype.move = function (el) {
        var coords = $(el).attr('data-coords');
        if (!this.child_boards) {
            this.calc_depth(1, coords);
        }
        return this.child_boards[coords];
    };
    Board.prototype.calc_depth = function (how_deep, point) {
        var self = this;
        if (!this.child_boards) {
            this.child_boards = {};
        }
        if (point) {
            var position = clone_board(this.position);
            if (vectors(this.color, position, point, 'check')) {
                this.child_boards[point] = new Board(position, !this.color);
                if (how_deep > 1) {
                    this.child_boards[point].calc_depth(how_deep - 1);
                }
            }
        } else {
            for_each_empty_cell(this.position, function (p, i, j) {
                var position = clone_board(self.position);
                if (vectors(this.color, position, {i: i, j: j}, 'check')) {
                    self.child_boards[i + ':' + j] = new Board(position, !this.color);
                }
            });
            if (how_deep > 1) {
                for (var c in this.child_boards) {
                    this.child_boards[c].calc_depth(how_deep - 1);
                }
            }
        }
    };
    function try_vector(black, board, point, action, dir, delta, move_state) {
        var color = black ? 'b' : 'w',
            opcolor = black ? 'w' : 'b',
            t_i = point.i + delta * dir[0],
            t_j = point.j + delta * dir[1], new_delta = 0;
        if (typeof move_state == 'undefined') {
            move_state = false;
        }
        if (action == 'turn' && delta >= 0) {
            board[t_i][t_j] = color;
            new_delta = delta - 1;
            if (new_delta == 0) {
                board[point.i][point.j] = color;
                return true;
            }
        } else if (action == 'check' || action == 'look') {
            if (0 <= t_i && t_i < 8 && 0 <= t_j && t_j < 8) {
                if (board[t_i][t_j] == opcolor) {
                    new_delta = delta + 1;
                } else if (board[t_i][t_j] == color && delta > 1) {
                    if (action == 'look') {
                        board[point.i][point.j] = color.toUpperCase();
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
        if (typeof point == 'string') {
            point = point.split(':');
            point = {i: parseInt(point[0], 10), j: parseInt(point[1], 10)};
        }
        for (var d in matrix) {
            if (matrix.hasOwnProperty(d)) {
                if (try_vector(black, board, point, action, matrix[d], 1)) {
                    move_state = true;
                }
            }
        }
        return move_state;
    }
    Board.prototype.can_move = function () {
        var self = this, result = true;
        for_each_empty_cell(this.position, function (board, i, j) {
            board[i][j] = '0';
            if (vectors(self.color, self.position, {i: i, j: j}, 'look')) {
                result = true;
            }
        });
        return result;
    };
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
            }, 1500);
        }
    }
    function for_each_empty_cell(board, doit) {
        var i, j;
        if (typeof board == 'undefined') {
            console.log(arguments.callee.caller.caller);
            throw 'Board is undefined'
        }
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

    function Game(container, ai) {
        var boards = [], board;

        this.start = function (ai) {
            board = new Board(base_position);
            // board.calc_depth(2);
            board.draw(container);
            if (ai && ai == 'b') {
                board = this.move();
            }
        };

        this.move = function ($el) {
            boards.push(board);
            board = board.move($el);
            board.draw(container);
            if (ai && board.pwned_by(ai)) {
                setTimeout(function () {
                    this.move();
                }, 1500);
            }
        };

        this.undo = function () {
            var player = board.pwned_by(),
                prev = board,
                board = boards.pop();
            while (prev && prev.pwned_by(player)) {
                boards.pop();
                prev = boards[boards.length];
            }
            board.draw(container);
        }

        this.start();

    }

    $.fn.reversi = function (color) {
        game = new Game(this);
        $('td.move_here').live('click', function () {
            game.move(this);
        });
    };
})(jQuery);
