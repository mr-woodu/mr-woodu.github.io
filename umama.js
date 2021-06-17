const MAX_LEVEL = 29; // 30 exists experimentally
var CURRENT_LEVEL = 0;

const BRICK_MAGNET = 140;
const BRICK_NONE = 129;
const BRICK_FIXED = 249;
const BRICK_MOVE_LEFT = 17;
const BRICK_MOVE_RIGHT = 18;
const BRICK_BOMB_X_BLOCK = 15;
const BRICK_BOMB_P_BLOCK = 20;
const BRICK_BOMB_O_BLOCK = 13;
const BRICK_BOMB_X_DELETE = 14;
const BRICK_BOMB_P_DELETE = 19;
const BRICK_BOMB_O_DELETE = 12;
const BRICK_BOMB_X_CREATE = 25;
const BRICK_BOMB_P_CREATE = 26;
const BRICK_BOMB_O_CREATE = 27;
const BRICK_TELE_A = 78;
const BRICK_TELE_B = 77;
const BRICK_LABOR = 16;

// antigravity ... turn gravity of the whole level (until?)
// 16 labour bricks ... generates random new bricks (5 per the brick ... shows the count)
// 221, 234 surprise boxes ... turns into something else (ANY brick) .. can also be placed
// 40 shapeshifters ... fixed block that changes into something else?
//const BRICK_GIFT = 16; // surprise brick?

const MASK_DEFAULT = 2 ** 0; // standard bricks
const MASK_IMMOVABLE = 2 ** 1; // bricks that can't be moved
const MASK_RISING = 2 ** 2; // bricks that shall move to the top, rather than falling
const MASK_TO_RIGHT = 2 ** 3; // moves bricks to the right
const MASK_TO_LEFT = 2 ** 4; // moves bricks to the left
const MASK_TELE_SOURCE_A = 2 ** 5; // place where items disappear
const MASK_TELE_DEST_A = 2 ** 6; // place where items appear
const MASK_TELE_SOURCE_B = 2 ** 7; // place where items disappear
const MASK_TELE_DEST_B = 2 ** 8; // place where items appear
const MASK_LABOR = 2 ** 9; // place where items appear


var LEVEL_DATA = []; // current working level data
var LEVEL_MASK = []; // special efects of the items
var LEVEL_SCORE = _.times(30, () => 0);

function game() {

    var ACTION_ITEMS = []; // actions on fallen items


    var _IS = (idx, mask) => (LEVEL_MASK[idx] & mask) == mask;


    // find adjacent
    function test_brick(gridLength, col, row, _testFn, _testSet) {

        let markedItems = [];
        // (col,row)
        let TESTS = _testSet || [
            [-1, -1],
            [0, -1],
            [1, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
        ]

        _.each(TESTS, ([x, y]) => {
            if (((col + x) < 0) || ((col + x) >= gridLength)) return;
            if (((row + y) < 0) || ((row + y) >= gridLength)) return;
            let test = ((row + y) * gridLength) + ((col + x));

            if (test < 0) return;
            if (_IS(test, MASK_IMMOVABLE)) return;
            if (_testFn(LEVEL_DATA[test]))
                markedItems.push(test)
        })

        return markedItems;

    }

    // mark all items that are connected to similar item
    function find_joints(gridLength, levelSize) {


        let markedItems = [];
        for (var idx = 0; idx < levelSize; idx++) {
            let col = idx % gridLength,
                row = Math.floor(idx / gridLength);
            let brick = LEVEL_DATA[idx];

            if ((brick > 8) || (brick == 0)) continue;
            markedItems = _.concat(markedItems, test_brick(gridLength, col, row, (testBrick) => testBrick == brick))
        }

        markedItems = _.uniq(markedItems)
        console.log("Items to delete fount:", markedItems)

        return markedItems;

    }

    function is_action_item(idx) {
        return (_.includes([
            BRICK_BOMB_P_DELETE, BRICK_BOMB_X_DELETE, BRICK_BOMB_O_DELETE,
            BRICK_BOMB_P_CREATE, BRICK_BOMB_X_CREATE, BRICK_BOMB_O_CREATE,
            BRICK_BOMB_P_BLOCK, BRICK_BOMB_X_BLOCK, BRICK_BOMB_O_BLOCK,
        ], LEVEL_DATA[idx]));
    }

    // item action such as BOMBS ...
    function items_action(gridLength, levelSize) {

        let actionHappened = false;

        _.each(ACTION_ITEMS, (ai) => {
            console.log("ACTION EVENT", ai)
            let actionItem = LEVEL_DATA[ai];

            let testSet = [];
            switch (actionItem) {
                case BRICK_BOMB_O_BLOCK:
                case BRICK_BOMB_O_CREATE:
                case BRICK_BOMB_O_DELETE:
                    testSet = [
                        [-1, -1],
                        [0, -1],
                        [1, -1],
                        [-1, 0],
                        [0, 0],
                        [1, 0],
                        [-1, 1],
                        [0, 1],
                        [1, 1],
                    ];
                    break;
                case BRICK_BOMB_P_BLOCK:
                case BRICK_BOMB_P_CREATE:
                case BRICK_BOMB_P_DELETE:
                    testSet = [
                        [0, -1],
                        [-1, 0],
                        [0, 0],
                        [1, 0],
                        [0, 1]
                    ];
                    break;
                case BRICK_BOMB_X_BLOCK:
                case BRICK_BOMB_X_CREATE:
                case BRICK_BOMB_X_DELETE:
                    testSet = [
                        [-1, -1],
                        [1, -1],
                        [0, 0],
                        [-1, 1],
                        [1, 1],
                    ];
                    break;
                default:
                    return;
            }


            let col = ai % gridLength,
                row = Math.floor(ai / gridLength);
            let itemsToChange = test_brick(gridLength, col, row, () => true, testSet)
            _.each(itemsToChange, (idx) => {

                let newBrick = 0;
                switch (actionItem) {
                    case BRICK_BOMB_O_BLOCK:
                    case BRICK_BOMB_P_BLOCK:
                    case BRICK_BOMB_X_BLOCK:
                        newBrick = BRICK_FIXED;
                        LEVEL_MASK[idx] = MASK_IMMOVABLE;
                        break;
                    case BRICK_BOMB_O_DELETE:
                    case BRICK_BOMB_P_DELETE:
                    case BRICK_BOMB_X_DELETE:
                        newBrick = 0;
                        break;
                    case BRICK_BOMB_O_CREATE:
                    case BRICK_BOMB_P_CREATE:
                    case BRICK_BOMB_X_CREATE:
                        newBrick = 1 + (Math.floor(Math.random() * 8));
                        break;
                }

                LEVEL_DATA[idx] = newBrick;
                actionHappened = true;
                $(`#itm${idx}`)
                    .removeClass('empty')
                    .removeClass((i, c) => (c.match(/brick-\S+/g) || []).join(' '))
                    .addClass(get_brick_class(LEVEL_DATA[idx]));
            })


        })

        ACTION_ITEMS = [];
        return actionHappened;

    }


    // remove items that are linked to each other
    function items_remove_linked(gridLength, levelSize) {

        let actionHappened = items_action(gridLength, levelSize);
        let joinedItems = find_joints(gridLength, levelSize);

        let actionComplete = !actionHappened && _.isEmpty(joinedItems);

        if (actionComplete) {

            // TODO: update with item masks
            let remainingBricks = _.filter(LEVEL_DATA, (i) => i > 0 && i < 9).length;
            console.log('Remaining bricks', remainingBricks)
            if (remainingBricks == 0) {
                let score = _.sumBy($(".grid-items .divRec").map((i, el) => $(el).data('count')).get());
                $(".modal-body p").html('Your Score is ' + score);
                LEVEL_SCORE[CURRENT_LEVEL] = score;
                $('.modal').modal('toggle');
            }

        }

        _.each(joinedItems, (i) => {
            $('#itm' + i).addClass('removing').removeClass(_.filter($('#itm' + i)[0].classList, (i) => i.startsWith('brick-')).join(' '));
            LEVEL_DATA[i] = 0;
        });

        setTimeout((e) => {
            $('.removing').removeClass('removing');
            items_fall(gridLength, levelSize, actionComplete);
        }, 200);

        return !_.isEmpty(joinedItems);
    }


    // move items with empty space under one leel down
    function items_fall(gridLength, levelSize, actionComplete) {

        let hasSliders = _.find(LEVEL_MASK, (e) => ((e & MASK_TO_LEFT) == MASK_TO_LEFT) || ((e & MASK_TO_RIGHT) == MASK_TO_RIGHT));
        let markedItems = [];


        // standard falling items
        // column by column
        for (var col = 0; col < gridLength; col++) {

            let hasRisingItems = false;
            // falling items
            for (var row = gridLength - 1; row > 0; row--) {
                let idx = (row * gridLength) + col;

                if (_.includes(markedItems, idx)) continue;

                let brick = LEVEL_DATA[idx];
                let isFalling = !_IS(idx, MASK_IMMOVABLE) && !_IS(idx, MASK_RISING);
                if (!_IS(idx, MASK_IMMOVABLE) && _IS(idx, MASK_RISING)) hasRisingItems = true;

                if (isFalling && (brick == 0)) {
                    let idxAbove = ((row - 1) * gridLength) + col;
                    let brickAbove = LEVEL_DATA[idxAbove];
                    // there is birck that can fall down
                    if (!_IS(idxAbove, MASK_IMMOVABLE) && (brickAbove != 0)) {
                        console.log('FALL', idxAbove, '=>', idx);
                        $('#itm' + idxAbove).addClass('falling empty');
                        LEVEL_DATA[idx] = brickAbove;
                        LEVEL_DATA[idxAbove] = 0;
                        markedItems.push(idx);
                        if (is_action_item(idx)) ACTION_ITEMS.push(idx);
                    }
                }


                // teleports
                if ((brick != 0) && (_IS(idx, MASK_TELE_SOURCE_A) || _IS(idx, MASK_TELE_SOURCE_B))) {
                    let destType = _IS(idx, MASK_TELE_SOURCE_A) ? MASK_TELE_DEST_A : MASK_TELE_DEST_B;
                    let dest = _.findIndex(LEVEL_MASK, (i) => ((i & destType) == destType));
                    if (dest && (LEVEL_DATA[dest] == 0)) {
                        console.log('TELEPORT FN', idx, '=>', dest);
                        $('#itm' + idx).addClass('falling empty');
                        LEVEL_DATA[dest] = brick;
                        LEVEL_DATA[idx] = 0;
                        markedItems.push(dest);
                    }
                }

                if (_.includes(markedItems, idx)) continue;
                // labor items
                if ((brick == 0) && _IS(idx, MASK_LABOR)) {
                    let idxAbove = ((row - 1) * gridLength) + col;
                    let cnt = $('#itm' + idxAbove).data('count');
                    if (cnt > 0) {
                        let newBrick = 1 + (Math.floor(Math.random() * 8));
                        $('#itm' + idxAbove).data('count', cnt - 1).html(cnt - 1)
                        LEVEL_DATA[idx] = newBrick;
                        markedItems.push(idx);

                    }
                }

            }

            if (!hasRisingItems) continue; // ignore next cycle if there are no rising items

            // rising items - magnetic or antigravity
            for (var row = 0; row < gridLength - 1; row++) {
                let idx = (row * gridLength) + col;
                let brick = LEVEL_DATA[idx];
                let isRising = _IS(idx, MASK_RISING);

                if (isRising && (brick == 0)) {
                    let idxUnder = ((row + 1) * gridLength) + col;
                    let brickUnder = LEVEL_DATA[idxUnder];
                    // there is birck that can fall down
                    if (!_IS(idxUnder, MASK_IMMOVABLE) && (brickUnder != 0)) {
                        console.log('RISE', idxUnder, '=>', idx);
                        $('#itm' + idxUnder).addClass('rising empty');
                        LEVEL_DATA[idx] = brickUnder;
                        LEVEL_DATA[idxUnder] = 0;
                        markedItems.push(idx);
                        if (is_action_item(idx)) ACTION_ITEMS.push(idx);
                    }
                }
            }

        }

        // sliders left or right
        if (hasSliders) {
            for (var row = gridLength - 2; row >= 0; row--) {

                for (var col = 0; col < gridLength; col++) {
                    let idx = (row * gridLength) + col;
                    if (_.includes(markedItems, idx)) continue;
                    if (LEVEL_DATA[idx] == 0) continue;

                    if ((col > 0) && _IS(idx, MASK_TO_LEFT)) {

                        let idxLeft = (row * gridLength) + (col - 1);
                        let brickLeft = LEVEL_DATA[idxLeft];
                        if (!_IS(idxLeft, MASK_IMMOVABLE) && (brickLeft == 0)) {
                            console.log('LEFT', idx, '=>', idxLeft);
                            $('#itm' + idx).addClass('sliding-l empty');
                            LEVEL_DATA[idxLeft] = LEVEL_DATA[idx];
                            LEVEL_DATA[idx] = 0;
                            markedItems.push(idxLeft);
                        }


                    } else if ((col < gridLength - 1) && _IS(idx, MASK_TO_RIGHT)) {

                        let idxRight = (row * gridLength) + (col + 1);
                        let brickRight = LEVEL_DATA[idxRight];
                        if (!_IS(idxRight, MASK_IMMOVABLE) && (brickRight == 0)) {
                            console.log('RIGHT', idx, '=>', idxRight);
                            $('#itm' + idx).addClass('sliding-r empty');
                            LEVEL_DATA[idxRight] = LEVEL_DATA[idx];
                            LEVEL_DATA[idx] = 0;
                            markedItems.push(idxRight);
                        }

                    }
                }
            }
        }

        let hasMarkedItems = !_.isEmpty(markedItems);
        setTimeout((e) => {
            if (hasMarkedItems) {

                console.log(markedItems, "AI:", ACTION_ITEMS)
                $('.falling, .rising, .sliding-r, .sliding-l')
                    .removeClass('falling rising sliding-r sliding-l')
                    .removeClass((i, c) => (c.match(/brick-\S+/g) || []).join(' '));
                _.each(markedItems, (idx) => {
                    let brick = LEVEL_DATA[idx];
                    console.log('Adding brick', brick, ' to', idx)
                    $(`#itm${idx}`).addClass(get_brick_class(LEVEL_DATA[idx]));

                });

                items_fall(gridLength, levelSize);
            } else if (!actionComplete)
                items_remove_linked(gridLength, levelSize);

        }, 100);


    }

    function get_brick_class(brick) {
        if (brick == 0) return 'empty';

        if (brick < 9)
            return 'empty brick-' + brick;
        switch (brick) {
            case BRICK_MOVE_LEFT:
                return 'brick-left';
            case BRICK_MOVE_RIGHT:
                return 'brick-right';

            case BRICK_BOMB_O_BLOCK:
                return 'brick-bomb-O-block';
            case BRICK_BOMB_X_BLOCK:
                return 'brick-bomb-X-block';
            case BRICK_BOMB_P_BLOCK:
                return 'brick-bomb-P-block';

            case BRICK_BOMB_O_DELETE:
                return 'brick-bomb-O-delete';
            case BRICK_BOMB_X_DELETE:
                return 'brick-bomb-X-delete';
            case BRICK_BOMB_P_DELETE:
                return 'brick-bomb-P-delete';

            case BRICK_BOMB_P_CREATE:
                return 'brick-bomb-P-create';
            case BRICK_BOMB_X_CREATE:
                return 'brick-bomb-X-create';
            case BRICK_BOMB_O_CREATE:
                return 'brick-bomb-O-create';


            case BRICK_TELE_A:
                return 'brick-tele';
            case BRICK_TELE_B:
                return 'brick-tele';

            case BRICK_MAGNET:
                return 'brick-magnet';
            case BRICK_LABOR:
                return 'brick-labor';


            case BRICK_NONE:
                return 'brick-none';
            case BRICK_FIXED:
                return 'brick-fixed';
            default:
                return 'brick-other brick-' + brick;
        }


    }

    function draw_level(levelSize) {
        for (var idx = 0; idx < levelSize; idx++) {
            $(`#itm${idx}`).addClass(get_brick_class(LEVEL_DATA[idx]));
            if (LEVEL_DATA[idx] == BRICK_LABOR)
                $(`#itm${idx}`).html('5').data('count', 5);
        }

        // draw border around 'none-items'
        let gridLength = Math.sqrt(levelSize);
        for (var col = 0; col < gridLength; col++) {
            for (var row = gridLength - 1; row >= 0; row--) {
                let idx = (row * gridLength) + col;
                if (LEVEL_DATA[idx] == BRICK_NONE) {
                    if ((row > 0) && (LEVEL_DATA[((row - 1) * gridLength) + col] != BRICK_NONE))
                        $('#itm' + idx).css({ 'border-top': '3px solid #faebd7' })

                    if ((row < gridLength - 1) && (LEVEL_DATA[((row + 1) * gridLength) + col] != BRICK_NONE))
                        $('#itm' + idx).css({ 'border-bottom': '3px solid #faebd7' })

                    if ((col > 0) && (LEVEL_DATA[((row) * gridLength) + (col - 1)] != BRICK_NONE))
                        $('#itm' + idx).css({ 'border-left': '3px solid #faebd7' })

                    if ((col < gridLength - 1) && (LEVEL_DATA[((row) * gridLength) + (col + 1)] != BRICK_NONE))
                        $('#itm' + idx).css({ 'border-right': '3px solid #faebd7' })


                }
            }
        }
    }

    function start_game(levelNo) {


        let levelSize = UMAMA_DATA[levelNo].type;
        let levelType = Math.floor(Math.random() * 4);
        console.log(levelNo, levelSize, levelType, UMAMA_DATA[levelNo].pass, UMAMA_DATA[levelNo].name)

        $("h1").html(`Level ${levelNo + 1} <small>(${UMAMA_DATA[levelNo].name})</small> | Score: <span class='score'>${_.sumBy(LEVEL_SCORE)}</span>`)

        $(".grid-items").html('');
        for (var idx = 1; idx < 9; idx++) {

            let count = UMAMA_DATA[levelNo].itemsCount[levelType * 8 + (idx - 1)];
            $(`<div id='src-${idx}' data-brick='${idx}' data-count='${count}' draggable='true' class='divRec empty brick-${idx}''><div class='inside'>${count}</div></div>`)
                .appendTo($(".grid-items"))
        }

        $(".grid-game").html('');
        $(".grid-game").removeClass('grid25 grid100')
        $(".grid-game").addClass('grid' + levelSize)

        // mark bricks that are immovable and bricks that can fly upside down
        let gridLength = Math.sqrt(levelSize);
        LEVEL_DATA = UMAMA_DATA[levelNo].level.slice(levelType * 100, levelType * 100 + levelSize);

        // color the level
        for (i = 0; i < 2; i++)
            for (var idx = 0; idx < levelSize; idx++) {
                let col = idx % gridLength,
                    row = Math.floor(idx / gridLength);
                let brick = LEVEL_DATA[idx];

                if (brick == BRICK_NONE) {

                    if (LEVEL_DATA[(row * gridLength) + (gridLength - col - 1)] == 0)
                        LEVEL_DATA[(row * gridLength) + (gridLength - col - 1)] = BRICK_NONE; // mirror horizontal

                    if (LEVEL_DATA[((gridLength - row - 1) * gridLength) + col] == 0)
                        LEVEL_DATA[((gridLength - row - 1) * gridLength) + col] = BRICK_NONE; // mirror vertical

                    if (LEVEL_DATA[((gridLength - row - 1) * gridLength) + (gridLength - col - 1)] == 0)
                        LEVEL_DATA[((gridLength - row - 1) * gridLength) + (gridLength - col - 1)] = BRICK_NONE; // mirror all
                }
            }

        LEVEL_MASK = _.map(LEVEL_DATA, (brick) => {
            if (_.includes([BRICK_MOVE_LEFT, BRICK_MOVE_RIGHT, BRICK_NONE, BRICK_TELE_A, BRICK_TELE_B, BRICK_LABOR], brick)) return MASK_IMMOVABLE;
            if (brick < 49) return MASK_DEFAULT;
            return MASK_IMMOVABLE;
        })

        // find bricks that fly rather than fall
        // also mark items that are affected by sliders
        // mark teleports and labor bricks
        for (var col = 0; col < gridLength; col++) {
            var isFlying = false;
            for (var row = 0; row < gridLength; row++) {
                let idx = (row * gridLength) + col;
                if (LEVEL_DATA[idx] == BRICK_MAGNET) isFlying = true;
                else if (LEVEL_MASK[idx] == MASK_IMMOVABLE) isFlying = false;
                else if (isFlying) LEVEL_MASK[idx] = MASK_RISING;

                if (row < (gridLength - 1)) {
                    let idxUnder = ((row + 1) * gridLength) + col
                    if (LEVEL_DATA[idxUnder] == BRICK_MOVE_LEFT)
                        LEVEL_MASK[idx] |= MASK_TO_LEFT;
                    else if (LEVEL_DATA[idxUnder] == BRICK_MOVE_RIGHT)
                        LEVEL_MASK[idx] |= MASK_TO_RIGHT;
                    else if (LEVEL_DATA[idxUnder] == BRICK_TELE_A)
                        LEVEL_MASK[idx] |= MASK_TELE_SOURCE_A;
                    else if (LEVEL_DATA[idxUnder] == BRICK_TELE_B)
                        LEVEL_MASK[idx] |= MASK_TELE_SOURCE_B;
                }

                if (row > 0) {
                    let idxAbove = ((row - 1) * gridLength) + col
                    if (LEVEL_DATA[idxAbove] == BRICK_TELE_A)
                        LEVEL_MASK[idx] |= MASK_TELE_DEST_B;
                    else if (LEVEL_DATA[idxAbove] == BRICK_TELE_B)
                        LEVEL_MASK[idx] |= MASK_TELE_DEST_A;
                    else if (LEVEL_DATA[idxAbove] == BRICK_LABOR)
                        LEVEL_MASK[idx] |= MASK_LABOR;

                }

            }
        }


        for (var idx = 0; idx < levelSize; idx++)
            $(`<div id='itm${idx}' data-idx='${idx}' data-mask='${LEVEL_MASK[idx]}' class='divRec'></div>`).appendTo($(".grid-game"))

        draw_level(levelSize);
        items_fall(gridLength, levelSize);


        enable_drag(function(item, src) {
            console.log("Item Dropped", item);

            let idx = $(item).data('idx');
            let brick = $(src).data('brick');
            let count = $(src).data('count');

            if (count > 1) {
                $(src).data('count', --count);
                $(".inside", src).html(count);
            } else $(src).remove();

            LEVEL_DATA[idx] = brick;
            console.log(`Item ${idx} updated with brick ${brick}`);

            $(item).removeClass(_.filter(item.classList, (i) => i.startsWith('brick-')).join(' '));
            $(item).addClass(`brick-${brick}`);


            items_fall(gridLength, levelSize)


        });


    }

    // every level has 4 different options (itemsCount*8, level * 100)
    // every level is 10x10?


    function next_level(e) {
        if (e) e.preventDefault();
        if (CURRENT_LEVEL < MAX_LEVEL) CURRENT_LEVEL++;
        else CURRENT_LEVEL = 0;
        start_game(CURRENT_LEVEL);
        $('.modal').modal('hide');
    }

    function prev_level(e) {
        if (e) e.preventDefault();
        if (CURRENT_LEVEL > 0) CURRENT_LEVEL--;
        else CURRENT_LEVEL = MAX_LEVEL;
        start_game(CURRENT_LEVEL);
    }


    $(".l_prev").on('click', prev_level)
    $(".l_next").on('click', next_level)
    $(".l_level").on('click', (e) => {
        if (e) e.preventDefault();
        start_game(CURRENT_LEVEL);
    })

    start_game(CURRENT_LEVEL);




    /* drag and drop section */

    function enable_drag(onUpdate) {
        var dragEl, nextEl, newPos, dragGhost, prevTarget;

        function _onDragOver(e) {
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'move';

            var target = e.originalEvent.target;
            if (target && target !== dragEl && target.nodeName == 'DIV') {
                if (!target.classList.contains('empty')) {
                    e.originalEvent.stopPropagation();
                    prevTarget = false;
                    $('.filled').removeClass('filled');
                } else {
                    //getBoundinClientRect contains location-info about the element (relative to the viewport)
                    var targetPos = target.getBoundingClientRect();
                    //checking that dragEl is dragged over half the target y-axis or x-axis. (therefor the .5)
                    var next = true; //(e.clientY - targetPos.top) / (targetPos.bottom - targetPos.top) > .5 || (e.clientX - targetPos.left) / (targetPos.right - targetPos.left) > .95;

                    //section.insertBefore(dragEl,  target);

                    if (prevTarget != target) {
                        prevTarget = target;
                        $('.filled').removeClass('filled');
                        $(target).addClass('filled');
                    }

                }
            } else {
                prevTarget = false;
                $('.filled').removeClass('filled');
            }
        }

        function _onDragEnd(evt) {
            evt.preventDefault();
            $('.filled').removeClass('filled');
            dragEl.classList.remove('ghost');
            $('.grid-game').unbind('dragover');
            $('.grid-game, .grid-items').unbind('dragend');

            if (prevTarget) onUpdate(prevTarget, dragEl)
        }

        function _onDragStart(e) {

            prevTarget = false;
            dragEl = e.target;
            console.log("Item Dragged", dragEl.id);

            e.originalEvent.dataTransfer.effectAllowed = 'move';
            e.originalEvent.dataTransfer.setData('Text', dragEl.textContent);

            $('.grid-game').bind('dragover', _onDragOver);
            $('.grid-game, .grid-items').bind('dragend', _onDragEnd);

            setTimeout(function() {
                dragEl.classList.add('ghost');
            }, 0)

        }

        $('.grid-game').unbind('dragover');
        $('.grid-game, .grid-items').unbind('dragend');
        $('.grid-items').unbind('dragstart');
        $('.grid-items').bind('dragstart', _onDragStart);
    }


    /* The setData() method is used to add an item to the drag data, as shown in the following example.
 
        function dragstart_handler(ev) {
          // Add the drag data
          ev.dataTransfer.setData("text/plain", ev.target.id);
          ev.dataTransfer.setData("text/html", "<p>Example paragraph</p>");
          ev.dataTransfer.setData("text/uri-list", "http://developer.mozilla.org"); */


    /* you may succeed this a hacky solution. The native draggability doesn't allow CSS styles like: opacity:0;, visibility:hidden or display:none.
    But you can do it using: transform:translateX(-9999px).
    I've updated your JSFiddle with the solution. */


}