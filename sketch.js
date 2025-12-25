// ===== SCREEN ROUTING =====
var appScreen = "intro"; // "intro" | "game"
var selectedMode = 1;

// matter.js setup
var Engine;
var World;
var Bodies;
var Body;
var engine;
var world;

// keep track of which mode we are in
var currentMode = 1;

// responsive canvas targets (max)
var CANVAS_MAX_W = 1200;
var CANVAS_MAX_H = 700;
var CANVAS_W = 1200;
var CANVAS_H = 700;

// ===== interaction/shot tuning =====
var gameState = "idle"; // "idle" | "placing" | "aiming" | "rolling"
var placeHintFrames = 0;

var aimAngleOffset = 0;
var power = 0.55;
var cooldownFrames = 0;

var STOP_EPS = 0.45;
var FORCE_SCALE = 0.0012;
var STRIKE_COOLDOWN = 18;

var cueAnimFrames = 0;
var impactFlash = null;
var justPlacedFrames = 0;

var canvas;

// =========================================================
// SETUP
// =========================================================
function setup() {
    CANVAS_W = Math.min(CANVAS_MAX_W, windowWidth);
    CANVAS_H = Math.min(CANVAS_MAX_H, windowHeight);
    canvas = createCanvas(CANVAS_W, CANVAS_H);
    canvas.id("gameCanvas");

    applyRoyalPageBackground();

    Engine = Matter.Engine;
    World = Matter.World;
    Bodies = Matter.Bodies;
    Body = Matter.Body;

    engine = Engine.create();
    world = engine.world;
    engine.world.gravity.x = 0;
    engine.world.gravity.y = 0;

    tuneEngineForSnooker();

    createTable();
    createCushions();
    createGuardWalls();
    clearBalls();

    if (typeof introInit === "function") introInit();
    if (typeof gameHudInit === "function") gameHudInit();
    if (typeof gameHudShow === "function") gameHudShow(false);

    currentMode = 1;
    selectedMode = 1;
    appScreen = "intro";
}

// =========================================================
// DRAW
// =========================================================
function draw() {
    if (appScreen === "intro") {
        if (typeof introDraw === "function") introDraw();
        else {
            background(0);
            fill(255);
            textAlign(CENTER, CENTER);
            text("Intro missing", width / 2, height / 2);
        }
        return;
    }

    // Background
    drawRoyalBackdrop();

    // Physics
    var dt = 1000 / 60;
    Engine.update(engine, dt / 2);
    Engine.update(engine, dt / 2);

    if (typeof limitBallSpeeds === "function") limitBallSpeeds();

    // Pocket detection
    checkPocketing();

    // ===== FX UPDATE =====
    if (typeof fxUpdateAll === "function") fxUpdateAll();

    // ===== RENDER =====
    table.draw();

    // Trails behind balls (8a)
    if (typeof fxDrawTrails === "function") fxDrawTrails();

    drawBalls();

    // Cue / UI
    updateGameState();
    drawCueUI();

    // ===== FX DRAW (IMPORTANT) =====
    if (typeof fxDrawImpacts === "function") fxDrawImpacts(); // 8b
    if (typeof fxDrawPots === "function") fxDrawPots();       // 8c

    // HUD
    if (typeof gameHudUpdate === "function") {
        var hudPower = (typeof isCharging !== "undefined" && isCharging) ? chargePower : power;
        gameHudUpdate(currentMode, gameState, hudPower);
    }
}

// =========================================================
// POCKETING (WITH FX)
// =========================================================
function checkPocketing() {
    var pockets = table.pockets;
    var holeKillR = table.pocketRadius * 1.1;
    var mouthKillR = table.pocketRadius * 3.2;

    function nearPocket(x, y, r) {
        for (var i = 0; i < pockets.length; i++) {
            if (dist(x, y, pockets[i].x, pockets[i].y) < r) {
                return pockets[i];
            }
        }
        return null;
    }

    // Object balls
    for (var i = balls.length - 1; i >= 0; i--) {
        var b = balls[i];
        var p = nearPocket(b.body.position.x, b.body.position.y, mouthKillR);
        if (p) {
            // ✅ 8c: pocket entry animation
            if (typeof fxSpawnPocket === "function") {
                fxSpawnPocket(p.x, p.y);
            }

            World.remove(world, b.body);
            balls.splice(i, 1);
        }
    }

    // Cue ball
    if (cueBall) {
        var pc = nearPocket(cueBall.body.position.x, cueBall.body.position.y, mouthKillR);
        if (pc) {
            if (typeof fxSpawnPocket === "function") {
                fxSpawnPocket(pc.x, pc.y);
            }

            World.remove(world, cueBall.body);
            cueBall = null;
            gameState = "idle";
        }
    }
}

// =========================================================
// MODE START
// =========================================================
function startGameWithMode(mode) {
    selectedMode = mode;
    currentMode = mode;

    createTable();
    createCushions();
    createGuardWalls();
    clearBalls();

    if (mode === 1) createBallsMode1();
    else if (mode === 2) createBallsMode2();
    else if (mode === 3) createBallsMode3();

    cueBall = null;
    gameState = "idle";
    placeHintFrames = 0;
    aimAngleOffset = 0;
    cooldownFrames = 0;
    cueAnimFrames = 0;
    impactFlash = null;
    justPlacedFrames = 0;
    power = 0.55;

    appScreen = "game";
    if (typeof gameHudShow === "function") gameHudShow(true);
}

window.startGameWithMode = startGameWithMode;

// =========================================================
// PAGE THEME
// =========================================================
function applyRoyalPageBackground() {
    document.body.style.background =
        "radial-gradient(1200px 600px at 55% 35%, rgba(224,184,90,.18), transparent 60%)," +
        "radial-gradient(900px 500px at 45% 70%, rgba(12,90,55,.22), transparent 62%)," +
        "linear-gradient(135deg, #070606, #0f0b0a)";
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
}

// =========================================================
// CANVAS BACKDROP
// =========================================================
function drawRoyalBackdrop() {
    background(8, 7, 7);
    var ctx = drawingContext;

    var g1 = ctx.createRadialGradient(
        width * 0.5, height * 0.42, 40,
        width * 0.5, height * 0.42, Math.max(width, height) * 0.9
    );
    g1.addColorStop(0.0, "rgba(201,162,79,0.10)");
    g1.addColorStop(0.35, "rgba(14,59,46,0.22)");
    g1.addColorStop(1.0, "rgba(0,0,0,0.92)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);

    var g3 = ctx.createRadialGradient(
        width * 0.5, height * 0.5, Math.min(width, height) * 0.2,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.75
    );
    g3.addColorStop(0, "rgba(0,0,0,0)");
    g3.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, width, height);
}

