<a name="readme-top"></a>

<h3 align="center">eLog.js</h3>

<p align="center">
    Generate electronic logs for drivers using the &lt;canvas> element.
</p>

[Live Demo](https://logandawson.github.io/eLog.js/)

![eLog.js example](https://github.com/logandawson/eLog.js/blob/main/imgs/elog.png)

## Prerequisites

Nothing. This is a pure JavaScript library.

## Usage

Download and reference the `eLog.js` script.
```html
<script src="js/eLog.js" type="text/javascript"></script>
```

Add a `canvas` to your page.
```html
<canvas id="log" style="width: 100%;"></canvas>
```

In a JavaScript function get the context for the canvas.
```js
const c = document.getElementById("log");
const ctx = c.getContext("2d");
```

Create a `config` object with your data and options. See below for definitions.
```js
const config = {
    data: [
        { status: 3, d: '2022-01-01 12:00' }
    ],
    options: {
        startStatus: 1
    }
}
```

Display the electronic log using the context and config.
```js
new eLog(ctx, config);
```

## Documentation

### Data

Name | Type | Description
--- | --- | ---
status | integer | 1 for off-duty, 2 for sleeper berth, 3 for driving, 4 for on-duty.
d | string | Date and time when the change in status occured.

### Options

Not required but violations may be calculated incorrectly without.

Name | Type | Description
--- | --- | ---
startStatus | integer | Initial status for the log. See above for each corresponding number definition.
startOffDutyHours | decimal | Current off-duty hours at the start of the day. Default is 0.
startDrivingHours | decimal | Current driving hours at the start of the day. Default is 0.
startDutyHours | decimal | Current duty hours (driving + on-duty) at the start of the day. Default is 0.
startDate | string | The first date and time a change in status was made. For example, if the driver drove through the night set this to when they began driving.
