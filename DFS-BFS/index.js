// Constants
const SCREEN = {
    HEIGHT: document.documentElement.clientHeight,
    WIDTH: document.documentElement.clientWidth,
}
const COLOR_BLACK = 'black';
const COLOR_BLUE = 'blue';
const COLOR_RED = 'red';
const COLOR_GREEN = 'green';

const COLOR = {
    BLACK: COLOR_BLACK, 
    BLUE: COLOR_BLUE, 
    RED: COLOR_RED, 
    GREEN: COLOR_GREEN
}

const SEARCH_MODE = {
    DFS: 'DFS',
    BFS: 'BFS'
}

// Config
const boardConfig = {
    node: {
        radius: 10,
        inactiveColor: COLOR.BLACK,
        activeColor: COLOR.BLUE,
    },
    edge: {
        width: 2,
        inactiveColor: COLOR.BLACK,
        activeColor: COLOR.BLUE
    },
    // Note: padding depends on node radius
    treeHeight: 5,
    searchMode: SEARCH_MODE.DFS,
    padding: 10 + 20,
    nodeIdColor: COLOR.RED,
    haltDurationMS: 500,
    shortestPathColor: COLOR.GREEN,
}

const boardDimensions = {
    x1: 0 + boardConfig.padding,
    y1: 0 + boardConfig.padding,
    x2: SCREEN.WIDTH - boardConfig.padding,
    y2: SCREEN.HEIGHT - boardConfig.padding,
}

// Utils
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
    constructor(id, x, y, onClick) {
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
        this.fill = boardConfig.edge.inactiveColor;
        this.edge.style.strokeWidth = boardConfig.edge.width;
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
        this.edges = {};
        this.targetNode = null;
        this.init();
    }

    init() {
        this.height = boardConfig.treeHeight;
        this.nodes = Array((2 ** (this.height + 1)) - 1).fill(0);

        // Node onclick function
        const onNodeClick = (node) => {
            if(!this.targetNode) {
                this.setDestination(node);
            }
        }

        this.populateNodes(0, boardDimensions.x1, boardDimensions.x2, boardDimensions.y1, onNodeClick);
        for(let i = 0; i < this.nodes.length; i++) {
            const parent = this.nodes[i];
            const leftChild = this.nodes[(i * 2) + 1];
            const rightChild = this.nodes[(i * 2) + 2];
            if(leftChild) {
                this.edges[parent.id][leftChild.id] = new Edge(parent, leftChild, this.container);
            }
            if(rightChild) {
                this.edges[parent.id][rightChild.id] = new Edge(parent, rightChild, this.container);
            }
            parent.render(this.container);
        }
    }

    populateNodes(id, x1, x2, y, onClick) {
        if(id >= this.nodes.length) {
            return;
        }
        this.nodes[id] = new Node(id, ((x1 + x2) / 2), y, onClick);
        // create an entry for this node's edges
        this.edges[id] = {};
        const delY = (boardDimensions.y2 - boardDimensions.y1) / this.height;
        this.populateNodes((id * 2) + 1, x1, ((x1 + x2) / 2), y + delY, onClick);
        this.populateNodes((id * 2) + 2, ((x1 + x2) / 2), x2, y + delY, onClick);
    }

    setDestination(node) {
        this.targetNode = node;
        node.fill = COLOR.RED;
        node.refresh();
    }

    async search() {
        const nodePool = [this.nodes[0]];
        while(nodePool.length > 0) {
            const current = boardConfig.searchMode === SEARCH_MODE.DFS ? nodePool.pop() : nodePool.shift();
            current.fill = boardConfig.node.activeColor;
            current.refresh();
            const parent = this.nodes[Math.floor((current.id - 1) / 2)];

            if(parent) {
                this.edges[parent.id][current.id].fill = boardConfig.edge.activeColor;
                this.edges[parent.id][current.id].refresh();
            }
            if(current.is(this.targetNode)) {
                current.fill = COLOR.GREEN;
                current.refresh();
                break;
            }
            const leftChild = this.nodes[(current.id * 2) + 1];
            const rightChild = this.nodes[(current.id * 2) + 2];
            // Note: i know it's a complete tree and if leftChild is present, the right one would also be
            if(leftChild) {
                nodePool.push(leftChild);
            }
            if(rightChild) {
                nodePool.push(rightChild);
            }
            await new Promise((resolve) => setTimeout(resolve, boardConfig.haltDurationMS));
        }
    }

    reset() {
        this.container.innerHTML = '';
        this.targetNode = null;
        this.init();
    }

    start() {
        if(!this.targetNode) {
            alert('Please select the target')
        } else {
            this.search();
        }
    }
}
