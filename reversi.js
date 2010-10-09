(function ($) {
    var black = true;
    var board = [
        '00000000'.split(''),
        '00000000'.split(''),
        '00000000'.split(''),
        '000wb000'.split(''),
        '000bw000'.split(''),
        '00000000'.split(''),
        '00000000'.split(''),
        '00000000'.split('')
    ];
    function draw_board() {
        var html = '<table class="reversi">', data = '';
        html += '<tr><td colspan="8" class="info">Ход ' + (black ? 'Черных' : 'Белых') + '</td>';
        for (var i = 0; i < 8; i++) {
            html += '<tr>';
            for (var j = 0; j < 8; j++) {
                data = ' data-coords="' + i + ':' + j + '"';
                if (board[i][j] == '0') {
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
        return html;
    }
    var matrix = {
        1: [0, 1],
        2: [0, -1],
        3: [1, 0],
        4: [-1, 0],
        5: [1, -1],
        6: [1, 1],
        7: [-1, -1],
        8: [-1, 1]
    };
    function move(e) {
        var cell = this;
        var coords = $(cell).attr('data-coords').split(':');
        do_move(coords[0], coords[1]);
        $(cell).parents('table').parent().html(draw_board());
    }
    function do_move(i, j) {
        var vector_state = '', move_state = false, vector;
        var color = black ? 'b' : 'w';
        var opcolor = black ? 'w' : 'b';
        function try_vector(dir, delta) {
            var t_i = parseInt(i, 10) + delta * dir[0],
                t_j = parseInt(j, 10) + delta * dir[1];
            if (vector_state == 'turn' && delta > 0) {
                board[t_i][t_j] = color;
                try_vector(dir, delta - 1);
            } else if (vector_state == 'check') {
                if (0 <= t_i < 8 && 0 <= t_j < 8) {
                    if (board[t_i][t_j] == opcolor) {
                        try_vector(dir, delta + 1);
                    } else if (board[t_i][t_j] == color && delta > 1) {
                        vector_state = 'turn';
                        move_state = true;
                        try_vector(dir, delta - 1);
                    }
                }
            }
        }
        for (var d in matrix) {
            if (matrix.hasOwnProperty(d)) {
                vector_state = 'check';
                try_vector(matrix[d], 1);
            }
        }
        if (move_state) {
            board[i][j] = color;
            black = !black;
        } else {
            alert('invalid move');
        }
    }

    $.fn.reversi = function (color) {
        this.html(draw_board());
        $('td.empty').live('click', move);
    };
})(jQuery);
