// /* =========================================================
//    fx.js — Visual FX for Fine Billiards
//    Implements:
//    A) Ball trails (fading motion streak)
//    B) Cue impact ripple (local flash at impact)
//    C) Pocket entry animation (ring pulse at pocket)
// ========================================================= */

// var FX = {
//     // ballId -> [{x,y,a}]
//     trails: new Map(),
//     maxTrailPoints: 14,
//     trailMinSpeed: 0.35,      // only record trail if moving
//     trailDropPerFrame: 16,    // alpha fade per frame

//     impacts: [],  // {x,y,frame,life}
//     pots: []      // {x,y,frame,life}
// };

// // ---------- helpers ----------
// function fxGetIdForBall(ballObj) {
//     // stable id: if not present, assign once
//     if (!ballObj._fxId) ballObj._fxId = "b" + Math.random().toString(16).slice(2);
//     return ballObj._fxId;
// }

// // ---------- A) Ball Trail ----------
// function fxUpdateTrails() {
//     if (!window.balls) return;

//     // update object balls trails
//     for (var i = 0; i < balls.length; i++) {
//         fxUpdateTrailForBall(balls[i]);
//     }

//     // update cue ball trail too (if exists)
//     if (window.cueBall) fxUpdateTrailForBall(cueBall);

//     // fade / trim all trails
//     FX.trails.forEach(function (arr, key) {
//         for (var j = 0; j < arr.length; j++) {
//             arr[j].a = Math.max(0, arr[j].a - FX.trailDropPerFrame);
//         }
//         // remove dead points
//         while (arr.length && arr[0].a <= 0) arr.shift();
//         if (!arr.length) FX.trails.delete(key);
//     });
// }

// function fxUpdateTrailForBall(ballObj) {
//     if (!ballObj || !ballObj.body) return;

//     var v = ballObj.body.velocity;
//     var speed = Math.sqrt(v.x * v.x + v.y * v.y);

//     // only leave trail if moving
//     if (speed < FX.trailMinSpeed) return;

//     var id = fxGetIdForBall(ballObj);
//     var arr = FX.trails.get(id);
//     if (!arr) { arr = []; FX.trails.set(id, arr); }

//     arr.push({
//         x: ballObj.body.position.x,
//         y: ballObj.body.position.y,
//         a: 200 // start alpha
//     });

//     // cap points
//     while (arr.length > FX.maxTrailPoints) arr.shift();
// }

// function fxDrawTrails() {
//     // draw behind balls: call BEFORE drawBalls()
//     FX.trails.forEach(function (arr) {
//         if (arr.length < 2) return;

//         noFill();
//         strokeWeight(3);

//         for (var i = 1; i < arr.length; i++) {
//             var p0 = arr[i - 1];
//             var p1 = arr[i];

//             var a = Math.min(p0.a, p1.a);
//             stroke(255, a * 0.45); // subtle white streak
//             line(p0.x, p0.y, p1.x, p1.y);
//         }
//     });
// }

// // ---------- B) Cue Impact ----------
// function fxSpawnImpact(x, y) {
//     FX.impacts.push({ x: x, y: y, frame: 0, life: 14 });
// }

// function fxUpdateImpacts() {
//     for (var i = FX.impacts.length - 1; i >= 0; i--) {
//         FX.impacts[i].frame++;
//         if (FX.impacts[i].frame > FX.impacts[i].life) FX.impacts.splice(i, 1);
//     }
// }

// function fxDrawImpacts() {
//     for (var i = 0; i < FX.impacts.length; i++) {
//         var e = FX.impacts[i];
//         var t = e.frame / e.life;

//         // pulse rings
//         noFill();
//         strokeWeight(3);

//         var r1 = lerp(6, 34, t);
//         var r2 = lerp(10, 54, t);

//         stroke(255, 220 * (1 - t));
//         ellipse(e.x, e.y, r1, r1);

//         stroke(201, 162, 79, 180 * (1 - t)); // gold
//         ellipse(e.x, e.y, r2, r2);

//         // tiny flash
//         noStroke();
//         fill(255, 160 * (1 - t));
//         ellipse(e.x, e.y, 10 + 10 * (1 - t), 10 + 10 * (1 - t));
//     }
// }

// // ---------- C) Pocket Entry ----------
// function fxSpawnPocket(x, y) {
//     FX.pots.push({ x: x, y: y, frame: 0, life: 18 });
// }

// function fxUpdatePots() {
//     for (var i = FX.pots.length - 1; i >= 0; i--) {
//         FX.pots[i].frame++;
//         if (FX.pots[i].frame > FX.pots[i].life) FX.pots.splice(i, 1);
//     }
// }

// function fxDrawPots() {
//     for (var i = 0; i < FX.pots.length; i++) {
//         var e = FX.pots[i];
//         var t = e.frame / e.life;

//         // shrink + fade “entry”
//         var base = (table && table.pocketRadius) ? table.pocketRadius : 16;
//         var r = lerp(base * 1.2, base * 0.45, t);

//         noFill();
//         strokeWeight(4);
//         stroke(0, 190 * (1 - t));
//         ellipse(e.x, e.y, r * 2, r * 2);

//         // gold rim shimmer
//         strokeWeight(2);
//         stroke(201, 162, 79, 160 * (1 - t));
//         ellipse(e.x, e.y, r * 2.4, r * 2.4);
//     }
// }

// // ---------- one-call update/draw ----------
// function fxUpdateAll() {
//     fxUpdateTrails();
//     fxUpdateImpacts();
//     fxUpdatePots();
// }

// function fxDrawAll() {
//     fxDrawTrails();
//     fxDrawImpacts();
//     fxDrawPots();
// }






/* =========================================================
   fx.js — Visual FX for Fine Billiards
   Implements:
   A) Ball trails (fading motion streak)
   B) Cue impact ripple (local flash at impact)
   C) Pocket entry animation (ring pulse at pocket)
========================================================= */

var FX = {
    trails: new Map(),
    maxTrailPoints: 14,
    trailMinSpeed: 0.35,
    trailDropPerFrame: 16,

    impacts: [], // {x,y,frame,life}
    pots: []     // {x,y,frame,life}
};

function fxGetIdForBall(ballObj) {
    if (!ballObj._fxId) ballObj._fxId = "b" + Math.random().toString(16).slice(2);
    return ballObj._fxId;
}

// ---------- A) Ball Trail ----------
function fxUpdateTrails() {
    if (!window.balls) return;

    for (var i = 0; i < balls.length; i++) fxUpdateTrailForBall(balls[i]);
    if (window.cueBall) fxUpdateTrailForBall(cueBall);

    FX.trails.forEach(function (arr, key) {
        for (var j = 0; j < arr.length; j++) {
            arr[j].a = Math.max(0, arr[j].a - FX.trailDropPerFrame);
        }
        while (arr.length && arr[0].a <= 0) arr.shift();
        if (!arr.length) FX.trails.delete(key);
    });
}

function fxUpdateTrailForBall(ballObj) {
    if (!ballObj || !ballObj.body) return;

    var v = ballObj.body.velocity;
    var speed = Math.sqrt(v.x * v.x + v.y * v.y);
    if (speed < FX.trailMinSpeed) return;

    var id = fxGetIdForBall(ballObj);
    var arr = FX.trails.get(id);
    if (!arr) { arr = []; FX.trails.set(id, arr); }

    arr.push({ x: ballObj.body.position.x, y: ballObj.body.position.y, a: 200 });
    while (arr.length > FX.maxTrailPoints) arr.shift();
}

function fxDrawTrails() {
    FX.trails.forEach(function (arr) {
        if (arr.length < 2) return;

        noFill();
        strokeWeight(3);

        for (var i = 1; i < arr.length; i++) {
            var p0 = arr[i - 1];
            var p1 = arr[i];
            var a = Math.min(p0.a, p1.a);
            stroke(255, a * 0.45);
            line(p0.x, p0.y, p1.x, p1.y);
        }
    });
}

// ---------- B) Cue Impact (make it obvious) ----------
function fxSpawnImpact(x, y) {
    FX.impacts.push({ x: x, y: y, frame: 0, life: 18 }); // longer life
}

function fxUpdateImpacts() {
    for (var i = FX.impacts.length - 1; i >= 0; i--) {
        FX.impacts[i].frame++;
        if (FX.impacts[i].frame > FX.impacts[i].life) FX.impacts.splice(i, 1);
    }
}

function fxDrawImpacts() {
    var d = (window.table && table.ballDiameter) ? table.ballDiameter : 18;

    for (var i = 0; i < FX.impacts.length; i++) {
        var e = FX.impacts[i];
        var t = e.frame / e.life;

        // scale rings with ball diameter so it matches table size
        var r1 = lerp(d * 0.35, d * 2.2, t);
        var r2 = lerp(d * 0.55, d * 3.1, t);

        // outer glow ring
        noFill();
        strokeWeight(3);
        stroke(255, 230 * (1 - t));
        ellipse(e.x, e.y, r2 * 2, r2 * 2);

        // inner gold ring
        strokeWeight(2);
        stroke(201, 162, 79, 200 * (1 - t));
        ellipse(e.x, e.y, r1 * 2, r1 * 2);

        // hot core flash (very short but bright)
        var coreA = (t < 0.35) ? 255 * (1 - (t / 0.35)) : 0;
        noStroke();
        fill(255, coreA);
        ellipse(e.x, e.y, d * 0.9, d * 0.9);
    }
}

// ---------- C) Pocket Entry ----------
function fxSpawnPocket(x, y) {
    FX.pots.push({ x: x, y: y, frame: 0, life: 22 });
}

function fxUpdatePots() {
    for (var i = FX.pots.length - 1; i >= 0; i--) {
        FX.pots[i].frame++;
        if (FX.pots[i].frame > FX.pots[i].life) FX.pots.splice(i, 1);
    }
}

function fxDrawPots() {
    var base = (window.table && table.pocketRadius) ? table.pocketRadius : 16;

    for (var i = 0; i < FX.pots.length; i++) {
        var e = FX.pots[i];
        var t = e.frame / e.life;

        // "entry" shrink
        var r = lerp(base * 1.35, base * 0.40, t);

        // dark ring
        noFill();
        strokeWeight(5);
        stroke(0, 210 * (1 - t));
        ellipse(e.x, e.y, r * 2, r * 2);

        // gold shimmer ring
        strokeWeight(2);
        stroke(201, 162, 79, 180 * (1 - t));
        ellipse(e.x, e.y, r * 2.55, r * 2.55);

        // subtle inward fill pulse
        noStroke();
        fill(0, 70 * (1 - t));
        ellipse(e.x, e.y, r * 1.6, r * 1.6);
    }
}

// ---------- one-call update/draw ----------
function fxUpdateAll() {
    fxUpdateTrails();
    fxUpdateImpacts();
    fxUpdatePots();
}

function fxDrawAll() {
    fxDrawTrails();
    fxDrawImpacts();
    fxDrawPots();
}
