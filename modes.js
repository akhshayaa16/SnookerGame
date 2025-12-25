/* =========================================================
   modes.js — ball layouts (Mode 1/2/3)

   Depends on globals/functions:
   - table
   - balls[] (from balls.js)
   - clearBalls(), makeBall(), makeCueBall()
   - p5: random(), dist(), radians(), cos(), sin(), constrain()
========================================================= */

// ------------------------------------
// Add normal coloured balls explicitly (NO dependency on addColourBalls)
// ------------------------------------
function _addStandardColourBalls() {
    var r = table.ballDiameter / 2;

    makeBall(table.yellowSpot.x, table.yellowSpot.y, r, "yellow", 255, 255, 0);
    makeBall(table.greenSpot.x, table.greenSpot.y, r, "green", 0, 150, 0);
    makeBall(table.brownSpot.x, table.brownSpot.y, r, "brown", 150, 75, 0);
    makeBall(table.blueSpot.x, table.blueSpot.y, r, "blue", 0, 100, 255);
    makeBall(table.pinkSpot.x, table.pinkSpot.y, r, "pink", 255, 100, 200);
    makeBall(table.blackSpot.x, table.blackSpot.y, r, "black", 0, 0, 0);
}

// ------------------------------------
// random point helper
// ------------------------------------
function _safeRandomPointInPlayArea(pad) {
    var x = random(table.left + pad, table.right - pad);
    var y = random(table.top + pad, table.bottom - pad);
    return { x: x, y: y };
}

// checks against existing balls[] only
function _canPlaceAt(x, y, r) {
    // inside table
    if (x < table.left + r) return false;
    if (x > table.right - r) return false;
    if (y < table.top + r) return false;
    if (y > table.bottom - r) return false;

    // avoid overlaps with any existing ball body
    for (var i = 0; i < balls.length; i++) {
        var p = balls[i].body.position;
        var minD = r + balls[i].r + 1;
        if (dist(x, y, p.x, p.y) < minD) return false;
    }
    return true;
}

// =========================================================
// MODE 1 — standard triangle (15 reds) + normal colours
// =========================================================
function _placeRedsTriangle() {
    var r = table.ballDiameter / 2;

    // TRUE close-pack triangle
    var D = table.ballDiameter;
    var dy = D;                 // vertical spacing: touching
    var dx = D * 0.87;          // horizontal offset: ~sqrt(3)/2 * D

    // apex just to the right of pink
    var apexX = table.pinkSpot.x + D * 0.95;
    var apexY = table.centerY;

    for (var row = 0; row < 5; row++) {
        var ballsInRow = row + 1;
        var x = apexX + row * dx;
        var startY = apexY - (row * dy) / 2;

        for (var i = 0; i < ballsInRow; i++) {
            var y = startY + i * dy;
            makeBall(x, y, r, "red", 200, 30, 30);
        }
    }
}


function createBallsMode1() {
    clearBalls();
    _addStandardColourBalls();
    _placeRedsTriangle();
}

// =========================================================
// MODE 2 — random clusters (REDS ONLY) EXACTLY 15 + normal colours
// Uses nested loops + random()
// =========================================================
function _placeRedClustersRandom() {
    var r = table.ballDiameter / 2;
    var spacing = table.ballDiameter * 1.12;

    var TOTAL_REDS = 15;
    var redsPlaced = 0;

    // pick 3 cluster centres (right half)
    var centers = [];
    var tries = 0;

    while (centers.length < 3 && tries < 300) {
        tries++;
        var c = _safeRandomPointInPlayArea(table.ballDiameter * 3.2);

        // keep away from left/D half
        if (c.x < table.centerX + table.length * 0.02) continue;

        // keep centres separated
        var ok = true;
        for (var k = 0; k < centers.length; k++) {
            if (dist(c.x, c.y, centers[k].x, centers[k].y) < table.ballDiameter * 7.0) {
                ok = false;
                break;
            }
        }
        if (ok) centers.push(c);
    }

    // 15 = 5 + 5 + 5
    var perCluster = [5, 5, 5];

    // nested loops:
    // outer: cluster
    // inner: rings and points
    for (var ci = 0; ci < centers.length; ci++) {
        var cx = centers[ci].x;
        var cy = centers[ci].y;
        var target = perCluster[ci];

        // centre ball
        if (redsPlaced < TOTAL_REDS && target > 0 && _canPlaceAt(cx, cy, r)) {
            makeBall(cx, cy, r, "red", 200, 30, 30);
            redsPlaced++;
            target--;
        }

        // rings
        var ring = 1;
        while (target > 0 && ring <= 4) {
            var pointsOnRing = 6 + (ring - 1) * 2; // 6,8,10,12
            for (var j = 0; j < pointsOnRing && target > 0; j++) {
                if (redsPlaced >= TOTAL_REDS) break;

                var a = radians((360 / pointsOnRing) * j) + radians(random(-15, 15));
                var rr = spacing * ring + random(-spacing * 0.12, spacing * 0.18);

                var x = cx + cos(a) * rr;
                var y = cy + sin(a) * rr;

                x = constrain(x, table.left + r * 2, table.right - r * 2);
                y = constrain(y, table.top + r * 2, table.bottom - r * 2);

                if (_canPlaceAt(x, y, r)) {
                    makeBall(x, y, r, "red", 200, 30, 30);
                    redsPlaced++;
                    target--;
                }
            }
            ring++;
        }
    }

    // safety top-up to exactly 15 if needed
    var safety = 0;
    while (redsPlaced < TOTAL_REDS && safety < 800) {
        safety++;
        var p = _safeRandomPointInPlayArea(table.ballDiameter * 2.2);
        if (p.x < table.centerX) continue;

        if (_canPlaceAt(p.x, p.y, r)) {
            makeBall(p.x, p.y, r, "red", 200, 30, 30);
            redsPlaced++;
        }
    }
}

function createBallsMode2() {
    clearBalls();
    _addStandardColourBalls();
    _placeRedClustersRandom();
}

// =========================================================
// MODE 3 — practice (T shape) + colours + cue
// IMPORTANT: avoid extra normal pink/black.
// So we place ONLY yellow/green/brown/blue at normal spots,
// then drill pink+black for the T.
// =========================================================
function createBallsMode3() {
    clearBalls();

    var r = table.ballDiameter / 2;

    // normal colour spots (only these 4 in Mode 3 reference)
    makeBall(table.yellowSpot.x, table.yellowSpot.y, r, "yellow", 255, 255, 0);
    makeBall(table.greenSpot.x, table.greenSpot.y, r, "green", 0, 150, 0);
    makeBall(table.brownSpot.x, table.brownSpot.y, r, "brown", 150, 75, 0);
    makeBall(table.blueSpot.x, table.blueSpot.y, r, "blue", 0, 100, 255);

    // cue ball in D
    var cueX = table.baulkX - table.dRadius * 0.4;
    var cueY = table.centerY;
    makeCueBall(cueX, cueY);

    // T-shape origin (intersection)
    var originX = table.centerX + table.length * 0.22;
    var originY = table.centerY + table.ballDiameter * 0.5;
    var S = table.ballDiameter * 1.8;

    // vertical reds (8 reds, skip centre)
    for (var i = -4; i <= 4; i++) {
        if (i !== 0) {
            makeBall(originX, originY + i * S, r, "red", 200, 30, 30);
        }
    }

    // horizontal reds (7 reds)
    var redsRight = 7;
    for (var j = 1; j <= redsRight; j++) {
        makeBall(originX + j * S, originY, r, "red", 200, 30, 30);
    }

    // pink at intersection (drill pink)
    makeBall(originX, originY, r, "pink", 255, 100, 200);

    // black one spacing after last red (drill black)
    var lastRedX = originX + redsRight * S;
    makeBall(lastRedX + S, originY, r, "black", 0, 0, 0);
}
