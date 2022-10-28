<a name="readme-top"></a>

<h3 align="center">eLog.js</h3>

<p align="center">
    Generate electronic logs for drivers using the &lt;canvas> element.
</p>

<p align="center">
    ![eLog.js example image](https://github.com/logandawson/eLog.js/blob/main/imgs/elog.png | width=640)
</p>

## Prerequisites

eLog.js requires jQuery.

## Usage

Download and reference the eLog.js script.
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

Create a config object with your data.
```js
const config = {
    data: [
        { status: 1, d: '2022-01-01 12:00' }
    ]
}
```

Display the eLog using the context and config.
```js
new eLog(ctx, config);
```
