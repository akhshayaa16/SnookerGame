/* =========================================================
   balls.js — ball creation + drawing
========================================================= */

var balls = [];    // reds + coloured (NOT cue)
var cueBall = null;

function makeBall(x, y, r, label, cr, cg, cb) {
    var body = Bodies.circle(x, y, r, getBallBodyOptions());
    body.label = label;

    World.add(world, body);

    balls.push({
        body: body,
        r: r,
        label: label,
        col: { r: cr, g: cg, b: cb }
    });
}

function makeCueBall(x, y) {
    var r = table.ballDiameter / 2;

    var body = Bodies.circle(x, y, r, getBallBodyOptions());
    body.label = "cue";

    World.add(world, body);

    cueBall = {
        body: body,
        r: r,
        label: "cue",
        col: { r: 255, g: 255, b: 255 }
    };
}

function clearCueBall() {
    if (cueBall && cueBall.body) {
        World.remove(world, cueBall.body);
    }
    cueBall = null;
}

function drawBalls() {
    noStroke();

    for (var i = 0; i < balls.length; i++) {
        var b = balls[i];
        var p = b.body.position;

        fill(b.col.r, b.col.g, b.col.b);
        ellipse(p.x, p.y, b.r * 2, b.r * 2);
    }

    if (cueBall) {
        var cp = cueBall.body.position;
        fill(255);
        ellipse(cp.x, cp.y, cueBall.r * 2, cueBall.r * 2);

        stroke(230);
        strokeWeight(1);
        noFill();
        ellipse(cp.x, cp.y, cueBall.r * 2, cueBall.r * 2);
        noStroke();
    }
}

function clearBalls() {
    for (var i = 0; i < balls.length; i++) {
        World.remove(world, balls[i].body);
    }
    balls = [];
}
