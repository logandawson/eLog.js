/*!
 * eLog.js
 * Version: 1.0.0-a
 * Author: Logan Dawson
 * Description: Generate electronic logs for drivers using the <canvas> element.
 * Link: https://github.com/logandawson/eLog.js
 * License: GNU General Public License v3.0
 */

function getCanvas(item) {
    if (typeof item === 'string') {
        item = document.getElementById(item);
    } else if (item && item.length) {
        item = item[0];
    }
    if (item && item.canvas) {
        item = item.canvas;
    }
    return item;
}

function setConfig(config) {
    config = config || {};
    config.data = config.data || [];

    const options = config.options || (config.options = {});

    const startStatus = options.startStatus;
    if (isNaN(startStatus) || startStatus < 1 || startStatus > 4)
        options.startStatus = 1;

    options.startOffDutyHours = parseFloat(options.startOffDutyHours) || 0;
    options.startDrivingHours = parseFloat(options.startDrivingHours) || 0;
    options.startDutyHours = parseFloat(options.startDutyHours) || 0;

    options.startDate = options.startDate || '';

    return config;
}

function setUpCanvas(canvas) {
    const style = canvas.style;
    const w = style.width || canvas.clientWidth;
    const h = style.height || Math.ceil(w / 3.45);

    style.display = style.display || 'block';

    canvas.width = w;
    canvas.height = h;
}

function getCtx(canvas) {
    const context = canvas && canvas.getContext && canvas.getContext('2d');

    if (context && context.canvas === canvas) {
        setUpCanvas(canvas);
        return context;
    }

    return null;
}

function px2cm(px, dpi) {
    return px * (2.54 / dpi)
}

function cm2px(cm, dpi) {
    return cm * (dpi / 2.54)
}

function hourDiff(a, b) {
    return Math.abs(a - b) / 36e5;
}

function getHourString(n) {
    var h = Math.floor(n);
    var m = Math.round((n - h) * 60);

    if (m < 10)
        m = "0" + m;

    return h + ":" + m;
}

class Config {
    constructor(config) {
        this._config = setConfig(config);
        this.scrubData();
    }

    get data() {
        return this._config.data;
    }

    get options() {
        return this._config.options;
    }

    sortDataByDate = (a, b) => {
        var dateA = new Date(a.d);
        var dateB = new Date(b.d);

        if (dateA < dateB) {
            return -1;
        }
        if (dateA > dateB) {
            return 1;
        }

        return 0;
    };

    scrubData = () => {
        const data = this.data;

        if (data.length > 0) {
            var remove = [];

            for (var i = 0; i < data.length; i++) {
                var dataStatus = data[i].status;
                var dataDate = new Date(data[i].d);

                if (isNaN(dataStatus) ||
                    dataStatus < 1 ||
                    dataStatus > 4 ||
                    isNaN(dataDate.valueOf()) ||
                    dataDate instanceof Date == false) {
                    remove.push(i);
                }
            }

            for (var j = remove.length - 1; j >= 0; j--)
                data.splice(j, 1);

            data.sort(this.sortDataByDate);
        }
    };
}

class eLog {

    constructor(item, userConfig) {
        const initCanvas = getCanvas(item);
        const context = getCtx(initCanvas);
        const canvas = context && context.canvas;
        const height = canvas && canvas.height;
        const width = canvas && canvas.width

        this.config = new Config(userConfig);
        this.ctx = context;
        this.canvas = canvas;
        this.width = width;
        this.height = height;

        this.statuses = {
            1: { label: 'OFF', y: undefined, h: 0, violation: false },
            2: { label: 'SB', y: undefined, h: 0, violation: false },
            3: { label: 'D', y: undefined, h: 0, violation: false },
            4: { label: 'ON', y: undefined, h: 0, violation: false }
        };
        this.hours = new Object();

        this.initViolationCounters();

        // todo: move the following values to a "Defaults" class

        this.hourLineWidth = 6;
        this.vertLineWidth = 2;

        this.lineHeightMult = 1.428;
        this.minFontSize = 12;
        this.headerFontPercent = 1.3;
        this.statusFontPercent = 1;
        this.hourFontPercent = 1.5;
        this.fontFamily = 'Helvetica';

        // colors
        this.bgColor = 'rgb(250, 250, 250)';
        this.lineColor = 'rgb(165, 165, 165)';
        this.headerColor = 'rgb(156, 23, 34)';
        this.statusColor = 'rgb(217, 83, 79)';
        this.hourLineColor = 'rgba(91, 192, 222, 0.8)';
        this.vertLineColor = 'rgba(113, 113, 113, 0.6)';
        this.hourTextColor = 'rgb(1, 138, 167)';
        this.violationColor = 'rgba(217, 83, 79, 0.7)';
        this.violationLineColor = 'rgba(217, 83, 79, 0.8)';

        // ratios
        this.headerRatio = 0.15;
        this.statusRatio = 0.05;
        this.totalRatio = 0.08;

        this.addResizeListener();
        this.drawElog();
    }

    get data() {
        return this.config.data;
    }

    get startStatus() {
        return this.config.options.startStatus;
    }

    set startStatus(s) {
        this.config.options.startStatus = s;
    }

    get startOffDutyHours() {
        return this.config.options.startOffDutyHours;
    }

    get startDrivingHours() {
        return this.config.options.startDrivingHours;
    }

    get startDutyHours() {
        return this.config.options.startDutyHours;
    }

    get startDate() {
        return this.config.options.startDate;
    }

    setStart = (status) => {
        if (!isNaN(status) &&
            status >= 1 &&
            status <= 4) {
            this.startStatus = status;
        }

        this.redraw();
    }

    addData = (addStatus, addDate) => {
        this.data.push(
            {
                status: addStatus,
                d: addDate
            }
        )

        this.config.scrubData();
        this.redraw();
    }

    clearCanvas(canvas, ctx) {
        ctx = ctx || canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    destroy() {
        this.clearCanvas(this.canvas, this.ctx);
        this.canvas = null;
        this.ctx = null;
    }

    reset = () => {
        this.data.length = 0;
        this.redraw();
    }

    resetStatusHours = () => {
        for (var i = 1; i < 5; i++) {
            this.statuses[i].h = 0;
            this.statuses[i].violation = false;
        }
    };

    initViolationCounters = () => {
        this.tenHourConsecutive = this.startOffDutyHours;
        this.drivingConsecutive = 0;
        this.sleeperConsecutive = 0;
        this.sevenHourProvision = false;
        this.drivingBreak = 0;
        this.elevenHourDriving = this.startDrivingHours;
        this.fourteenHourLimit = this.startDutyHours;
    };

    redraw = () => {
        this.clearCanvas(this.canvas, this.ctx);
        this.resetStatusHours();
        this.initViolationCounters();
        setUpCanvas(this.canvas);

        this.drawElog();
    };

    addResizeListener = () => {
        window.addEventListener('resize', this.redraw);
    };

    getFontSize = (sizePercent) => {
        var cm = px2cm(this.canvas.width, 96);
        var fontSize = Math.ceil(cm2px((sizePercent / 100) * cm, 96));
        if (fontSize > this.minFontSize) {
            return fontSize;
        } else {
            return this.minFontSize;
        }
    };

    printFillText = (txt, fs, x, y, w = 0) => {
        const ctx = this.ctx;

        var lines = txt.split('\n');
        var lineHeight = fs * this.lineHeightMult;

        if (y > 0 && lines.length > 1) {
            var yOffset = (lineHeight / 2) * (lines.length - 1);

            y = y - yOffset;

            if (y < 0) {
                y = 0;
            }
        }

        for (var i = 0; i < lines.length; i++)
            ctx.fillText(lines[i], x, y + (i * lineHeight), w > 0 ? w : undefined);
    };

    drawSingleLine = (x, y, x2, y2, c, w) => {
        const ctx = this.ctx;

        ctx.strokeStyle = c;
        ctx.lineWidth = w;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };

    checkViolations = (curStatus, prevStatus, fromDate, toDate) => {
        var hDiff = hourDiff(toDate, fromDate);

        if (prevStatus == 1 || prevStatus == 2) {
            if (prevStatus == 2 && !this.sevenHourProvision) {
                // Sleeper Berth Provision
                this.sleeperConsecutive += hDiff;

                if (this.sleeperConsecutive > 7) {
                    this.sevenHourProvision = true;
                }
            }

            this.tenHourConsecutive += hDiff;

            if (this.tenHourConsecutive >= 10 ||
                (this.tenHourConsecutive >= 2 && this.tenHourConsecutive < 7 && this.sleeperConsecutive >= 7 && this.tenHourConsecutive + this.sleeperConsecutive >= 10)) {
                // reset limits
                this.elevenHourDriving = 0;
                this.fourteenHourLimit = 0;

                if (this.tenHourConsecutive < 7) {
                    this.sleeperConsecutive = 0;
                    this.sevenHourProvision = false;
                }
            }
        } else if (prevStatus == 3 || prevStatus == 4) {
            this.fourteenHourLimit += hDiff;

            if (prevStatus == 3) {
                this.elevenHourDriving += hDiff;
                this.drivingConsecutive += hDiff;
            }
        }

        // check 30-minute driving break
        if (prevStatus != 3) {
            this.drivingBreak += hDiff;

            if (this.drivingBreak >= 0.5) {
                this.drivingConsecutive = 0;
            }
        }

        // check sleeper berth provision
        if (curStatus != 3 && !this.sevenHourProvision) {
            this.sleeperConsecutive = 0;
        }

        if (curStatus == 3 || curStatus == 4) {
            // reset consecutive hour counter
            this.tenHourConsecutive = 0;

            // reset driving break counter
            if (curStatus == 3) {
                this.drivingBreak = 0;
            }
        }

        if (this.elevenHourDriving > 11 || // 11-Hour Driving Limit
            this.drivingConsecutive > 8 || // 30-Minute Driving Break
            (this.fourteenHourLimit > 14 && curStatus == 3)) { // 14-Hour Limit
            this.statuses[3].violation = true;
        } else {
            this.statuses[3].violation = false;
        }
    };

    drawElog = () => {
        const ctx = this.ctx;

        // heights
        const elogHeight = Math.floor(this.canvas.height);
        const headerBlockHeight = Math.floor(elogHeight * this.headerRatio);
        const statusBlockHeight = Math.floor((elogHeight - headerBlockHeight) / 4);

        // widths
        const elogWidth = Math.floor(this.canvas.width);
        const statusBlockWidth = Math.floor(elogWidth * this.statusRatio);
        const totalBlockWidth = Math.floor(elogWidth * this.totalRatio);
        const hourBlockWidth = Math.floor((elogWidth - statusBlockWidth - totalBlockWidth) / 24);
        const headerBlockWidth = statusBlockWidth + (hourBlockWidth * 24);

        // fonts
        const headerFontSize = this.getFontSize(this.headerFontPercent);
        const statusFontSize = this.getFontSize(this.statusFontPercent);
        const hourFontSize = this.getFontSize(this.hourFontPercent);

        // background
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, elogWidth, elogHeight);

        // header block
        ctx.fillStyle = this.headerColor;
        ctx.beginPath();
        ctx.rect(0, 0, headerBlockWidth, headerBlockHeight);
        ctx.fill();

        // header text
        ctx.font = headerFontSize + 'px ' + this.fontFamily;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgb(255, 255, 255)';
        for (var i = 0; i < 24; i++) {
            var hourText = '';

            if (i == 0) {
                hourText = 'M';
            } else if (i == 12) {
                hourText = 'N';
            } else if (i > 12) {
                hourText = (i - 12).toString();
            } else {
                hourText = i.toString();
            }

            this.printFillText(hourText, headerFontSize, (hourBlockWidth * i) + statusBlockWidth, headerBlockHeight)
        }

        // header line
        ctx.strokeStyle = this.lineColor;
        ctx.beginPath();
        ctx.moveTo(0, headerBlockHeight);
        ctx.lineTo(elogWidth, headerBlockHeight);
        ctx.stroke();

        // setup status text
        ctx.font = statusFontSize + 'px ' + this.fontFamily;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.save();

        for (var i = 1; i < 5; i++) {
            var rowY = (statusBlockHeight * i) + headerBlockHeight;
            this.statuses[i].y = rowY - Math.floor(statusBlockHeight * 0.5);

            // row line
            ctx.beginPath();
            ctx.moveTo(0, rowY);
            ctx.lineTo(elogWidth, rowY);
            ctx.stroke();

            // status block background
            ctx.fillStyle = this.statusColor;
            ctx.fillRect(0, rowY - statusBlockHeight, statusBlockWidth, statusBlockHeight);

            // print status text
            ctx.fillStyle = 'rgb(255, 255, 255)';
            this.printFillText(this.statuses[i].label, statusFontSize, Math.floor(statusBlockWidth * 0.5), Math.floor(rowY - (statusBlockHeight * 0.5)), statusBlockWidth)

            this.hours["0"] = statusBlockWidth;
            for (var j = 1; j < 25; j++) {
                var hourX = (hourBlockWidth * j) + statusBlockWidth;
                this.hours[j.toString()] = hourX; // save x coordinate for drawing hour lines

                // hour line
                ctx.lineCap = 'butt';
                ctx.beginPath();
                ctx.moveTo(hourX, rowY - statusBlockHeight);
                ctx.lineTo(hourX, rowY);
                ctx.stroke();

                ctx.lineCap = 'round';

                var xCoor1 = hourX - Math.floor(hourBlockWidth * 0.75);
                var xCoor2 = hourX - Math.floor(hourBlockWidth * 0.5);
                var xCoor3 = hourX - Math.floor(hourBlockWidth * 0.25);

                // quarter hour line
                ctx.beginPath();
                ctx.moveTo(xCoor1, rowY - Math.floor((statusBlockHeight * 0.75) * 0.5) - (statusBlockHeight * 0.25));
                ctx.lineTo(xCoor1, rowY - Math.floor((statusBlockHeight * 0.25) * 0.5) - (statusBlockHeight * 0.25));
                ctx.stroke();

                // half hour line
                ctx.beginPath();
                ctx.moveTo(xCoor2, rowY - Math.floor(statusBlockHeight * 0.75));
                ctx.lineTo(xCoor2, rowY - Math.floor(statusBlockHeight * 0.25));
                ctx.stroke();

                // three quarter hour line
                ctx.beginPath();
                ctx.moveTo(xCoor3, rowY - Math.floor((statusBlockHeight * 0.75) * 0.5) - (statusBlockHeight * 0.25));
                ctx.lineTo(xCoor3, rowY - Math.floor((statusBlockHeight * 0.25) * 0.5) - (statusBlockHeight * 0.25));
                ctx.stroke();
            }
        }

        ctx.restore();

        this.drawLines(hourBlockWidth);
        this.drawTotals(Math.ceil(headerBlockWidth + (elogWidth - headerBlockWidth) * 0.5), (elogWidth - headerBlockWidth), statusBlockHeight, hourFontSize);
        //this.printData(statusBlockWidth, 0, 12);
    };

    drawLines = (hourBlockWidth) => {
        const ctx = this.ctx;
        const data = this.data;
        const statuses = this.statuses;

        var startDate = this.startDate ? new Date(this.startDate) : '';

        ctx.lineWidth = this.hourLineWidth;
        ctx.lineCap = "butt";

        if (data.length > 0) {
            var prevData;

            for (var i = 0; i < data.length; i++) {
                var toDate = new Date(data[i].d);
                var toHr = toDate.getHours();
                var toMin = (toDate.getMinutes() / 60).toFixed(2);

                var lineC = this.hourLineColor;

                if (prevData) {
                    var dir = prevData.status > data[i].status ? -1 : 1

                    var fromDate = new Date(prevData.d);
                    var fromHr = fromDate.getHours();
                    var fromMin = (fromDate.getMinutes() / 60).toFixed(2);

                    this.checkViolations(data[i].status, prevData.status, fromDate, toDate);
                    if (statuses[prevData.status].violation)
                        lineC = this.violationLineColor;

                    this.drawSingleLine(
                        this.hours[fromHr] + Math.floor(hourBlockWidth * fromMin), statuses[prevData.status].y,
                        this.hours[toHr] + Math.floor(hourBlockWidth * toMin), statuses[prevData.status].y,
                        lineC,
                        this.hourLineWidth);

                    this.drawSingleLine(
                        this.hours[toHr] + Math.floor(hourBlockWidth * toMin), statuses[prevData.status].y + ((this.hourLineWidth * 0.5) * (dir * -1)),
                        this.hours[toHr] + Math.floor(hourBlockWidth * toMin), statuses[data[i].status].y + ((this.hourLineWidth * 0.5) * dir),
                        this.vertLineColor,
                        this.vertLineWidth);
                } else {
                    var dir = this.startStatus > data[i].status ? -1 : 1

                    if (!startDate) {
                        startDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 0);
                    }

                    this.checkViolations(data[i].status, this.startStatus, startDate, toDate);
                    if (statuses[this.startStatus].violation)
                        lineC = this.violationLineColor;

                    this.drawSingleLine(
                        this.hours["0"], this.statuses[this.startStatus].y,
                        this.hours[toHr] + Math.floor(hourBlockWidth * toMin), statuses[this.startStatus].y,
                        lineC,
                        this.hourLineWidth);

                    this.drawSingleLine(
                        this.hours[toHr] + Math.floor(hourBlockWidth * toMin), statuses[this.startStatus].y + ((this.hourLineWidth * 0.5) * (dir * -1)),
                        this.hours[toHr] + Math.floor(hourBlockWidth * toMin), statuses[data[i].status].y + ((this.hourLineWidth * 0.5) * dir),
                        this.vertLineColor,
                        this.vertLineWidth);
                }

                prevData = data[i];
            }

            var finalDate = new Date(prevData.d);
            var finalHr = finalDate.getHours();
            var finalMin = (finalDate.getMinutes() / 60).toFixed(2);

            var lineC = this.hourLineColor;
            var endOfDay = new Date(finalDate.getFullYear(), finalDate.getMonth(), finalDate.getDate(), 24);

            this.checkViolations(prevData.status, prevData.status, finalDate, endOfDay);
            if (statuses[prevData.status].violation)
                lineC = this.violationLineColor;

            this.drawSingleLine(
                this.hours[finalHr] + Math.floor(hourBlockWidth * finalMin), statuses[prevData.status].y,
                this.hours["24"], statuses[prevData.status].y,
                lineC,
                this.hourLineWidth);
        } else {
            this.drawSingleLine(
                this.hours["0"], statuses[this.startStatus].y,
                this.hours["24"], statuses[this.startStatus].y,
                this.hourLineColor,
                this.hourLineWidth);
        }
    };

    drawTotals = (x, wd, ht, fs) => {
        const ctx = this.ctx;
        const data = this.data;
        const statuses = this.statuses;

        if (data.length > 0) {
            var prevData;

            for (var i = 0; i < data.length; i++) {
                var toDate = new Date(data[i].d);

                if (prevData) {
                    var fromDate = new Date(prevData.d);
                    var hrDiff = hourDiff(toDate, fromDate);

                    statuses[prevData.status].h = statuses[prevData.status].h + hrDiff;
                } else {
                    var startOfDay = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 0);
                    var startDiff = hourDiff(toDate, startOfDay);

                    statuses[this.startStatus].h = statuses[this.startStatus].h + startDiff;
                }

                prevData = data[i];
            }

            var finalDate = new Date(prevData.d);
            var endOfDay = new Date(finalDate.getFullYear(), finalDate.getMonth(), finalDate.getDate(), 24);
            var finalDiff = hourDiff(endOfDay, finalDate);

            statuses[prevData.status].h = statuses[prevData.status].h + finalDiff;
        } else {
            statuses[this.startStatus].h = 24;
        }

        for (var j = 1; j < 5; j++) {
            //if (statuses[j].violation) {
            //    ctx.fillStyle = this.violationColor;
            //    ctx.fillRect(
            //        x - Math.floor(wd * 0.5), 
            //        statuses[j].y - Math.floor(ht * 0.5), 
            //        x + Math.floor(wd * 0.5), 
            //        ht - 2);
            //}

            ctx.fillStyle = this.hourTextColor;
            ctx.font = "bold " + fs + "px " + this.fontFamily;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            this.printFillText(getHourString(statuses[j].h), fs, x, statuses[j].y, wd)
        }
    };

    printData = (x, startY, fs) => {
        const ctx = this.ctx;
        const data = this.data;
        const statuses = this.statuses;

        var lineHeight = fs * this.lineHeightMult;
        var y = startY

        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.font = "bold " + fs + "px " + this.fontFamily;
        ctx.textAlign = "start";
        ctx.textBaseline = "top";

        if (data.length > 0) {
            var tempDate = new Date(data[0].d);
            var startDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate(), 0);

            y = y + (lineHeight * 0.5);
            this.printFillText("1. " + statuses[this.startStatus].label.replace("\n", " "), fs, x, y);

            y = y + lineHeight;
            this.printFillText(startDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }), x + ctx.measureText("1. ").width, y);

            for (var i = 0; i < data.length; i++) {
                var status = data[i].status;
                var statusLabel = statuses[status].label
                var timeStamp = new Date(data[i].d);
                var listNum = (i + 2) + ". ";
                var listNumW = ctx.measureText(listNum)

                y = y + lineHeight;
                this.printFillText(listNum + statusLabel.replace("\n", " "), fs, x, y);

                y = y + lineHeight;
                this.printFillText(timeStamp.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }), fs, x + listNumW.width, y);
            }
        } else {
            this.printFillText("1. " + statuses[1].label, fs, x, startY + lineHeight);
        }
    };
}