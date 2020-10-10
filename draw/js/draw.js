var path;

// Set white background color, full width and hieght of canvas
var canvas = document.getElementById("canvas");
var bgPoint, bgSize, bg, bgColor, penColor;

var penWidth = 1.5;

var notionBgColor = "#2f3437";
// var darkMode = false;

var browserTheme =
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

var currentTheme = browserTheme;

// Setting mode state based on bool
var darkMode = browserTheme === "dark" ? true : false;
console.log(darkMode);

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

    // Select background, make dark
    paper.project.activeLayer.firstChild.style = {
      fillColor: notionBgColor,
    };

    // Select all lines, make white
    console.log("DARK MODE");
    darkMode = true;
  }
  if (theme === "light") {
    // Init local vars for newlt cleared drawing
    bgColor = [1, 1, 1];
    penColor = "black";

    if (bg) {
      bg.style = {
        fillColor: new Color(bgColor),
      };
    }

    // Select background, make white
    paper.project.activeLayer.firstChild.style = {
      fillColor: "white",
    };
    // paper.project.activeLayer.children.strokeColor = "black";
    // console.log(paper.project.activeLayer.children);

    var i;
    for (i = 0, i < paper.project.activeLayer.children.length; i++; ) {
      console.log(
        "before\n",
        paper.project.activeLayer.children[i].strokeColor
      );
      paper.project.activeLayer.children[i].strokeColor = "black";
      console.log("after\n", paper.project.activeLayer.children[i].strokeColor);
    }

    // Select all lines, make white
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

tool.onMouseDown = function (event) {
  // Deselect previous paths:
  // if (path) {
  //   path.selected = false;
  // }

  // New black path
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
  path.add(event.point);

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
  console.log("Export \n", drawing);
  localStorage.setItem("drawing", drawing);
  // console.log("Active layer\n", paper.project.activeLayer);
};

//Listen for SHIFT-P to save content as SVG file.
tool.onKeyUp = function (event) {
  if (event.character == "P") {
    downloadAsSVG();
  }
};

globals.downloadAsSVG = downloadAsSVG;

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
  console.log(encodedSVG);

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
