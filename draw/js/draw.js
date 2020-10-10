var path;

// Set white background color, full width and hieght of canvas
var canvas = document.getElementById("canvas");
var bgPoint, bgSize, bg, bgColor, penColor;

var penWidth = 1.5;
var darkMode = false;

// Check local storage, import if exsissts

var localDrawing = localStorage.getItem("drawing");
if (localDrawing) {
  console.log("Local drawing found\n", JSON.parse(localDrawing));
  paper.project.importJSON(localDrawing);
}

function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

function initPaper() {
  bgPoint = new Point(0, 0);
  bgSize = new Size(canvas.width, canvas.height);
  bg = new Path.Rectangle(bgPoint, bgSize);

  if (
    (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches) ||
    darkMode
  ) {
    bgColor = "#2f3437";
    penColor = "white";
    console.log("DARK MODE", new Color(bgColor));
    bg.style = {
      fillColor: "#2f3437",
    };
  }

  if (
    (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches) ||
    !darkMode
  ) {
    bgColor = [1, 1, 1];
    penColor = "black";
    bg.style = {
      fillColor: new Color(bgColor),
    };
  }
}
initPaper();

function setColorScheme() {
  // if (darkMode === false) darkMode = true;
  // if (darkMode === true) darkMode = false;
  darkMode = true;
  console.log(darkMode);
  bgColor = "#2f3437";
  penColor = "white";
  // console.log("DARK MODE", new Color(bgColor));
  bg.style = {
    fillColor: "#2f3437",
  };
}

globals.setColorScheme = setColorScheme;

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
  if (path) {
    path.selected = false;
  }

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

  // Save to local

  var drawing = paper.project.exportJSON();
  console.log("Export \n", drawing);
  localStorage.setItem("drawing", drawing);
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

// globals.copyAsSVG = copyAsSVG;

// // In last push
// function copyAsSVGNO() {
//   var data = new DataTransfer();

//   var text =
//     "data:image/svg+xml;utf8," +
//     encodeURIComponent(paper.project.exportSVG({ asString: true }));
//   //   console.log(text);

//   data.items.add(text, "image/svg+xml;utf8");

//   navigator.clipboard.writeText(text).then(
//     function () {
//       alert("COPIED:" + text);
//     },
//     function () {
//       alert("FAILED:" + text);
//     }
//   );
//   //   console.log(data);
// }

// // Catch user's action
// function copyAsSVG() {
//   var svg = encodeURIComponent(paper.project.exportSVG({ asString: true }));
//   // var svg = paper.project.exportSVG({asString:true});
//   // var svg = paper.project.exportSVG();

//   var clipboardData = "data:image/svg+xml;utf8" + svg;
//   console.log(clipboardData);

//   // Overwrite what is being copied to the clipboard.
//   document.addEventListener("copy", function (e) {
//     // e.clipboardData is initially empty, but we can set it to the
//     // data that we want copied onto the clipboard.
//     // e.clipboardData.setData('text/plain', svg);
//     e.preventDefault();

//     try {
//       e.clipboardData.setData(clipboardData);
//     } catch (err) {
//       console.log(err);
//     }
//     // image/svg+xml
//   });
// }

globals.deleteDrawing = deleteDrawing;

function deleteDrawing(fileName) {
  project.activeLayer.removeChildren();
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
