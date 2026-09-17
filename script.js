let undoStack = [];
console.log("INIT undoStack:", undoStack);

const svg = d3.select("#plot");
const width = 600;
const height = 600;
const GRID_COLS = 6;
const GRID_ROWS = 6;
svg
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet");

// layer 
const gridLayer = svg.append("g");
const clusterLayer = svg.append("g");
const nodeLayer = svg.append("g");

// global variables
let clusters = [];
let currentPath = [];
let clusterId = 0;
let drawing = false;
let tempPath = null;
let data;
let xScale, yScale;

function persistState() {
  console.log("PERSISTING:");
    console.log(
        data.map(d => ({
            label:d.label,
            x:d.screenX,
            y:d.screenY
        }))
    );

    console.log("CLUSTERS:", clusters);
    plotStateManager.save(data, clusters);
    console.log(
      "LOCAL STORAGE AFTER SAVE:",
      JSON.parse(localStorage.getItem("plotState"))
  );
} 

let selectedCluster = null;
let ignore = false;

// color-blind palette compliant 
// 6 colors since max 12 input words can be inserted
const clusterColors = getComputedStyle(document.documentElement)
    .getPropertyValue("--clusters")
    .split(",")
    .map(color => color.trim());

function drawGrid() {

  gridLayer.selectAll("*").remove();

  const verticalLines =
    d3.range(GRID_COLS + 1);

  const horizontalLines =
    d3.range(GRID_ROWS + 1);

  // vertical lines
  gridLayer
    .selectAll(".v-grid")
    .data(verticalLines)
    .enter()
    .append("line")
    .attr("class", "v-grid")
    .attr("x1", d => d * width / GRID_COLS)
    .attr("y1", 0)
    .attr("x2", d => d * width / GRID_COLS)
    .attr("y2", height);

  // horizontal lines
  gridLayer
    .selectAll(".h-grid")
    .data(horizontalLines)
    .enter()
    .append("line")
    .attr("class", "h-grid")
    .attr("x1", 0)
    .attr("y1", d => d * height / GRID_ROWS)
    .attr("x2", width)
    .attr("y2", d => d * height / GRID_ROWS);
}

function drawPlot(data) {

  drawGrid();

  clusterLayer.selectAll("*").remove();
  nodeLayer.selectAll("*").remove();

  xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.x))
    .range([50, width - 50]);

  yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.y))
    .range([height - 50, 50]);

  const paddingX1 = 10;  
  data.forEach(d => {
    if (d.screenX == null || d.screenY == null) {
        d.screenX = xScale(d.x);
        d.screenY = yScale(d.y);
      }
      d.boxWidth = d.label.length * 8 + paddingX1 * 2;
  });
      
  const nodes = nodeLayer.selectAll("g")
    .data(data, d => d.label)
    .enter()
    .append("g")
    .attr("transform", d => `translate(${d.screenX},${d.screenY})`)
    .call(
      d3.drag()
    
        .on("start", function(event, d) {

          d.startX = d.screenX;
          d.startY = d.screenY;
    
          // current position of group
          const transform = d3.select(this).attr("transform");
    
          const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
    
          d.currentX = parseFloat(match[1]);
          d.currentY = parseFloat(match[2]);
    
          // store cursor offset
          d.offsetX = event.x - d.currentX;
          d.offsetY = event.y - d.currentY;
        })
    
        .on("drag", function(event, d) {

         
    
          // compute corrected position
          let newX = event.x - d.offsetX;
          let newY = event.y - d.offsetY;
    
          // constrain inside plot
          const halfWidth = d.boxWidth / 2;

          newX = Math.max(halfWidth, Math.min(width - halfWidth, newX));
          newY = Math.max(20, Math.min(height - 20, newY));

          // store latest word label position when moved to another position
          d.screenX = newX;
          d.screenY = newY;
    
          d3.select(this)
            .attr("transform", `translate(${newX},${newY})`);
        })

        .on("end", function(event, d) {
          checkCluster();
          const transform = d3.select(this).attr("transform");
          const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
      
          if (match) {
              d.screenX = parseFloat(match[1]);
              d.screenY = parseFloat(match[2]);
          }

          if(d.startX !== d.screenX || d.startY !== d.screenY) {
    
              undoStack.push({
                type:"move",
                label: d.label,
                //node:d,
                from:{
                    x:d.startX,
                    y:d.startY
                },
                to:{
                    x:d.screenX,
                    y:d.screenY
                }
            }); 
        }
        console.log("SAVE CHECK:", data.map(d => ({ label: d.label, x: d.screenX, y: d.screenY })));
        persistState();
        console.log("SAVING TO LOCALSTORAGE:", JSON.parse(localStorage.getItem("plotState")));
        }) 
    );

  const paddingX = 10;  
  nodes.append("rect")
    .attr("class", "label-box")
    .attr("x", d => -(d.label.length * 4) - paddingX)
    .attr("y", -15)
    .attr("width", d => d.label.length * 8 + paddingX * 2)
    .attr("height", 25)
    .attr("rx", 9)
    .attr("ry", 9);

  nodes.append("text")
    .attr("class", "label-text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(d => d.label);

    enableLasso();
    enableMenu();      
}


// cyclic check whether cluster contains labels (if empty, then cluster disappears)
function checkCluster() {
  clusters = clusters.filter(cluster => {
    const labelInCluster = data.filter (d => 
      d3.polygonContains(
        cluster.points,
        [d.screenX, d.screenY]
      )
    );
    if (labelInCluster.length === 0) {
      cluster.path.remove();
      return false;
    }

    return true;
  });
}


svg.on("click.clusterSelection", function(event) {
  if (drawing) return;
  if (ignore) {
    ignore = false;
    return;
  }
  const [x, y] = d3.pointer(event);
  const c = selectClickedCluster(x, y);
  if (!c) {
    return;
  }
  console.log(c);
  clickCluster(event, c.path);
});

const lineGenerator = d3.line().curve(d3.curveNatural);

function restoreClusters(savedClusters) {

  savedClusters.forEach(saved => {

      // recreate SVG path
      const path = clusterLayer.append("path")
          .attr("fill", "hsla(0,0%,0%,0.05)")
          .attr("stroke", clusterColors[clusters.length % clusterColors.length])
          .attr("stroke-width", 4)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", lineGenerator(saved.points));

      // find the nodes again
      const selectedNodes = data.filter(d =>
          saved.labels.includes(d.label)
      );

      // recreate cluster object
      clusters.push({
          id: saved.id,
          points: saved.points,
          path: path,
          nodes: selectedNodes
      });

  });

  clusterId = clusters.length;

}

// lasso selection to draw cluster
function enableLasso() {

  svg.on("mousedown", function(event) {
    // only background drawing 
    if (event.target.tagName === "text" || event.target.tagName === "rect") return;

    drawing = true;
    currentPath = [];
    const [x, y] = d3.pointer(event);
    currentPath.push([x, y]);

    tempPath = clusterLayer.append("path")
      .attr("fill", "hsla(0, 0.00%, 0.00%, 0.05)")
      .attr("stroke", clusterColors[clusters.length % clusterColors.length])
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round");

      event.preventDefault();
  });

  svg.on("mousemove", function(event) {
    if (!drawing) return;
    const [x, y] = d3.pointer(event);
    currentPath.push([x, y]);
    tempPath.attr("d", lineGenerator(currentPath));
  });

  svg.on("mouseup", function() {

    if (!drawing) return;
    drawing = false;

    // require enough points
    if (currentPath.length < 10) {
      tempPath.remove();
      return;
    }

    // logic to discard unclosed clusters
    const start = currentPath[0];
    const end = currentPath[currentPath.length - 1];

    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const euclideanDist = Math.sqrt(dx*dx + dy*dy);

    const THRESHOLD = 30;
    if (euclideanDist > THRESHOLD) {
      tempPath.remove();
      return;
    }

    // auto-close shape
    currentPath.push(currentPath[0]);
    tempPath.attr("d", lineGenerator(currentPath)); 

    const selectedNodes = data.filter(d => {
      return d3.polygonContains(
        currentPath,
        [d.screenX, d.screenY]
      );
    });

    // discard cluster if drawing an empty one
    if (selectedNodes.length === 0) {
      tempPath.remove();
      return;
    } 

    const cluster = {
        id: "C" + clusterId++,
        points: currentPath,
        path: tempPath,
        nodes: selectedNodes
    };
  
  clusters.push(cluster);
  
  undoStack.push({
    type:"cluster",
    clusterId: cluster.id
  });
  persistState();
    ignore = true;
    
  });
  
}  

function undo(){
  console.log("UNDO CLICKED");
  console.log("CURRENT undoStack:", undoStack);

  if(undoStack.length===0) return;

  const action=undoStack.pop();

  switch(action.type){

      case "move":

      const node = data.find(d => d.label === action.label);

      node.screenX = action.from.x;
      node.screenY = action.from.y;

      nodeLayer.selectAll("g")
    .filter(d => d.label === action.label)
    .attr(
        "transform",
        `translate(${action.from.x},${action.from.y})`
    );

          checkCluster();
          persistState();

          break;

      case "cluster":

          const clusterToRemove = clusters.find(
            c => c.id === action.clusterId
          );

          if(clusterToRemove){

            clusterToRemove.path.remove();
    
            clusters = clusters.filter(
                c => c.id !== action.clusterId
            );
    
          }
          persistState();

          break;

  }

}

function restoreView() {

  data.forEach(d => {
    d.screenX = xScale(d.x);
    d.screenY = yScale(d.y);
  });

  drawPlot(data);
  restoreClusters([]);
  clusters = [];
  undoStack = [];
  persistState();

}

function goTo() {
  persistState();

  console.log(
      "STATE BEFORE LEAVING",
      JSON.parse(localStorage.getItem("plotState"))
  );

  document.querySelector(".hub-container")
  .classList.remove("hidden");
  
}
// document.getElementById("undo-btn").addEventListener("click",undo);
document.addEventListener("keydown", (event) => {
  if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undo();
  }
});

function smallestArea(points) {
  let area = 0;
  for (let i = 0; i < points.length-1; i++) {
    area +=
      points[i][0] * points[i + 1][1]
      - points[i + 1][0] * points[i][1];
  }
  return Math.abs(area/2);
}

function selectClickedCluster(x, y) {
  const c = clusters.filter(cluster =>
    d3.polygonContains(cluster.points, [x, y])
  );
  if (c.length === 0) {
    return null;
  }
  c.sort(
    (a, b) =>
      smallestArea(a.points) - smallestArea(b.points)
  );

  return c[0];
}


function clickCluster(event, cluster) {
    event.stopPropagation();
  
    clusterLayer.selectAll("path")
      .attr("stroke-width", 4);
  
    selectedCluster = cluster;
    selectedCluster.attr("stroke-width", 6);
  
    const menu = document.getElementById("cluster-menu");
  
    const rect = svg.node().getBoundingClientRect();
  
    menu.style.display = "block";
    menu.style.left = `${event.clientX + 10}px`;
    menu.style.top  = `${event.clientY + 10}px`;
  }

function enableMenu() {
  document
.getElementById("delete-cluster")
.addEventListener("click", function() {

    if (selectedCluster) {

        clusters = clusters.filter(
            c => c.path !== selectedCluster
        );

        selectedCluster.remove();
        selectedCluster = null;

        persistState();

    }

    document
    .getElementById("cluster-menu")
    .style.display = "none";

});


  document
    .getElementById("close-menu")
    .addEventListener("click", function() {
      if (selectedCluster) {
        selectedCluster
          .attr("stroke-width", 4);
        selectedCluster = null;  
      }

    document
      .getElementById("cluster-menu")
      .style.display = "none"
  });

document
  .getElementById("not-delete-cluster")
  .addEventListener("click", function() {
  if (selectedCluster) {
    selectedCluster
      .attr("stroke-width", 4);
    selectedCluster = null;  
  }

  document
    .getElementById("cluster-menu")
    .style.display = "none"
});
  
svg.on("click", function(event) {
  if (event.target === svg.node()) {
    clusterLayer.selectAll("path")
      .attr("stroke-width", 4);
    selectedCluster = null;

  document
    .getElementById("cluster-menu")
    .style.display = "none";
  }
});

}


