var table;

function createTable() {
    var tableLength = CANVAS_W * 0.8;
    var tableWidth = tableLength / 2;
    var centerX = CANVAS_W / 2;
    var centerY = CANVAS_H / 2;

    var left = centerX - tableLength / 2;
    var top = centerY - tableWidth / 2;

    var ballDiameter = tableWidth / 36;

    table = {
        centerX: centerX,
        centerY: centerY,
        length: tableLength,
        width: tableWidth,

        left: left,
        right: left + tableLength,
        top: top,
        bottom: top + tableWidth,

        ballDiameter: ballDiameter,
        pocketRadius: (ballDiameter * 1.5) / 2,
        frameThickness: ballDiameter * 2,
        dRadius: tableWidth * 0.2,
        baulkX: left + tableLength * 0.2,

        // ✅ pocket centers stored here (so sketch.js can use same positions)
        pockets: [],

        // Standard Spots
        yellowSpot: { x: left + tableLength * 0.2, y: centerY + (tableWidth * 0.2) / 2 },
        greenSpot: { x: left + tableLength * 0.2, y: centerY - (tableWidth * 0.2) / 2 },
        brownSpot: { x: left + tableLength * 0.2, y: centerY },
        blueSpot: { x: centerX, y: centerY },
        pinkSpot: { x: (centerX + (left + tableLength - ballDiameter * 4)) / 2, y: centerY },
        blackSpot: { x: left + tableLength - ballDiameter * 2, y: centerY },

        draw: function () {
            this.drawFrame();
            this.drawCloth();
            this.drawLinesAndD();

            // ✅ draw cushion visuals first
            this.drawCushionVisuals();

            // ✅ then pockets on top (so they aren't covered)
            this.drawPockets();
        },

        drawFrame: function () {
            rectMode(CORNER);
            noStroke();
            fill(60, 30, 15);
            rect(
                this.left - this.frameThickness,
                this.top - this.frameThickness,
                this.length + this.frameThickness * 2,
                this.width + this.frameThickness * 2,
                15
            );
        },

        drawCloth: function () {
            rectMode(CORNER);
            noStroke();
            fill(35, 115, 45);
            rect(this.left, this.top, this.length, this.width, 6);
        },

        // Visual cushion “nose” segments with pocket gaps
        drawCushionVisuals: function () {
            var t = this.ballDiameter * 1.1;
            var pR = this.pocketRadius;

            var cornerGap = pR * 3.2;
            var midGap = pR * 2.8;

            var L = this.left;
            var R = this.right;
            var T = this.top;
            var B = this.bottom;
            var midX = this.centerX;

            rectMode(CORNER);
            noStroke();
            fill(45, 130, 55);

            // TOP
            var topLeftX = L + cornerGap / 2;
            var topLeftW = (midX - midGap / 2) - topLeftX;
            rect(topLeftX, T, topLeftW, t);

            var topRightX = midX + midGap / 2;
            var topRightW = (R - cornerGap / 2) - topRightX;
            rect(topRightX, T, topRightW, t);

            // BOTTOM
            var botLeftX = L + cornerGap / 2;
            var botLeftW = (midX - midGap / 2) - botLeftX;
            rect(botLeftX, B - t, botLeftW, t);

            var botRightX = midX + midGap / 2;
            var botRightW = (R - cornerGap / 2) - botRightX;
            rect(botRightX, B - t, botRightW, t);

            // LEFT
            var leftY = T + cornerGap / 2;
            var leftH = (B - cornerGap / 2) - leftY;
            rect(L, leftY, t, leftH);

            // RIGHT
            var rightY = T + cornerGap / 2;
            var rightH = (B - cornerGap / 2) - rightY;
            rect(R - t, rightY, t, rightH);
        },

        drawPockets: function () {
            noStroke();
            fill(10);

            var pR = this.pocketRadius;

            // ✅ This offset moves hole centers INTO the table mouth,
            // matching your cushion gaps much better than exact corners.
            var offset = pR * 0.55;

            // ✅ store pocket centers (so pocketing logic can use exact same list)
            this.pockets = [
                { x: this.left + offset, y: this.top + offset },     // TL
                { x: this.right - offset, y: this.top + offset },     // TR
                { x: this.left + offset, y: this.bottom - offset },  // BL
                { x: this.right - offset, y: this.bottom - offset },  // BR
                { x: this.centerX, y: this.top + offset },     // TM
                { x: this.centerX, y: this.bottom - offset }   // BM
            ];

            // draw them
            ellipse(this.pockets[0].x, this.pockets[0].y, pR * 2.2, pR * 2.2);
            ellipse(this.pockets[1].x, this.pockets[1].y, pR * 2.2, pR * 2.2);
            ellipse(this.pockets[2].x, this.pockets[2].y, pR * 2.2, pR * 2.2);
            ellipse(this.pockets[3].x, this.pockets[3].y, pR * 2.2, pR * 2.2);

            ellipse(this.pockets[4].x, this.pockets[4].y, pR * 2.0, pR * 2.0);
            ellipse(this.pockets[5].x, this.pockets[5].y, pR * 2.0, pR * 2.0);
        },

        drawLinesAndD: function () {
            stroke(255, 150);
            strokeWeight(2);

            line(this.baulkX, this.top, this.baulkX, this.bottom);

            noFill();
            arc(
                this.baulkX,
                this.centerY,
                this.dRadius * 2,
                this.dRadius * 2,
                HALF_PI,
                PI + HALF_PI
            );

            noStroke();
        }
    };
}

