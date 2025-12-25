// =========================================================
// physicsLogic.js — Matter.js physics helpers for Snooker
// NOTE: This file ONLY contains physics bodies + tuning.
// - Cushions: segmented, leaving pocket gaps
// - Guard walls: inner rails (inside felt), leaving ONLY 6 pocket mouths open
// =========================================================

var cushions = [];
var guardWalls = [];

var BALL_RESTITUTION = 0.97;
var BALL_FRICTION = 0.01;
var BALL_FRICTION_AIR = 0.0025;
var BALL_DENSITY = 0.0015;
var CUSHION_RESTITUTION = 0.90;

// ---------------------------------------------------------
// Ball + Cushion body options
// ---------------------------------------------------------
function getBallBodyOptions() {
    return {
        restitution: BALL_RESTITUTION,
        friction: BALL_FRICTION,
        frictionStatic: 0.0,
        frictionAir: BALL_FRICTION_AIR,
        density: BALL_DENSITY,
        slop: 0.01
    };
}

function getCushionBodyOptions() {
    return {
        isStatic: true,
        restitution: CUSHION_RESTITUTION,
        friction: 0.1,
        slop: 0.01
    };
}

// ---------------------------------------------------------
// Engine tuning
// ---------------------------------------------------------
function tuneEngineForSnooker() {
    // top-down: reduce jitter + allow bodies to sleep when stopped
    engine.enableSleeping = true;
    engine.positionIterations = 20;
    engine.velocityIterations = 20;
}

// ---------------------------------------------------------
// Cushions (segmented with gaps at pockets)
// ---------------------------------------------------------
function clearCushions() {
    for (var i = 0; i < cushions.length; i++) {
        World.remove(world, cushions[i]);
    }
    cushions = [];
}

// Build segmented cushions with pocket gaps (visual edge blockers)
// These sit just outside the felt edge and provide bounce.
function createCushions() {
    clearCushions();
    if (!table) return;

    var t = table.ballDiameter * 1.2;
    var opts = getCushionBodyOptions();
    var pR = table.pocketRadius;

    var L = table.left;
    var R = table.right;
    var T = table.top;
    var B = table.bottom;
    var midX = table.centerX;

    // Gap sizes: must be wide enough for balls to pass into pocket mouths
    var cornerGap = pR * 3.2; // total gap width at corners
    var midGap = pR * 2.8;    // total gap at middle pockets

    // Helper to build rectangle by corner coords
    function rectBody(x1, y1, x2, y2) {
        var w = x2 - x1;
        var h = y2 - y1;
        if (w <= 1 || h <= 1) return null;
        return Bodies.rectangle(x1 + w / 2, y1 + h / 2, w, h, opts);
    }

    // TOP cushions (2 segments)
    var topY1 = T - t;
    var topY2 = T;
    var topL = rectBody(L + cornerGap / 2, topY1, midX - midGap / 2, topY2);
    var topR = rectBody(midX + midGap / 2, topY1, R - cornerGap / 2, topY2);

    // BOTTOM cushions (2 segments)
    var botY1 = B;
    var botY2 = B + t;
    var botL = rectBody(L + cornerGap / 2, botY1, midX - midGap / 2, botY2);
    var botR = rectBody(midX + midGap / 2, botY1, R - cornerGap / 2, botY2);

    // LEFT cushion (1 segment, leaving corner gaps)
    var leftX1 = L - t;
    var leftX2 = L;
    var leftSeg = rectBody(leftX1, T + cornerGap / 2, leftX2, B - cornerGap / 2);

    // RIGHT cushion (1 segment)
    var rightX1 = R;
    var rightX2 = R + t;
    var rightSeg = rectBody(rightX1, T + cornerGap / 2, rightX2, B - cornerGap / 2);

    var parts = [topL, topR, botL, botR, leftSeg, rightSeg].filter(Boolean);

    cushions.push.apply(cushions, parts);
    World.add(world, cushions);
}

// ---------------------------------------------------------
// Speed limiting (prevents tunneling / insane velocities)
// ---------------------------------------------------------
function limitBallSpeeds() {
    if (!table) return;

    // Tune: larger value = higher max speed allowed
    var maxSpeed = (table.right - table.left) * 0.06;
    var maxSpeed2 = maxSpeed * maxSpeed;

    function cap(body) {
        if (!body) return;
        var v = body.velocity;
        var s2 = v.x * v.x + v.y * v.y;
        if (s2 > maxSpeed2) {
            var s = Math.sqrt(s2);
            var k = maxSpeed / s;
            Body.setVelocity(body, { x: v.x * k, y: v.y * k });
        }
    }

    for (var i = 0; i < balls.length; i++) cap(balls[i].body);
    if (cueBall) cap(cueBall.body);
}

// ---------------------------------------------------------
// Guard walls (inner rails inside felt)
// Goal:
// - Balls NEVER visibly roll outside the table
// - Only possible "exit" is through the 6 pocket mouths
// ---------------------------------------------------------
function clearGuardWalls() {
    for (var i = 0; i < guardWalls.length; i++) {
        World.remove(world, guardWalls[i]);
    }
    guardWalls = [];
}

/*
  Guard walls are "physics-only inner rails":
  - positioned INSIDE the felt edge (inset)
  - segmented to leave openings only at the 6 pockets
*/
function createGuardWalls() {
    clearGuardWalls();
    if (!table) return;

    var opts = {
        isStatic: true,
        restitution: 0.15,
        friction: 0.0,
        frictionStatic: 0.0,
        slop: 0.01
    };

    var t = table.ballDiameter * 2.6;      // rail thickness
    var inset = table.ballDiameter * 0.55; // move rails INSIDE felt so balls never show outside
    var pR = table.pocketRadius;

    // IMPORTANT: rails are inset from the felt bounds
    var L = table.left + inset;
    var R = table.right - inset;
    var T = table.top + inset;
    var B = table.bottom - inset;
    var midX = table.centerX;

    // Mouth widths: ONLY exits allowed (tune these with your pocket visuals)
    // Keep slightly narrower than cushion gaps, so balls don't slip out elsewhere.
    var cornerMouth = pR * 2.2;
    var midMouth = pR * 2.0;

    function rectBody(x1, y1, x2, y2) {
        var w = x2 - x1;
        var h = y2 - y1;
        if (w <= 1 || h <= 1) return null;
        return Bodies.rectangle(x1 + w / 2, y1 + h / 2, w, h, opts);
    }

    // TOP rail (2 segments: leave corner mouths + middle mouth)
    var topY1 = T - t;
    var topY2 = T;
    var topL = rectBody(L + cornerMouth, topY1, midX - midMouth / 2, topY2);
    var topR = rectBody(midX + midMouth / 2, topY1, R - cornerMouth, topY2);

    // BOTTOM rail
    var botY1 = B;
    var botY2 = B + t;
    var botL = rectBody(L + cornerMouth, botY1, midX - midMouth / 2, botY2);
    var botR = rectBody(midX + midMouth / 2, botY1, R - cornerMouth, botY2);

    // LEFT rail (1 segment: leave corner mouths)
    var leftX1 = L - t;
    var leftX2 = L;
    var leftSeg = rectBody(leftX1, T + cornerMouth, leftX2, B - cornerMouth);

    // RIGHT rail
    var rightX1 = R;
    var rightX2 = R + t;
    var rightSeg = rectBody(rightX1, T + cornerMouth, rightX2, B - cornerMouth);

    var parts = [topL, topR, botL, botR, leftSeg, rightSeg].filter(Boolean);

    guardWalls.push.apply(guardWalls, parts);
    World.add(world, guardWalls);
}
