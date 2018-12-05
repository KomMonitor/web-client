# rangeslide.js
Feature rich, highly customizable range slider with labels (but without jQuery)

## Table of contents

- [Screenshots](#screenshots)
- [Quick start](#quick-start)
- [Usage](#usage)
- [Examples](#examples)
- [Options](#options)
- [Methods](#methods)
- [Events](#events)
- [Modes](#modes)
- [Browser support](#browser-support)
- [Copyright and license](#copyright-and-license)

## Screenshots

![Rangeslide with labels and tooltip](https://rawgit.com/karenpommeroy/rangeslide.js/master/assets/screen_1.png)
![Example with different label positioning](https://rawgit.com/karenpommeroy/rangeslide.js/master/assets/screen_2.png)
![Rangeslide with range selection (2 thumbs)](https://rawgit.com/karenpommeroy/rangeslide.js/master/assets/screen_3.png)
![Example with temporal data](https://rawgit.com/karenpommeroy/rangeslide.js/master/assets/screen_4.png)

## Quick start
Several quick start options are available:
#### Download the latest build

###### Development
 * [rangeslide.js](https://raw.githubusercontent.com/karenpommeroy/rangeslide.js/master/dist/rangeslide.js)
 * [rangeslide.css](https://raw.githubusercontent.com/karenpommeroy/rangeslide.js/master/dist/rangeslide.css)

###### Production
 * [rangeslide.min.js](https://raw.githubusercontent.com/karenpommeroy/rangeslide.js/master/dist/rangeslide.min.js)
 * [rangeslide.min.css](https://raw.githubusercontent.com/karenpommeroy/rangeslide.js/master/dist/rangeslide.min.css)

#### Install From Bower
```bash
bower install rangeslide.js --save
```

#### Install From Npm
```bash
npm install rangeslide.js --save
```

Done!

## Usage
#### Including files:

```xml
<link rel="stylesheet" href="/path/to/rangeslide.css">
<script src="/path/to/rangeslide.js"></script>
```

#### Using require.js:
```javascript
var rangeslide = require("rangeslide"); // or whatever module name was assigned
```

#### Initialization
All you need to do is invoke rangeslide on an element:
```javascript
var myRangeslide = rangeslide(domNode, options);
```
You can also initialize with css selector string:

```javascript
var myRangeslide = rangeslide("#elementId", options);
```

## Examples
There are some example usages that you can look at to get started. They can be found in the [examples folder](https://github.com/karenpommeroy/rangeslide.js/tree/master/examples).

 * [Complete examples page](https://rawgit.com/karenpommeroy/rangeslide.js/master/examples/example.html)

## Options
`rangeslide.js` can accept an options object to alter the way it looks and behaves.
If no options object is passed default values are used.
The example of a structure of an options object is as follows:

```javascript
{
  data: [
  	{ name: "example1", item: "Example text" },
  	{ name: "example2", item: "Another example text" },
  	{ name: "example3", item: function() { return "And yet another example text"; }
  ],
  showLabels: true,
  showTicks: true,
  labelsPosition: "alternate",
  startAlternateLabelsFromTop: true,
  startPosition: 0,
  thumbHeight: 16,
  thumbWidth: 16,
  handlers: {
    initialized: function(rangeslideElement) {},
    valueChanged: function(data, rangeslideElement) {},
    markerClicked: function(data, markerElement) {}
  }
```

Here is the explanation of options object:

Option                      | Type    | Description                                             | Default | Options
--------------------------- | ------- | ------------------------------------------------------- | ------- | ---------- |
animations                  | Boolean | Enable slider animations                                | true    |
autoPlay                    | Boolean | Enable auto play mode                                   | false   |
autoPlayDelay               | Number  | Delay (in miliseconds) between steps in auto play mode  | 1000    |
data                        | Array   | Array of data objects (property 'name' is mandatory     | []      |
dataSource                  | String  | Name of the property containing actual values           | "value" |
enableLabelClick            | Boolean | Enable click on labels                                  | true    |
enableMarkerClick           | Boolean | Enable click on track markers                           | true    |
enableTrackClick            | Boolean | Enable click on track                                   | true    |
endPosition                 | Number  | Position of max thumb (only in "range" mode)            | Infinity|
handlers                    | Object  | Event handlers collection                               | {}      |
highlightSelectedLabels     | Boolean | Enable highlighting of selected labels                  | false   |
labelsPosition              | String  | Position of labels on a rangeslide                      | 'below' | 'above', 'below', 'alternate'
labelsContent               | String, Function | Specifies label content. Can be name of attribute or function (data item as parameter)                                | null    |
labelsWidth                 | Number  | Width of labels                                         | 60      |
leftLabel                   | String  | Text to display on left side label                      | ""      |
loop                        | Boolean | Enable loop when auto play mode is active               | true    |
markerSize                  | Number  | Size of track marker (pixels)                           | 14      |
mode                        | String  | Sliders operation mode (see [Modes](#modes))            | "single"| "single", "select", "range"
rightLabel                  | String  | Text to display on right side label                     | ""      |
showLabels                  | Boolean | Show/hide labels                                        | false   |
sideLabelsWidth             | Number  | Width of left and right side labels                     | 40      |
showTrackMarkersProgress    | Boolean | Indicate progress on markers                            | false   |
showTicks                   | Boolean | Show/hide label ticks                                   | false   |
showTrackMarkers            | Boolean | Show/hide track markers                                 | false   |
showTrackProgress           | Boolean | Indicate progress on track                              | false   |
showTooltips                | Boolean | Show/hide tooltips on track markers                     | false   |
showValue                   | Boolean | Show/hide value indicator                               | false   |
spacing		                | String  | How to calculate distance between markers               | "equidistant" ("data-driven" if all items are Date instances)     | "equidistant", "data-driven"
startAlternateLabelsFromTop | Boolean | Show first label above if labelsPosition is 'alternate' | false   |
startPosition               | Number  | Initial position of rangeslide thumb                    | 0       |
stepSize                    | Number  | Size of rangeslider step                                | 16      |
thumbHeight                 | Number  | Height of thumb element (in pixels)                     | 16      |
thumbWidth                  | Number  | Width of thumb element (in pixels)                      | 16      |
tickHeight                  | Number  | Height of label's tick (in pixels)                      | 16      |
tooltipContent              | String, Function | Specifies tooltip content, same as labelContent | 7       |
valueIndicatorContent       | String, Function | Specifies value indicator content, same as labelContent                      | null    |
valueIndicatorOffset        | Number  | Value indicator offset from rangeslider thumb           | 5       |
valueIndicatorWidth         | Number  | Width of value indicator (in pixels)                    | 32      |
valueIndicatorHeight        | Number  | Height of value indicator (in pixels)                   | 32      |
valuePosition               | String  | Position of value indicator                             | 'above' | 'above', 'below', 'thumb'

## Data

Data collection for rangeslide is provided during instatiation or later using "data" attribute in options.
By default values for slider are taken from "value" attribute. If provided data item do not have this attribute then it is **required** that you specify the name of the attribute using **dataSource** in options.
Number of steps (markers) for a slider is equal to number of items passed in data collection.

```javascript
rangeslide("#element" {
	data: [
    	{ key: "data1", value: "simple string data"},
        { key: "data2", value: 2 },
        { key: "data3", value: 0.001 } },
        { key: "data4", value: { "passing": "object", "as": "data" } },
        { key: "data5", value: "more text here" }
    ]
});
```

Rangeslide constructed with the above data will have 5 steps (markers).

## Methods
Methods are called on rangeslide instances. You shoud save the instances to variable to have further access to it.

#### object getValue()
Get current rangeslide value. Returns single value when in "single" mode, otherwise returns array.
```javascript
var item = rangeslide.getValue();
```

#### object getMinValue()
Get current rangeslide minimum value. Returns null if in "select" mode.
```javascript
var item = rangeslide.getMinValue();
```

#### object getMaxValue()
Get current rangeslide maximum value. Returns null if in "select" mode.
```javascript
var item = rangeslide.getMaxValue();
```

#### object getRange()
Get current range. Returns empty array if mode is other than "range".
```javascript
var item = rangeslide.getRange();
```

#### object getSelection()
Get current selection. Returns empty array if mode is other than "select".
```javascript
var item = rangeslide.getSelection();
```

#### DOMNode getElement()
Gets rangeslide's DOM node object.
```javascript
var node = rangeslide.getElement();
```

#### void setValue(int index)
Set rangeslide value by specifying data index.
```javascript
rangeslide.setValue(2);
```

#### void setMinValue(int index)
Set rangeslide minimum value by specifying data index.
```javascript
rangeslide.setMinValue(2);
```

#### void setMaxValue(int index)
Set rangeslide maximum value by specifying data index.
```javascript
rangeslide.setMaxValue(2);
```

#### void setValueByAttribute(string attributeName, object attributeValue)
Set rangeslide value by specifying property and value. If multiple data items with the same names are found first one is set.
```javascript
rangeslide.setValueByAttribute("id", 123456);
```

#### void setMinValueByAttribute(string attributeName, object attributeValue)
Set rangeslide minimum value by specifying property and value. If multiple data items with the same names are found first one is set.
```javascript
rangeslide.setMinValueByAttribute("id", 123456);
```

#### void setMaxValueByAttribute(string attributeName, object attributeValue)
Set rangeslide maximum value by specifying property and value. If multiple data items with the same names are found first one is set.
```javascript
rangeslide.setMaxValueByAttribute("id", 123456);
```

#### void setOption(string name, object value)
Gets rangeslide's DOM node object (invokes rangeslide refresh).
```javascript
rangeslide.setOption("autoPlay", true);
```

#### bool isSingleMode()
Check if rangeside operates in single value mode.
```javascript
rangeslide.isSingleMode();
```

#### bool isRangeMode()
Check if rangeside operates in range mode.
```javascript
rangeslide.isRangeMode();
```

#### bool isSelectMode()
Check if rangeside operates in selection mode.
```javascript
rangeslide.isSelectMode();
```

#### void refresh()
Refresh and redraw rangeslide.
```javascript
rangeslide.refresh();
```

#### void destroy()
Destroy rangeslide instance.
```javascript
rangeslide.destroy();
```

## Events
`rangeslide.js` provides custom events for some of it's actions. Appropriate callbacks can be specified in options.

Event             | Description                             | Arguments
----------------- | --------------------------------------- | ----------------------------- |
destroyed         | Fires after slider is destroyed         | rangeslideElement
initialized       | Fires after slider is initialized       | rangeslideElement
labelClicked      | Fires after label is clicked            | dataItem, labelElement
markerClicked     | Fires after track marker is clicked     | dataItem, markerElement
playStart         | Fires when auto play is started         | dataItem, rangeslideElement
playStop          | Fires when auto play is stopped         | dataItem, rangeslideElement
refreshed         | Fires after slider is refreshed         | rangeslideElement
thumbDragStart    | Fires when thumb dragging is initiated  | dataItem, thumbElement
thumbDragged      | Fires when thumb is being dragged       | dataItem, thumbElement
thumbDraggedEnd   | Fires when thumb is dropped             | dataItem, thumbElement
trackClicked      | Fires after slider track is clicked     | dataItem, trackElement
valueChanged      | Fires after slider value is changed     | dataItem, rangeslideElement


Event handlers are passed in rangeslide options like in the example below:
```javascript
rangeslide("#element" {
	handlers: {
    	"valueChanged": [function(data, element) { console.log(data); }],
        "labelClicked": [
        	function(data, element) { console.log(data); },
            function(data, element) { return data.name; },
            function(data, element) { element.style.backroundColor = "#e2e3e4"; },
        ]
    }
})
```

## Modes
`rangeslide.js` can operate in three different modes:
* **single value mode ("single")** - one thumb, single value, autoPlay is valid only in this mode
* **range mode ("range")** - two thumbs (indicating minimum and maximum value), range as value
* **selection mode ("select")** - no thumbs, multiple selection, values are selected/deselectef by clicking markers

Operation mode can be specified by setting **mode** in options during initialization (or later using setOption method)

## Copyright and license

Licensed under [MIT license](LICENSE).

[^ back to top](#table-of-contents)
