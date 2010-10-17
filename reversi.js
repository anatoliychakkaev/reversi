(function ($) {
    var s = /\s+/, undef,
    matrix = { 1: [0, 1], 2: [0, -1], 3: [1, 0], 4: [-1, 0], 5: [1, -1], 6: [1, 1], 7: [-1, -1], 8: [-1, 1] };
    function Board(position, color) {
        // boolean color (false => white, true => black)
        // default black
        this.color = ( color == undef ) ? true : color;

        this.init_position(position);
    }

    Board.prototype.init_position = function (position) {
        var point,
            i, j, w = 0, b = 0;

        this.position = position;
        this.empty_cells = [];
        this.nonempty_cells = [];

        // empty/nonempty cells and board stats
        for (i = 0; i < 8; i++) {
            for (j = 0; j < 8; j++) {
                point = {i: i, j: j};
                if (this.empty(i, j)) {
                    this.empty_cells.push(point);
                } else {
                    this.nonempty_cells.push(point);
                    if (this.position[i][j] == 'b') {
                        b++;
                    } else if (this.position[i][j] == 'w') {
                        w++;
                    }
                }
            }
        }

        if (!this.can_move()) {
            this.color = !this.color;
            if (!this.can_move()) {
                // no. game is over
                this.terminal_board = true;
            } else {
                // yep. repeat same player
                this.same_color_again = true;
            }
        }

        this.board_stats = {b: b, w: w, moves: this.available_cells.length};
    };

    Board.prototype.empty = function (i, j) {
        var c = this.position[i][j];
        return c != 'w' && c != 'b';
    };

    $('empty_cell,nonempty_cell,available_cell'.split(',')).each(function(i, name) {
        Board.prototype['each_' + name] = function (callback) {
            var self = this
            $(self[name + 's']).each(function (i, p) {
                callback.apply(self, [p]);
            });
        };
    });

    Board.prototype.draw = function (container) {
        return {
            prev_position: this.parent ? this.parent.position : undef,
            position:   this.position,
            map: {
                w: 'white', b: 'black', 0: 'empty',
                W: this.color ? 'empty' : 'move_here white',
                B: !this.color ? 'empty' : 'move_here black',
            },
            right_info: this.board_stats.w + ':' + this.board_stats.b,
            left_info:  this.terminal_board ?
                'Победа ' + (this.board_stats.b > this.board_stats.w ? 'черных' : 'белых') :
                'Ход ' + (this.color ? 'Черных' : 'Белых')
        };
    };
    Board.prototype.move = function (coords) {
        if (this.available_cells.length == 0) {
            return false;
        } else if (coords !== undef) {
            var can_move = false;
            this.each_available_cell(function (p) {
                if (p.i + ":" + p.j == coords) {
                    can_move = true;
                }
            });
            if (!can_move) {
                return false;
            }
        }
        if (coords === undef) {
            coords = this.ai();
        }
        if (!this.child_boards) {
            this.calc_depth(1, coords);
        }
        return this.child_boards[coords];
    };
    Board.prototype.ai = function () {
        if (this.color) {
            var variants = [];
            this.calc_depth(1);
            this.each_available_cell(function (p) {
                var pp = p.i + ':' + p.j;
                variants.push({cost: this.child_boards[pp].cost, p: pp});
            });
            variants.sort(function (x, y) {
                return -y.cost + x.cost;
            });
            console.log(variants);
            return variants[0].p;
        } else {
            var i = Math.round((this.available_cells.length - 1) * Math.random());
        }
        return this.available_cells[i].i + ':' + this.available_cells[i].j;
    };
    Board.prototype.calc_depth = function (how_deep, point) {
        var self = this;
        if (!this.child_boards) {
            this.child_boards = {};
        }
        if (point) {
            var position = this.clone_position();
            if (vectors(this.color, position, point, 'check')) {
                board = new Board(position, !this.color);
                board.parent = this;
                this.child_boards[point] = board;
                if (how_deep > 1) {
                    board.calc_depth(how_deep - 1);
                }
            }
        } else {
            this.each_available_cell(function (point) {
                var position = this.clone_position(), board;
                if (vectors(this.color, position, point, 'check')) {
                    board = new Board(position, !this.color);
                    board.parent = this;
                    board.estimate();
                    self.child_boards[point.i + ':' + point.j] = board;
                }
            });
            if (how_deep > 1) {
                for (var c in this.child_boards) {
                    this.child_boards[c].calc_depth(how_deep - 1);
                }
            }
        }
    };
    Board.prototype.can_move = function () {
        this.available_cells = [];
        this.each_empty_cell(function (point) {
            this.position[point.i][point.j] = '0';
            if (vectors(this.color, this.position, point, 'look')) {
                this.available_cells.push(point);
            }
        });
        return this.available_cells.length;
    };
    Board.prototype.clone_position = function () {
        var b = [], row;
        for (var i = 0; i < 8; i++) {
            row = [];
            for (var j = 0; j < 8; j++) {
                row.push(this.position[i][j]);
            }
            b.push(row);
        }
        return b;
    };
    Board.prototype.pwned_by = function (c) {
        var color = this.color ? 'b' : 'w';
        return color == c || c == 'x';
    };
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
    var costs = [
        '15 2 4 4 4 4 2 15'.split(s),
        '2  1 3 3 3 3 1  2'.split(s),
        '4  2 3 2 2 3 2  4'.split(s),
        '4  3 2 1 1 2 3  4'.split(s),
        '4  3 2 1 1 2 3  4'.split(s),
        '4  2 3 2 2 3 2  4'.split(s),
        '2  1 3 3 3 3 1  2'.split(s),
        '15 2 4 4 4 4 2 15'.split(s)
    ];
    Board.prototype.estimate = function (color) {
        var cost = 0, m = 1, c, board = this.position, color = (this.color ? 'b' : 'w');
        this.each_nonempty_cell(function (point) {
            c = board[point.i][point.j];
            m = c == color ? 1 : -1;
            cost += parseInt(costs[point.i][point.j], 10) * m;
        });
        if (this.same_color_again) {
            cost += 40;
        }
        this.cost = cost;
    };
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

    function Game(ai, drawer, container) { // {{{
        var base_position = [
            '0 0 0 0 0 0 0 0'.split(s),
            '0 0 0 0 0 0 0 0'.split(s),
            '0 0 0 0 0 0 0 0'.split(s),
            '0 0 0 w b 0 0 0'.split(s),
            '0 0 0 b w 0 0 0'.split(s),
            '0 0 0 0 0 0 0 0'.split(s),
            '0 0 0 0 0 0 0 0'.split(s),
            '0 0 0 0 0 0 0 0'.split(s)
        ];
        this.external_drawer = drawer;
        this.container = container;

        this.start = function (ai) {
            this.boards = [];
            this.board = new Board(base_position);
            // board.calc_depth(2);
            this.draw();
            if (ai && (ai == 'b' || ai == 'x')) {
                this.move();
            }
        };

        this.move = function (coords) {
            var self = this;
            var board = this.board.move(coords);
            if (board) {
                this.boards.push(this.board);
                this.board = board;
                this.draw();
            } else {
                console.log('Invalid move');
            }
            if (ai && this.board.pwned_by(ai)) {
                setTimeout(function () {
                    self.move();
                }, 100);
            }
        };

        this.undo = function () {
            var player = this.board.pwned_by(),
            prev = this.board;
            this.board = this.boards.pop();
            while (prev && prev.pwned_by(player)) {
                this.boards.pop();
                prev = this.boards[boards.length];
            }
            this.draw();
        };

        this.draw = function () {
            this.external_drawer.apply(this.container, [this.board.draw()]);
        };

        this.start(ai);

        // }}}
    }

    $.fn.reversi = function (drawer) {
        return new Game('r', drawer, this);
    };
})(jQuery);
// vim:set foldmethod=marker
