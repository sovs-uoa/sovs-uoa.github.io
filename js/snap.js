gridLayer = new Snap("#host");

const minorLineAttr = { stroke: "#363636", strokeWidth: 1 },
      elements = [],
      dimension = 100,
      divisions = 10;

// background box
elements.push(gridLayer.rect(0, 0, dimension, dimension).attr({
  fill: '#292929',
  stroke: "#1c1c1c", strokeWidth: 1
}));

// add horizontal & vertical lines
const lineCount = dimension / divisions;
for (var index=1; index < lineCount; index++) {
  const offset = lineCount*index,
        sw = minorLineAttr.strokeWidth;
  
  elements.push(gridLayer.line(sw, offset, dimension-sw, offset).attr(minorLineAttr));
  elements.push(gridLayer.line(offset, sw, offset, dimension-sw).attr(minorLineAttr));
}

// construct a 3x3 grid that is essentially masked to a 1x1 pattern
var   gridPattern = gridLayer.g(...elements).toPattern(0, 0, dimension, dimension);
const gridRect = gridLayer.rect(-dimension, -dimension, 3*dimension, 3*dimension).attr({fill: gridPattern});
const grid3x3Pattern = gridRect.toPattern(0, 0, dimension, dimension);
const bgRect = gridLayer.rect(0,0,'100%','100%').attr({fill: grid3x3Pattern});

function getElementCoords(x, y, t) {
  return {
    x : t.e + x * t.a + y * t.c,
    y: t.f + x * t.b + y * t.d
  };
}

// transform on drag
const dragStart = function () {
  console.log(this);
  const bbox = this.getBBox(),
        coords = getElementCoords(bbox.x, bbox.y, gridRect.transform().localMatrix);
  this.data("coords", coords);
};

const dragMove = function(dx, dy) {
  const coords = this.data("coords");
  gridRect.transform("t" + (coords.x + dx) % dimension + " " + (coords.y + dy) % dimension);
};

const dragStop = function() {
  this.removeData("coords");
};

/* --------------------------------------------------------------------------------------------


------------------------------------------------------------------------------------------------ */

// bgRect.drag(dragMove, dragStart, dragStop);

