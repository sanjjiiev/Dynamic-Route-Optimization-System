class Node {
    constructor(data, x, y) {
        this.data = data;
        this.x = x;
        this.y = y;
        this.connections = [];
        this.distances = {};
        this.trafficDistances = {};
    }

    setPointer(toPoint, distance) {
        this.connections.push(toPoint);
        this.distances[toPoint.data] = distance;

        // Add random traffic to distance
        const trafficFactor = Math.random() * 0.5 + 0.75;  // Traffic factor between 0.75 and 1.25
        this.trafficDistances[toPoint.data] = distance * trafficFactor;
    }
}

class MinHeap {
    constructor() {
        this.nodes = [];
    }

    insert(node, priority) {
        this.nodes.push({ node, priority });
        this.heapify_up();
    }

    heapify_up() {
        let index = this.nodes.length - 1;
        const element = this.nodes[index];
        while (index > 0) {
            let parentIndex = Math.floor((index - 1) / 2);
            let parent = this.nodes[parentIndex];
            if (element.priority >= parent.priority) break;
            this.nodes[index] = parent;
            index = parentIndex;
        }
        this.nodes[index] = element;
    }

    extractMin() {
        const min = this.nodes[0];
        const end = this.nodes.pop();
        if (this.nodes.length > 0) {
            this.nodes[0] = end;
            this.heapify_down();
        }
        return min.node;
    }

    heapify_down() {
        let index = 0;
        const length = this.nodes.length;
        const element = this.nodes[0];
        while (true) {
            let leftChildIndex = 2 * index + 1;
            let rightChildIndex = 2 * index + 2;
            let leftChild, rightChild;
            let swap = null;

            if (leftChildIndex < length) {
                leftChild = this.nodes[leftChildIndex];
                if (leftChild.priority < element.priority) {
                    swap = leftChildIndex;
                }
            }

            if (rightChildIndex < length) {
                rightChild = this.nodes[rightChildIndex];
                if (
                    (swap === null && rightChild.priority < element.priority) ||
                    (swap !== null && rightChild.priority < leftChild.priority)
                ) {
                    swap = rightChildIndex;
                }
            }

            if (swap === null) break;
            this.nodes[index] = this.nodes[swap];
            index = swap;
        }
        this.nodes[index] = element;
    }

    isEmpty() {
        return this.nodes.length === 0;
    }
}

class Graph {
    constructor() {
        this.nodes = [];
    }

    insert(data, x, y, arr = null) {
        const n = new Node(data, x, y);
        this.nodes.push(n);
        if (arr) {
            for (let i = 0; i < arr.length; i++) {
                const a = this.find(arr[i]);
                if (a) {
                    const distance = this.calculateDistance(n, a);
                    n.setPointer(a, distance);
                    a.setPointer(n, distance);
                }
            }
        }
    }

    find(d) {
        return this.nodes.find(node => node.data === d);
    }

    calculateDistance(node1, node2) {
        const dx = node1.x - node2.x;
        const dy = node1.y - node2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    dijkstra(startNode, endNode, useTraffic = false) {
        const distances = {};
        const previous = {};
        const heap = new MinHeap();

        this.nodes.forEach(node => {
            distances[node.data] = Infinity;
        });
        distances[startNode.data] = 0;

        heap.insert(startNode, 0);

        while (!heap.isEmpty()) {
            const currentNode = heap.extractMin();

            if (currentNode === endNode) break;

            currentNode.connections.forEach(neighbor => {
                const altDistance = distances[currentNode.data] + (useTraffic
                    ? currentNode.trafficDistances[neighbor.data]
                    : currentNode.distances[neighbor.data]);

                if (altDistance < distances[neighbor.data]) {
                    distances[neighbor.data] = altDistance;
                    previous[neighbor.data] = currentNode;
                    heap.insert(neighbor, altDistance);
                }
            });
        }

        const path = [];
        let currentNode = endNode;
        while (currentNode) {
            path.unshift(currentNode);
            currentNode = previous[currentNode.data];
        }
        return path;
    }

    draw(canvasContext, path = [], trafficPath = []) {
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        this.nodes.forEach(node => {
            node.connections.forEach(connection => {
                canvasContext.beginPath();
                canvasContext.moveTo(node.x * scale + panX, node.y * scale + panY);
                canvasContext.lineTo(connection.x * scale + panX, connection.y * scale + panY);

                if (path.includes(node) && path.includes(connection)) {
                    canvasContext.strokeStyle = 'blue'; // Shortest path without traffic
                    canvasContext.lineWidth = 4;
                } else if (trafficPath.includes(node) && trafficPath.includes(connection)) {
                    canvasContext.strokeStyle = 'green'; // Shortest path with traffic
                    canvasContext.lineWidth = 4;
                } else {
                    canvasContext.strokeStyle = '#444';
                    canvasContext.lineWidth = 1.5;
                }

                canvasContext.stroke();
            });
        });

        this.nodes.forEach(node => {
            canvasContext.beginPath();
            const radius = 5;  // Small point for the location
            canvasContext.arc(node.x * scale + panX, node.y * scale + panY, radius, 0, 2 * Math.PI);
            canvasContext.fillStyle = '#FF0000'; // Red color for the point
            canvasContext.fill();

            const textYPosition = node.y * scale + panY - 10;
            canvasContext.fillStyle = 'black';
            canvasContext.font = "12px Arial";
            canvasContext.fillText(node.data, node.x * scale + panX - canvasContext.measureText(node.data).width / 2, textYPosition);
        });
    }

    findNearbyNodes(locationNode, radius) {
        return this.nodes.filter(node => {
            const distance = this.calculateDistance(locationNode, node);
            return distance > 0 && distance <= radius; // Exclude the node itself
        });
    }
}

const canvas = document.getElementById("graphCanvas");
canvas.width = 1200;  
canvas.height = 800;  
const ctx = canvas.getContext("2d");

const graph = new Graph();
graph.insert('Sanj', 100, 300);  
graph.insert('New Street', 200, 200, ['Valo Tower']);  
graph.insert('JJ Park', 300, 300, ['Sanj']);  
graph.insert('FK Mall', 400, 200, ['New Street']);  
graph.insert('Valo Tower', 500, 300, ['New Street', 'JJ Park']); 
graph.insert('Hi Bridge', 300, 400, ['Sanj', 'New Street', 'JJ Park']); 

// Adding 50 more places
graph.insert('Central Station', 600, 100, ['FK Mall', 'Valo Tower']); 
graph.insert('Riverbank Park', 700, 200, ['Central Station', 'FK Mall']); 
graph.insert('North Square', 800, 300, ['Riverbank Park', 'Valo Tower']);
graph.insert('South Gate', 100, 400, ['Sanj']);
graph.insert('Library', 150, 150, ['Sanj', 'New Street']);
graph.insert('Museum', 250, 100, ['Library', 'New Street']);
graph.insert('City Hall', 350, 50, ['Museum']);
graph.insert('Hospital', 500, 50, ['City Hall']);
graph.insert('Tech Hub', 600, 50, ['Hospital', 'Central Station']);
graph.insert('Grand Theatre', 400, 400, ['Hi Bridge', 'FK Mall']);
graph.insert('Shopping Plaza', 500, 400, ['Grand Theatre', 'Valo Tower']);
graph.insert('Cinema Complex', 450, 300, ['FK Mall', 'Shopping Plaza']);
graph.insert('University', 200, 500, ['South Gate', 'Hi Bridge']);
graph.insert('City Park', 300, 500, ['University', 'Hi Bridge']);
graph.insert('Downtown', 700, 400, ['Shopping Plaza', 'North Square']);
graph.insert('Old Town', 800, 500, ['Downtown', 'North Square']);
graph.insert('Sports Arena', 900, 600, ['Old Town']);
graph.insert('Bus Terminal', 200, 600, ['City Park']);
graph.insert('Train Station', 400, 600, ['Bus Terminal', 'Grand Theatre']);
graph.insert('Harbor', 1000, 500, ['Old Town']);
graph.insert('West End', 200, 700, ['Bus Terminal']);
graph.insert('East Market', 800, 100, ['Riverbank Park', 'North Square']);
graph.insert('Music Academy', 300, 50, ['City Hall']);
graph.insert('Botanical Garden', 900, 100, ['East Market']);
graph.insert('Art Gallery', 150, 50, ['Music Academy']);
graph.insert('Civic Center', 400, 450, ['Grand Theatre']);
graph.insert('Community Center', 300, 600, ['University']);
graph.insert('Residential Area', 600, 600, ['Shopping Plaza', 'Train Station']);
graph.insert('Zoo', 700, 700, ['Sports Arena', 'Residential Area']);
graph.insert('Airport', 1000, 300, ['Harbor']);
graph.insert('Suburban Town', 100, 750, ['West End']);
graph.insert('Business District', 400, 700, ['Train Station']);
graph.insert('Main Square', 200, 50, ['Art Gallery']);
graph.insert('Golf Course', 900, 700, ['Zoo']);
graph.insert('Beachside', 1100, 400, ['Harbor', 'Airport']);
graph.insert('Metro Station', 600, 700, ['Residential Area']);
graph.insert('Stadium', 900, 400, ['Sports Arena']);
graph.insert('Pier', 1100, 600, ['Beachside']);
graph.insert('Observatory', 700, 100, ['Botanical Garden']);
graph.insert('Fire Station', 300, 100, ['Library']);
graph.insert('Police HQ', 200, 100, ['Fire Station']);
graph.insert('Post Office', 500, 450, ['Civic Center']);
graph.insert('Local Market', 600, 450, ['Post Office', 'Downtown']);
graph.insert('Skate Park', 800, 800, ['Zoo', 'Golf Course']);
graph.insert('Lakeview', 100, 900, ['Suburban Town']);
graph.insert('Mountain Trail', 1200, 500, ['Pier', 'Beachside']);
graph.insert('Waterfall', 1200, 200, ['Mountain Trail', 'Botanical Garden']);
graph.insert('Countryside', 50, 850, ['Lakeview']);
graph.insert('Lighthouse', 1100, 100, ['Botanical Garden', 'Waterfall']);


let scale = 1;
let panX = 0;
let panY = 0;
let startDragOffset = {};
let isDragging = false;

canvas.addEventListener('wheel', function(event) {
    event.preventDefault();
    const zoomSpeed = 0.01;
    if (event.deltaY < 0) {
        scale += zoomSpeed;
    } else {
        scale = Math.max(0.1, scale - zoomSpeed);
    }
    graph.draw(ctx);
});

canvas.addEventListener('mousedown', function(event) {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    startDragOffset.x = event.clientX - panX;
    startDragOffset.y = event.clientY - panY;
});

canvas.addEventListener('mousemove', function(event) {
    if (isDragging) {
        panX = event.clientX - startDragOffset.x;
        panY = event.clientY - startDragOffset.y;
        graph.draw(ctx);
    }
});

canvas.addEventListener('mouseup', function() {
    isDragging = false;
});

// For route visualization:
let selectedNodes = [];
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const clickX = (event.clientX - rect.left - panX) / scale;
    const clickY = (event.clientY - rect.top - panY) / scale;

    graph.nodes.forEach(node => {
        const dx = node.x - clickX;
        const dy = node.y - clickY;
        if (Math.sqrt(dx * dx + dy * dy) < 10) {
            selectedNodes.push(node);
            if (selectedNodes.length === 2) {
                const [start, end] = selectedNodes;
                const shortestPath = graph.dijkstra(start, end, false); 
                const trafficPath = graph.dijkstra(start, end, true); 
                graph.draw(ctx, shortestPath, trafficPath);
                selectedNodes = [];
            }
        }
    });
});

// Clear selection
document.getElementById('clearSelection').addEventListener('click', function() {
    selectedNodes = [];
    graph.draw(ctx);
});

// Show nearby suggestions
document.getElementById('suggestionButton').addEventListener('click', function() {
    const input = document.getElementById('currentLocation').value.toLowerCase();
    const suggestions = document.getElementById('suggestions');
    suggestions.innerHTML = ''; // Clear previous suggestions

    // Find the selected node
    const locationNode = graph.find(input);
    
    if (locationNode) {
        const nearbyNodes = graph.findNearbyNodes(locationNode, 100); // Adjust radius as needed
        nearbyNodes.forEach(node => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = node.data;
            suggestionItem.onclick = () => {
                // Handle suggestion click
                document.getElementById('currentLocation').value = node.data; // Set input field to selected suggestion
                suggestions.innerHTML = ''; // Clear suggestions
                suggestions.style.display = 'none'; // Hide suggestions
            };
            suggestions.appendChild(suggestionItem);
        });

        // Show suggestions if any
        if (suggestions.innerHTML) {
            suggestions.style.display = 'block';
        } else {
            suggestions.style.display = 'none';
        }
    } else {
        suggestions.style.display = 'none';
    }
});

document.getElementById('currentLocation').addEventListener('input', function() {
    const suggestions = document.getElementById('suggestions');
    suggestions.style.display = 'none'; // Hide suggestions when typing
});

// Hide suggestions when clicking outside
document.addEventListener('click', function(event) {
    const suggestions = document.getElementById('suggestions');
    if (!event.target.closest('#currentLocation') && !event.target.closest('#suggestionButton')) {
        suggestions.style.display = 'none';
    }
});

graph.draw(ctx);

document.getElementById('suggestionButton').addEventListener('click', () => {
    const inputValue = document.getElementById('currentLocation').value.trim();
    const locationNode = graph.find(inputValue);
    
    if (locationNode) {
        const nearbyNodes = graph.findNearbyNodes(locationNode, 150);
        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.innerHTML = '';
        nearbyNodes.forEach(node => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');
            suggestionItem.textContent = node.data;
            suggestionItem.addEventListener('click', () => {
                document.getElementById('currentLocation').value = node.data;
                suggestionsDiv.style.display = 'none';
            });
            suggestionsDiv.appendChild(suggestionItem);
        });
        suggestionsDiv.style.display = nearbyNodes.length > 0 ? 'block' : 'none';
    } else {
        alert('Location not found');
    }
});

document.getElementById('clearSelection').addEventListener('click', () => {
    document.getElementById('currentLocation').value = '';
    document.getElementById('suggestions').style.display = 'none';
});
