const RELATIONSHIP_THRESHOLD = 50;
const PLOT_SIZE = 600;

// Retrieve the state saved from the plot page
const state = plotStateManager.load();
console.log(
    "STATE RECEIVED",
    state
);
let showRepresentatives = false;
const analysisState =
    JSON.parse(localStorage.getItem("analysisState")) || {
        showRepresentatives: false,
        clusterLabels: {}
    };

showRepresentatives = analysisState.showRepresentatives ?? false;
let clusterLabels = analysisState.clusterLabels || {};

function saveAnalysisState() {
    localStorage.setItem(
        "analysisState",
        JSON.stringify({
            showRepresentatives,
            clusterLabels
        })
    );
}

function renderClusterLabels(){

    const container =document.getElementById("clusterLabels");
    container.innerHTML="";

    state.clusters.forEach((cluster,index)=>{
        
        const clusterId = cluster.id;

        const wrapper=document.createElement("div");

        wrapper.className="cluster-label-editor";


        wrapper.innerHTML=`


<label class="cluster">
Cluster ${index+1}
</label>

<div class="label-row">

<input 
type="text"
placeholder="Give this cluster a meaning..."
value="${clusterLabels[clusterId] || ""}"
data-cluster="${clusterId}"
>

<button 
class="delete-label"
data-cluster="${clusterId}">
×
</button>

</div>

`;

        container.appendChild(wrapper);
        const input = wrapper.querySelector("input");


input.addEventListener("input", function(){

    const id = this.dataset.cluster;


    clusterLabels[id] = this.value;


    saveAnalysisState();


    drawClusterLabels();

});


    });


}


const width = 600;
const height = 600;

const xScale = d3.scaleLinear()
    .domain(d3.extent(state.data, d => d.x))
    .range([50, width - 50]);


const yScale = d3.scaleLinear()
    .domain(d3.extent(state.data, d => d.y))
    .range([height - 50, 50]);

function getOriginalPosition(node){

    return {
        x: xScale(node.x),
        y: yScale(node.y)
    };

}    

function euclideanDistance(x1, y1, x2, y2) {
    return Math.sqrt(
        Math.pow(x2 - x1, 2) +
        Math.pow(y2 - y1, 2)
    );

}


function drawFinalPlot(svgID, data){

    const width = 600;
    const height = 600;


    const svg = d3.select(svgID)
        .attr(
            "viewBox",
            `0 0 ${width} ${height}`
        )
        .attr(
            "preserveAspectRatio",
            "xMidYMid meet"
        );


    svg.selectAll("*").remove();



    const nodes = svg.selectAll(".word-node")
        .data(data)
        .enter()
        .append("g")
        .attr(
            "class",
            "word-node"
        )
        .attr(
            "transform",
            d => `translate(${d.screenX},${d.screenY})`
        );



    nodes.append("rect")
        .attr("class","label-box")
        .attr(
            "x",
            d => -(d.label.length * 4) - 10
        )
        .attr(
            "y",
            -15
        )
        .attr(
            "width",
            d => d.label.length * 8 + 20
        )
        .attr(
            "height",
            25
        )
        .attr(
            "rx",
            9
        );


    nodes.append("text")
        .attr(
            "class",
            "label-text"
        )
        .attr(
            "text-anchor",
            "middle"
        )
        .attr(
            "dominant-baseline",
            "middle"
        )
        .text(
            d => d.label
        );

        console.log(
            "LOADED POSITIONS",
            state.data.map(d=>({
                label:d.label,
                x:d.screenX,
                y:d.screenY
            }))
        );

}

function computeClusterCentroids(clusters, data){

    let centroids = [];


    clusters.forEach((cluster, index)=>{


        const nodes = data.filter(d =>
            cluster.labels.includes(d.label)
        );


        if(nodes.length === 0){
            return;
        }


        const x =
            nodes.reduce(
                (sum,n)=>sum+n.screenX,
                0
            ) / nodes.length;


        const y =
            nodes.reduce(
                (sum,n)=>sum+n.screenY,
                0
            ) / nodes.length;



        centroids.push({

            id: index + 1,

            x:x,
            y:y,

            words:nodes.map(n=>n.label)

        });


    });


    return centroids;

}


const clusterColors = getComputedStyle(document.documentElement)
    .getPropertyValue("--clusters")
    .split(",")
    .map(color => color.trim());

  function drawMiniClusters(svgID, clusters){

    const svg = d3.select(svgID);

    const lineGenerator = d3.line()
        .curve(d3.curveNatural);


    clusters.forEach((cluster,index)=>{


        const scaledPoints = cluster.points.map(p => [
            p[0] ,
            p[1] 
        ]);


        svg.append("path")
            .attr("d", lineGenerator(scaledPoints))
            .attr("fill","rgba(0,0,0,0.05)")
            .attr("stroke", clusterColors[index % clusterColors.length])
            .attr("stroke-width",3)
        ;

    });

}

function highlightRepresentativeWords(svgID, representatives){

    const svg = d3.select(svgID);


    representatives.forEach(rep => {


        const wordGroup =
            svg.selectAll(".word-node")
                .filter(d => d.label === rep.label);


        wordGroup
            .select("rect")
            .attr(
                "class",
                "representative-label-box"
            );


        wordGroup
            .select("text")
            .attr(
                "class",
                "representative-label-text"
            );


    });

}


function drawClusterLabels(){

    const svg = d3.select("#finalPlot");


    svg.selectAll(".cluster-title-group")
        .remove();


     state.clusters.forEach((cluster,index)=>{
    


        const label =
            clusterLabels[cluster.id];


        let text =
            `${index+1}`;
        
        if(label){
            text += `: ${label}`;
        }


        if(!cluster.points || cluster.points.length===0){
            return;
        }
        const points = cluster.points;


        const topPoint =
            points.reduce(
                (a,b)=> a[1] < b[1] ? a : b
        );  


        const color =
            clusterColors[index % clusterColors.length];


        // approximate text width
        const boxWidth =
            text.length * 8 + 20;


        const boxHeight = 25;



        const group =
            svg.append("g")
                .attr(
                    "class",
                    "cluster-title-group"
                );



        // background label box
        group.append("rect")

            .attr(
                "x",
                topPoint[0] - boxWidth/2
            )

            .attr(
                "y",
                topPoint[1] - boxHeight/2
            )

            .attr(
                "width",
                boxWidth
            )

            .attr(
                "height",
                boxHeight
            )

            .attr(
                "rx",
                9
            )

            .attr(
                "fill",
                getComputedStyle(document.documentElement)
                    .getPropertyValue("--background-color")
            )

            .attr(
                "stroke",
                color
            )

            .attr(
                "stroke-width",
                2
            );



        // text
        group.append("text")

            .attr(
                "class",
                "cluster-title"
            )

            .attr(
                "x",
                topPoint[0]
            )

            .attr(
                "y",
                topPoint[1] 
            )

            .attr(
                "text-anchor",
                "middle"
            )

            .attr(
                "dominant-baseline",
                "middle"
            )

            .text(text);


    });

}


function computeRepresentativeWords(clusters, data){


    let representatives = [];


    clusters.forEach((cluster,index)=>{


        const nodes = data.filter(d =>
            cluster.labels.includes(d.label)
        );


        if(nodes.length === 0){
            return;
        }


        // hidden centroid calculation

        const centroidX =
            nodes.reduce(
                (sum,n)=>sum+n.screenX,
                0
            ) / nodes.length;


        const centroidY =
            nodes.reduce(
                (sum,n)=>sum+n.screenY,
                0
            ) / nodes.length;



        // find closest word

        let closest = null;
        let smallestDistance = Infinity;


        nodes.forEach(node=>{


            const distance =
                Math.sqrt(
                    Math.pow(node.screenX-centroidX,2)
                    +
                    Math.pow(node.screenY-centroidY,2)
                );


            if(distance < smallestDistance){

                smallestDistance = distance;
                closest = node;

            }


        });



        representatives.push({

            cluster:index,

            label:closest.label

        });


    });


    return representatives;

}

if (!state) {

    console.log("No saved state found");

} else {


    console.log("LOADED STATE:");
    console.log(state);

    // Same dimensions used in the D3 plot
    const width = 600;
    const height = 600;


    // Recreate the same coordinate transformation
    // used in drawPlot()
    const xScale = d3.scaleLinear()
        .domain(d3.extent(state.data, d => d.x))
        .range([50, width - 50]);


    const yScale = d3.scaleLinear()
        .domain(d3.extent(state.data, d => d.y))
        .range([height - 50, 50]);



    function computeMovement(data) {

        let movements = [];


        data.forEach(node => {


            // Original position generated by UMAP,
            // converted into SVG pixel coordinates
            const originalX = xScale(node.x);
            const originalY = yScale(node.y);


            // Final position after user interaction
            const finalX = node.screenX;
            const finalY = node.screenY;


            // Euclidean distance
            const distance = Math.sqrt(
                Math.pow(finalX - originalX, 2) +
                Math.pow(finalY - originalY, 2)
            );


            movements.push({
                label: node.label,
                distance: distance
            });

        });


        return movements;
    } 



    const movements = computeMovement(state.data);


    console.log("WORD MOVEMENTS:");
    console.log(movements);

    const MOVEMENT_THRESHOLD = 10;


const movedWords = movements.filter(
    m => m.distance > MOVEMENT_THRESHOLD
);


const totalWords = movements.length;

const movedPercentage =
    (movedWords.length / totalWords) * 100;


const averageMovement =
    movements.reduce(
        (sum, m) => sum + m.distance,
        0
    ) / totalWords;



console.log("ANALYSIS SUMMARY:");

console.log(
    "Moved words:",
    movedWords.length,
    "/",
    totalWords
);


console.log(
    "Moved percentage:",
    movedPercentage.toFixed(2),
    "%"
);


// -----------------------------
// DISPLAY GENERAL INFORMATION
// -----------------------------

document.getElementById("generalInfo").innerHTML = `

<p>
<b>Number of words:</b> ${state.data.length}
</p>

<p>
<b>Number of clusters:</b> ${state.clusters.length}
</p>

<p>
<b>Moved words:</b> ${movedWords.length}/${totalWords}
</p>

`;



// -----------------------------
// DISPLAY CLUSTERS
// -----------------------------

let clusterHTML = "";


 document.getElementById("clusterInfo").innerHTML = `

<label class="switch-container">

<input 
type="checkbox" 
id="showRepresentatives"
>

<span class="repr">
Show representative concepts
</span>

<span class="info-icon">

?

<span class="tooltip-text">

Highlights the word that best represents the main idea of each group.
It helps you notice the concepts that connect the words you placed together.

</span>

</span>

</label>




${clusterHTML}

`; 

const repCheckbox =
    document.getElementById("showRepresentatives");


 if(repCheckbox){
    repCheckbox.checked = showRepresentatives;
} 

}



drawFinalPlot(
    "#finalPlot",
    state.data
);

drawMiniClusters(
    "#finalPlot",
    state.clusters
);

renderClusterLabels();
drawClusterLabels();

document
.getElementById("clusterLabels")
.addEventListener("click", function(event){

    if(event.target.classList.contains("delete-label")){


        const id = event.target.dataset.cluster;


        delete clusterLabels[id];


        saveAnalysisState();


        // only clear this input
        const input =
            event.target.previousElementSibling;

        input.value = "";


        drawClusterLabels();

    }

});

if (showRepresentatives) {

    const representatives =
        computeRepresentativeWords(
            state.clusters,
            state.data
        );

    highlightRepresentativeWords(
        "#finalPlot",
        representatives
    );

}



document
.getElementById("showRepresentatives")
.addEventListener("change", function(){


    showRepresentatives = this.checked;
    saveAnalysisState();


    // remove previous highlights

    d3.select("#finalPlot")
    .selectAll(".word-node")
    .select("rect")
    .attr("class","label-box");


d3.select("#finalPlot")
    .selectAll(".word-node")
    .select("text")
    .attr("class","label-text");



    if(showRepresentatives){


        const representatives =
            computeRepresentativeWords(
                state.clusters,
                state.data
            );


        console.log(
            "Representative words:",
            representatives
        );


        highlightRepresentativeWords(
            "#finalPlot",
            representatives
        );


    }


});
 

const centroids = computeClusterCentroids(state.clusters, state.data);




