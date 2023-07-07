// Constants
const SCREEN = {
    HEIGHT: document.documentElement.clientHeight,
    WIDTH: document.documentElement.clientWidth,
}
const COLOR_BLACK = 'black';
const COLOR_BLUE = 'blue';
const COLOR_RED = 'red';
const COLOR_GREEN = 'green';

const COLOR_LIST = [COLOR_BLACK, COLOR_BLUE, COLOR_RED, COLOR_GREEN];

const COLOR = {
    BLACK: COLOR_BLACK, 
    BLUE: COLOR_BLUE, 
    RED: COLOR_RED, 
    GREEN: COLOR_GREEN
}

const BOARD_STATE = {
    PLAYING: 'playing',
    PAUSED: 'paused'
}

// Config
const boardConfig = {
    node: {
        radius: 10,
        inactiveColor: COLOR.BLACK,
        activeColor: COLOR.BLUE,
        count: 20,
    },
    edge: {
        minPerNode: 1,
        maxPerNode: 5,
        perNode: 1,
        width: 2,
        inactiveColor: COLOR.BLACK,
        activeColor: COLOR.BLUE
    },
    // Note: padding depends on node radius
    padding: 10 + 20,
    nodeIdColor: COLOR.RED,
    haltDurationMS: 1000,
    shortestPathColor: COLOR.GREEN,
}

const boardDimensions = {
    x1: 0 + boardConfig.padding,
    y1: 0 + boardConfig.padding,
    x2: SCREEN.WIDTH - boardConfig.padding,
    y2: SCREEN.HEIGHT - boardConfig.padding,
}
// Utils
function getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getExclusiveRandom(min, max, exclude) {
    const random = getRandomInRange(min, max);
    if(random === exclude) {
        return (random + 1) % max;
    }
    return random;
}

function setObjectField(object, fieldPath, value) {
    const fields = fieldPath.split('.');
    for(let i = 0; i < fields.length; i++) {
        if(i === fields.length - 1) {
            object[fields[i]] = value;
            continue;
        }
        object = object[fields[i]];
    }
}

function updateConfig(fieldPath, value) {
    setObjectField(boardConfig, fieldPath, value);
}
// -------------------------------------------------------------------------------------------

class Node {
    constructor(id, x, y, container, onClick) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.node = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        this.node.setAttribute('cx', x);
        this.node.setAttribute('cy', y);
        this.node.setAttribute('r', boardConfig.node.radius);
        this.node.onclick = () => {
            onClick(this);
        }
        this.fill = boardConfig.node.inactiveColor;

        const text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        text.textContent = id;
        text.setAttribute('x', x);
        text.setAttribute('y', y - boardConfig.node.radius);
        text.setAttribute('fill', 'red');
        container.appendChild(text);
    }

    render(container) {
        container.appendChild(this.node);
    }

    refresh() {
        this.node.setAttribute('fill', this.fill);
    }

    is(otherNode) {
        return this.id === otherNode.id;
    }
}

class Edge {
    constructor(node1, node2, container) {
        this.edge = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        this.edge.setAttribute('x1', node1.x);
        this.edge.setAttribute('y1', node1.y);
        this.edge.setAttribute('x2', node2.x);
        this.edge.setAttribute('y2', node2.y);
        // Cost is the distance between two nodes
        this.cost = Math.sqrt(((node2.x - node1.x) ** 2) + ((node2.y - node1.y) ** 2))
        this.edge.style.strokeWidth = boardConfig.edge.width;
        this.fill = boardConfig.edge.inactiveColor;
        this.edge.style.stroke = this.fill;
        container.appendChild(this.edge);
    }

    refresh() {
        this.edge.style.stroke = this.fill;
    }
}

class Board {
    constructor(container) {
        this.container = container;
        this.state = BOARD_STATE.PAUSED;
        this.init();
    }

    init() {
        this.nodes = {};
        this.edges = {};
        this.sourceNode = null;
        this.destinationNode = null;

        // Node onclick function
        const onNodeClick = (node) => {
            if(!this.sourceNode) {
                this.setSource(node);
            } else if(!this.destinationNode) {
                this.setDestination(node);
            }
        }

        // Note: Rendering edges first is important or edges will overlap nodes
        // Store node instances
        for(let id = 0; id < boardConfig.node.count; id++) {
            const cx = getRandomInRange(boardDimensions.x1, boardDimensions.x2);
            const cy = getRandomInRange(boardDimensions.y1, boardDimensions.y2);
            this.nodes[id] = new Node(id, cx, cy, this.container, onNodeClick);
        }

        // Render edges
        for(const nodeId in this.nodes) {
            for(let i = 0; i < boardConfig.edge.perNode; i++) {
                // const otherNodeId = (new Number(nodeId) + 1) % boardConfig.node.count;
                const otherNodeId = getExclusiveRandom(0, boardConfig.node.count, Number(nodeId));
                const edge = new Edge(this.nodes[nodeId], this.nodes[otherNodeId], this.container);
                this.edges[nodeId] = this.edges[nodeId] ? this.edges[nodeId] : {};
                this.edges[otherNodeId] = this.edges[otherNodeId] ? this.edges[otherNodeId] : {};
                this.edges[nodeId][otherNodeId] = edge;
                this.edges[otherNodeId][nodeId] = edge;
            }
        }

        // Render stored node instances
        for(const nodeId in this.nodes) {
            this.nodes[nodeId].render(this.container);
        }
    }

    refresh() {
        this.container.innerHTML = '';
        this.init();
    }

    setSource(node) {
        this.sourceNode = node;
        node.fill = COLOR.GREEN;
        node.refresh();
    }

    setDestination(node) {
        this.destinationNode = node;
        node.fill = COLOR.RED;
        node.refresh();
    }

    async search() {
        this.state = BOARD_STATE.PLAYING;
        const heap = new MinHeap();
        const visitedNodes = {};
        const costs = {[this.sourceNode.id]: 0};
        let currentNode = this.sourceNode;
        const addedBy = {};
        while(true) {
            if(currentNode.is(this.destinationNode)) {
                currentNode.fill = COLOR.GREEN;
                currentNode.refresh();
                this.highlightPath(addedBy);
                break;
            }
            
            currentNode.fill = COLOR.BLUE;
            currentNode.refresh();
            visitedNodes[currentNode.id] = true;
            
            for(const otherNodeId in this.edges[currentNode.id]) {
                if(otherNodeId in visitedNodes) {
                    continue;
                }
                costs[otherNodeId] = costs[currentNode.id] + this.edges[currentNode.id][otherNodeId].cost;
                addedBy[otherNodeId] = currentNode.id;
                heap.insert(costs[otherNodeId], {
                    edge: this.edges[currentNode.id][otherNodeId],
                    node: this.nodes[otherNodeId]
                });
            }
            const next = heap.pop();
            if(!next) {
                alert('No path found');
                break;
            }
            next.data.edge.fill = COLOR.BLUE;
            next.data.edge.refresh();
            currentNode = next.data.node;
            await new Promise((resolve) => setTimeout(resolve, boardConfig.haltDurationMS))
        }
        this.state = BOARD_STATE.PAUSED;
    }

    highlightPath(map) {
        let currentNode = this.destinationNode;
        while(true) {
            currentNode.fill = boardConfig.shortestPathColor;
            currentNode.refresh();

            const nextNode = this.nodes[map[currentNode.id]];
            if(!nextNode){
                break;
            }
            this.edges[nextNode.id][currentNode.id].fill = boardConfig.shortestPathColor;
            this.edges[nextNode.id][currentNode.id].refresh();

            currentNode = nextNode;
        }
    }

    start() {
        if(!this.sourceNode) {
            alert('Please select the starting point');
        } else if(!this.destinationNode) {
            alert('Please select the destination')
        } else {
            this.search();
        }
    }
}
