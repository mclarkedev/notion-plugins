var path;

// Set white background color, full width and hieght of canvas
var canvas = document.getElementById("canvas");
var bgPoint, bgSize, bg, bgColor, penColor;

var penWidth = 1.5;

var notionBgColor = "#2f3437";
// var darkMode = false;

// var url =
//   window.location != window.parent.location
//     ? document.referrer
//     : document.location.href;
// console.log("Doc Location\n", document.location.href);
// console.log("Doc referrer\n", document.referrer);
// console.log("Win Location\n", window.location);
// console.log("Win Parent Location\n", window.parent.location);

var browserTheme =
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

var currentTheme = browserTheme;

// Setting mode state based on bool
var darkMode = browserTheme === "dark" ? true : false;
// console.log(darkMode);

function toggleTheme() {
  var checkTheme = darkMode === true ? "light" : "dark";
  console.log(checkTheme);
  setTheme(checkTheme);
}

globals.toggleTheme = toggleTheme;

function setTheme(theme) {
  if (theme === "dark") {
    bgColor = notionBgColor;
    penColor = "white";

    if (bg) {
      bg.style = {
        fillColor: notionBgColor,
      };
    }

    paper.project.activeLayer.strokeColor = "white";
    // bg
    document.body.style.backgroundColor = notionBgColor;
    paper.project.activeLayer.firstChild.fillColor = notionBgColor;
    paper.project.activeLayer.firstChild.strokeColor = notionBgColor;

    // paper.project.activeLayer.firstChild.style = {
    //   fillColor: notionBgColor,
    //   strokeColor: notionBgColor,
    // };

    // console.log(paper.project.activeLayer.firstChild);

    console.log("DARK MODE");
    darkMode = true;
  }
  if (theme === "light") {
    bgColor = [1, 1, 1];
    penColor = "black";

    if (bg) {
      bg.style = {
        fillColor: new Color(bgColor),
      };
    }

    paper.project.activeLayer.strokeColor = "black";
    // bg
    document.body.style.backgroundColor = "white";
    paper.project.activeLayer.firstChild.fillColor = "white";
    paper.project.activeLayer.firstChild.strokeColor = "white";

    console.log("LIGHT MODE");
    darkMode = false;
  }
}

function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

function initPaper() {
  // If no bg then add
  bgPoint = new Point(0, 0);
  bgSize = new Size(canvas.width, canvas.height);
  bg = new Path.Rectangle(bgPoint, bgSize);

  setTheme(currentTheme);
}

var localDrawing = localStorage.getItem("drawing");
if (localDrawing) {
  resetFromLocal();
}
if (!localDrawing) {
  initPaper();
}

function resetFromLocal() {
  if (localDrawing) {
    console.log("Local drawing found\n", JSON.parse(localDrawing));

    try {
      paper.project.clear();
      paper.project.importJSON(JSON.parse(localDrawing));
      paper.project.activate();

      penColor = "black";

      setTheme(browserTheme);

      console.log("Active layer\n", paper.project.activeLayer);
    } catch (error) {
      console.log(error);
    }
  }
}

globals.resetFromLocal = resetFromLocal;

function setWidth(width) {
  penWidth = width;
}

globals.setWidth = setWidth;

function setColor(color) {
  penColor = color;
}

globals.setColor = setColor;

tool.minDistance = 1;
tool.maxDistance = 5;
// tool.fixedDistance = 2;

// Main tool action
tool.onMouseDown = function (event) {
  // Deselect previous paths:
  // if (path) {
  //   path.selected = false;
  // }

  // if (window.mode == "undo") {
  //   pat;
  // }

  path = new Path({
    segments: [event.point],
    strokeColor: penColor,
    // Select the path, so we can see its segment points:
    // fullySelected: true,
    selectedColor: penColor,
    strokeWidth: penWidth,
  });
};

// While the user drags the mouse, points are added to the path
// at the position of the mouse:
tool.onMouseDrag = function (event) {
  // Reset the undo state for every draw
  // This lets the user undo many times within a drawing session
  window.globals.state.undoOffset = 0;

  if (event.delta.x === 1) {
    return;
  }

  path.add(event.point);
  // console.log("DELTA ", event.delta, "POINT ", event.point);

  path.strokeWidth = penWidth;
  path.strokeCap = "round";

  // Update the content of the text item to show how many
  // segments it has:
  // textItem.content = 'Segment count: ' + path.segments.length;
};

// When the mouse is released, we simplify the path:
tool.onMouseUp = function (event) {
  var segmentCount = path.segments.length;

  // When the mouse is released, simplify it:
  path.smooth();
  path.simplify(10);
  path.strokeColor = penColor;

  // Select the path, so we can see its segments:
  path.fullySelected = false;

  var newSegmentCount = path.segments.length;
  var difference = segmentCount - newSegmentCount;
  var percentage = 100 - Math.round((newSegmentCount / segmentCount) * 100);
  // textItem.content = difference + ' of the ' + segmentCount + ' segments were removed. Saving ' + percentage + '%';

  // Save to local on every draw
  var drawing = paper.project.exportJSON();
  // console.log("Export \n", drawing);
  // localStorage.setItem("drawing", drawing);
  // console.log("Active layer\n", paper.project.activeLayer);
};

//Listen for SHIFT-P to save content as SVG file.
tool.onKeyUp = function (event) {
  if (event.character == "P") {
    downloadAsSVG();
  }
};

globals.downloadAsSVG = downloadAsSVG;

// Global functions call in HTML
function undoPath() {
  // Increment the offset
  window.globals.state.undoOffset = window.globals.state.undoOffset + 1;
  var offSetState = window.globals.state.undoOffset;
  var strokeCount = paper.project.activeLayer.children.length;

  // Don't let the offset climb higher than ammount of
  // current strokes
  if (offSetState === strokeCount) {
    window.globals.state.undoOffset = 0;
  } else {
    console.log(
      "Undo the path:",
      "offSetState",
      offSetState,
      "strokeCount",
      strokeCount
    );

    var pathToUndo =
      paper.project.activeLayer.children[strokeCount - offSetState];

    // Hide the path
    // Using opacity
    pathToUndo.opacity = 0;
  }
}

globals.undoPath = undoPath;

// Global functions call in HTML
function redoPath() {
  var offSetState = window.globals.state.undoOffset;
  var strokeCount = paper.project.activeLayer.children.length;
  var pathToRedo =
    paper.project.activeLayer.children[strokeCount - offSetState];

  pathToRedo.opacity = 1;

  // Decrement the offset
  window.globals.state.undoOffset = window.globals.state.undoOffset - 1;

  // Increment the offset
  // window.globals.state.undoOffset = window.globals.state.undoOffset + 1;
  // var offSetState = window.globals.state.undoOffset;
  // var strokeCount = paper.project.activeLayer.children.length;
  // Don't let the offset climb higher than ammount of
  // current strokes
  // if (offSetState === strokeCount) {
  //   window.globals.state.undoOffset = 0;
  // } else {
  //   console.log(
  //     "Undo the path:",
  //     "offSetState",
  //     offSetState,
  //     "strokeCount",
  //     strokeCount
  //   );
  //   var pathToUndo =
  //     paper.project.activeLayer.children[strokeCount - offSetState];
  //   // Hide the path
  //   // Using opacity
  //   pathToUndo.opacity = 0;
  // }
}

globals.redoPath = redoPath;

function downloadAsSVG(fileName) {
  if (!fileName) {
    fileName = "picture.svg";
  }

  var url =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(paper.project.exportSVG({ asString: true }));
  console.log(url);

  var link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
}

globals.deleteDrawing = deleteDrawing;

function deleteDrawing(fileName) {
  // Wipe the undo state
  window.globals.state.offSet = 0;

  project.clear();
  // If project is cleared, then always initPaper after
  initPaper();
}

// CLIPBOARD

function fallbackCopyTextToClipboard(e, data) {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand("copy");
    var msg = successful ? "successful" : "unsuccessful";
    console.log("Fallback: Copying text command was " + msg);
  } catch (err) {
    console.error("Fallback: Oops, unable to copy", err);
  }

  document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }

  var encodedSVG = encodeURIComponent(text);
  // console.log(encodedSVG);

  var clipboardItems = [
    new ClipboardItem({
      "image/png": new Blob([text], { type: "image/png" }),
    }),
  ];

  //   navigator.clipboard.writeText(text).then(
  navigator.clipboard.write(clipboardItems).then(
    function () {
      console.log("Async: Copying to clipboard was successful!");
    },
    function (err) {
      console.error("Async: Could not copy text: ", err);
    }
  );
}

document.addEventListener("copy", function (event) {
  //   var svg = paper.project.exportSVG({ asString: true });

  paper.view.element.toBlob(function (blob) {
    copyTextToClipboard(blob);
  });

  event.preventDefault();
});

globals.copyAsPNG = copyAsPNG;

function copyAsPNG() {
  paper.view.element.toBlob(function (blob) {
    copyTextToClipboard(blob);
  });
}
