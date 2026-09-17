class PlotStateManager {

    constructor() {
        this.STATE_KEY = "plotState";
    }

    hasSavedState() {
        return localStorage.getItem(this.STATE_KEY) !== null;
    }

    save(data, clusters/*, undoStack*/) {

        console.log("INSIDE SAVE:");
    console.log(
        data.map(d => ({
            label:d.label,
            x:d.screenX,
            y:d.screenY
        }))
    );

        const safeData = data.map(d => ({
            label: d.label,
            x: d.x,
            y: d.y,
            screenX: d.screenX,
            screenY: d.screenY
        }));
    
        const safeClusters = clusters.map(c => ({
            id: c.id,
            points: c.points,
            labels: c.nodes.map(n => n.label)
        }));

        const safeUndoStack = undoStack.map(action => {
            if (action.type === "move") {
                return {
                    type: "move",
                    label: action.node?.label ?? action.label,
                    //label: action.node.label,
                    from: action.from,
                    to: action.to
                };
            }

            if (action.type === "cluster") {
                return {
                    type:"cluster",
                    clusterId: action.clusterId
                };
            }
        });
    
        console.log("Saving undoStack:", undoStack);
       
        localStorage.setItem(this.STATE_KEY, JSON.stringify({
            data: safeData,
            clusters: safeClusters,
            undoStack: safeUndoStack,
            clusterId: clusterId
        })
    );
    console.log("Saved state:", JSON.parse(localStorage.getItem("plotState")));
    }

    load() {

        const state = localStorage.getItem(this.STATE_KEY);

        return state ? JSON.parse(state) : null;

    }

    clear() {
        localStorage.removeItem(this.STATE_KEY);
    }

}

const plotStateManager = new PlotStateManager();