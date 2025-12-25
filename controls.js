var powerFlashFrames = 0;
var isCharging = false;
var chargePower = 0;

// HUD covers (20,20), so keep gameplay text below it
var HUD_SAFE_Y = 150;

// =========================
// CUE BALL PLACEMENT RULES
// =========================

function isInsideD(x, y) {
    if (x > table.baulkX) return false;

    var dx = x - table.baulkX;
    var dy = y - table.centerY;
    if (sqrt(dx * dx + dy * dy) > table.dRadius) return false;

    var r = table.ballDiameter / 2;
    if (x < table.left + r || x > table.right - r) return false;
    if (y < table.top + r || y > table.bottom - r) return false;

    return true;
}

function overlapsAnyBall(x, y, r) {
    for (var i = 0; i < balls.length; i++) {
        var p = balls[i].body.position;
        var dx = x - p.x;
        var dy = y - p.y;
        var minD = r + balls[i].r + 1;
        if (dx * dx + dy * dy < minD * minD) return true;
    }
    return false;
}

function areBallsStopped() {
    var eps = STOP_EPS;
    var eps2 = eps * eps;

    for (var i = 0; i < balls.length; i++) {
        var v = balls[i].body.velocity;
        if (v.x * v.x + v.y * v.y > eps2) return false;
    }

    if (cueBall) {
        var cv = cueBall.body.velocity;
        if (cv.x * cv.x + cv.y * cv.y > eps2) return false;
    }

    return true;
}

// =========================
// ANGLES
// =========================

function getShotAngle(cx, cy) {
    return atan2(mouseY - cy, mouseX - cx) + aimAngleOffset;
}

function getCueAngleFromShot(shotAngle) {
    return shotAngle + PI;
}

// =========================
// STRIKE
// =========================

function strikeCueBallWithAngle(shotAngle) {
    if (!cueBall) return;
    if (!areBallsStopped()) return;
    if (gameState === "cooldown") return;
    if (justPlacedFrames > 0) return;

    var cx = cueBall.body.position.x;
    var cy = cueBall.body.position.y;

    var p = isCharging ? chargePower : power;
    p = constrain(p, 0, 1);

    var tableLen = table.right - table.left;
    var minSpeed = tableLen * 0.006;
    var maxSpeed = tableLen * 0.030;
    var speed = lerp(minSpeed, maxSpeed, p);

    Body.setStatic(cueBall.body, false);

    // wake (correct API)
    if (Matter.Sleeping && typeof Matter.Sleeping.set === "function") {
        Matter.Sleeping.set(cueBall.body, false);
    } else {
        cueBall.body.isSleeping = false;
    }

    // clear rotation + velocity before strike
    Body.setAngularVelocity(cueBall.body, 0);
    Body.setVelocity(cueBall.body, { x: 0, y: 0 });

    // apply strike
    Body.setVelocity(cueBall.body, {
        x: cos(shotAngle) * speed,
        y: sin(shotAngle) * speed
    });

    // IMPORTANT: cue should disappear immediately after strike
    isCharging = false;
    chargePower = 0;

    cueAnimFrames = 8;

    // Existing (older) impactFlash (kept)
    impactFlash = {
        x: cx + cos(shotAngle) * cueBall.r,
        y: cy + sin(shotAngle) * cueBall.r,
        frame: 0
    };

    // ✅ 8b: Spawn visible impact ripple EXACTLY at contact point
    // (This is the part that makes cue impact clearly noticeable)
    if (typeof fxSpawnImpact === "function") {
        fxSpawnImpact(
            cx + cos(shotAngle) * cueBall.r,
            cy + sin(shotAngle) * cueBall.r
        );
    }

    powerFlashFrames = 10;

    // Enter rolling state (instead of aiming)
    cooldownFrames = STRIKE_COOLDOWN;
    gameState = "rolling";
}

function strikeCueBall() {
    if (!cueBall) return;
    var cx = cueBall.body.position.x;
    var cy = cueBall.body.position.y;
    var shotAngle = getShotAngle(cx, cy);
    strikeCueBallWithAngle(shotAngle);
}

// =========================
// STATE UPDATE
// =========================

function updateGameState() {
    if (placeHintFrames > 0) placeHintFrames--;
    if (justPlacedFrames > 0) justPlacedFrames--;
    if (powerFlashFrames > 0) powerFlashFrames--;

    if (impactFlash) {
        impactFlash.frame++;
        if (impactFlash.frame > 14) impactFlash = null;
    }

    if (cueAnimFrames > 0) cueAnimFrames--;

    // If we have a cue ball and we're not placing:
    if (cueBall && gameState !== "placing") {
        // If anything is still moving -> rolling (cue hidden)
        if (!areBallsStopped()) {
            gameState = "rolling";
            isCharging = false;
            chargePower = 0;
        } else {
            // Everything stopped -> aiming (cue visible)
            gameState = "aiming";
        }
    }

    // While charging, compute chargePower (ONLY when stopped & aiming)
    if (cueBall && isCharging && gameState === "aiming") {
        var cx = cueBall.body.position.x;
        var cy = cueBall.body.position.y;

        var maxPull = table.ballDiameter * 8.0;
        var d = dist(mouseX, mouseY, cx, cy);
        chargePower = constrain(d / maxPull, 0, 1);
    } else if (!isCharging) {
        chargePower = 0;
    }
}

// =========================
// DRAW UI
// =========================

function drawCueUI() {
    // Helper: draw a small, readable label near the table (never blocking play)
    function drawTableLabel(msg, yOffsetFromTop, w) {
        if (!table) return;

        var pad = 14;
        var x = table.left + pad;
        var y = table.top + yOffsetFromTop;

        // If it would be too high/overlap HUD zone, push it a bit lower
        if (y < 90) y = 90;

        var boxW = w || 320;
        var boxH = 28;

        noStroke();
        fill(0, 160);
        rect(x - 10, y - 6, boxW, boxH, 8);

        fill(255);
        textSize(14);
        textAlign(LEFT, TOP);
        text(msg, x, y);
    }

    // ✅ Idle + no cue ball: show instruction ABOVE the table (not on it)
    if (!cueBall && gameState !== "placing") {
        drawTableLabel("Press C to place the cue ball in the D", -34, 330);
        return;
    }

    // ---- placing cue ball ----
    if (gameState === "placing") {
        var r = table.ballDiameter / 2;
        var ok = isInsideD(mouseX, mouseY) && !overlapsAnyBall(mouseX, mouseY, r);

        noFill();
        strokeWeight(3);
        stroke(ok ? color(0, 255, 0) : color(255, 60, 60));
        ellipse(mouseX, mouseY, r * 2, r * 2);

        drawTableLabel("Place cue ball: click inside the D", -34, 320);

        if (placeHintFrames > 0) {
            drawTableLabel("Place inside D (no overlap)", -6, 260);
        }
        return;
    }

    if (cueBall && gameState === "rolling") {
        return;
    }

    // ---- aiming (balls stopped): draw cue + guideline ----
    if (cueBall && gameState === "aiming") {
        var cx = cueBall.body.position.x;
        var cy = cueBall.body.position.y;

        var shotAngle = getShotAngle(cx, cy);
        var cueAngle = getCueAngleFromShot(shotAngle);

        var p = isCharging ? chargePower : power;
        p = constrain(p, 0, 1);

        var cueLen = table.ballDiameter * 10;
        var tipGap = cueBall.r * 1.08;
        var pullBack = table.ballDiameter * 3.2 * p;

        // purely visual animation when striking
        var thrust = cueAnimFrames > 0 ? map(cueAnimFrames, 8, 1, table.ballDiameter * 0.6, 0) : 0;
        var maxThrust = max(0, pullBack - table.ballDiameter * 0.25);
        thrust = min(thrust, maxThrust);

        var tipX = cx + cos(cueAngle) * (tipGap + pullBack - thrust);
        var tipY = cy + sin(cueAngle) * (tipGap + pullBack - thrust);
        var buttX = cx + cos(cueAngle) * (tipGap + pullBack + cueLen - thrust);
        var buttY = cy + sin(cueAngle) * (tipGap + pullBack + cueLen - thrust);

        // cue
        strokeWeight(table.ballDiameter * 0.22);
        stroke(230, 210, 120);
        line(tipX, tipY, buttX, buttY);

        strokeWeight(table.ballDiameter * 0.28);
        stroke(120, 70, 30);
        var handleLen = cueLen * 0.25;
        line(buttX, buttY, buttX + cos(cueAngle) * handleLen, buttY + sin(cueAngle) * handleLen);

        // guideline
        stroke(255, 255, 255, 160);
        strokeWeight(2);
        line(cx, cy, cx + cos(shotAngle) * table.ballDiameter * 12, cy + sin(shotAngle) * table.ballDiameter * 12);

        // keep old impactFlash too (it’s fine)
        if (impactFlash) {
            noFill();
            stroke(255, 255, 255, 220);
            strokeWeight(3);
            var s = impactFlash.frame * 2.8;
            ellipse(impactFlash.x, impactFlash.y, s, s);
        }

        return;
    }
}

// =========================
// INPUT
// =========================

function keyPressed() {
    if (appScreen === "intro") {
        if (typeof introKeyPressed === "function") introKeyPressed(key, keyCode);
        return;
    }

    if (key === '1' || key === '2' || key === '3') {
        currentMode = parseInt(key, 10);

        // ✅ Make sure boundaries exist (prevents “balls escaping” if world got cleared)
        createTable();
        createCushions();
        createGuardWalls();

        clearBalls();

        if (currentMode === 1) createBallsMode1();
        else if (currentMode === 2) createBallsMode2();
        else if (currentMode === 3) createBallsMode3();

        if (cueBall && cueBall.body) World.remove(world, cueBall.body);
        cueBall = null;

        gameState = "idle";
        placeHintFrames = 0;
        aimAngleOffset = 0;
        cooldownFrames = 0;
        cueAnimFrames = 0;
        impactFlash = null;
        justPlacedFrames = 0;
        powerFlashFrames = 0;

        isCharging = false;
        chargePower = 0;
        return;
    }

    if (key === ' ') strikeCueBall();

    if (keyCode === UP_ARROW) power += 0.04;
    if (keyCode === DOWN_ARROW) power -= 0.04;
    power = constrain(power, 0.05, 1.0);

    if (key === 'C' || key === 'c') {
        // only allow placing when balls stopped
        if (cueBall && !areBallsStopped()) return;

        gameState = "placing";
        placeHintFrames = 10;

        isCharging = false;
        chargePower = 0;
    }
}

function mousePressed() {
    if (gameState === "placing") {
        var r = table.ballDiameter / 2;
        var ok = isInsideD(mouseX, mouseY) && !overlapsAnyBall(mouseX, mouseY, r);

        if (!ok) {
            placeHintFrames = 90;
            return;
        }

        makeCueBall(mouseX, mouseY);
        justPlacedFrames = 12;
        gameState = "aiming";
        return;
    }

    // only start charging if we're aiming AND all balls are stopped
    if (cueBall && gameState === "aiming" && areBallsStopped()) {
        isCharging = true;
        chargePower = 0;
    }
}

function mouseReleased() {
    if (cueBall && isCharging && gameState === "aiming") {
        strikeCueBall();
        isCharging = false;
        chargePower = 0;
    }
}
