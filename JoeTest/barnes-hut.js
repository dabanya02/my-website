let gl;
let program;

let render;
let context;
// external node, or body index
let eNodeIndex;
// internal node, or bhnode index
let iNodeIndex;

async function main() {

	let slider = document.getElementById("slider");
	let output = document.getElementById("output");
	let button = document.getElementById("start");

	let canvas = document.querySelector("#webgl");
	context = canvas.getContext('2d');
	// gl = canvas.getContext("webgl2");
	// if (!gl) {
	// 	alert("Failed to get gl context");
	// }

	const gpu = new GPU();

	// quotient s/d: s is the width of the target external node, d is the distance. If s/d < sigma, use the approximation 

	// Each node elemnt uses 12 elements in the array. 
	// 0:  Total mass. 0 if an empty node. 	
	// 1:  X com	
	// 2:  Y com
	// 3:  child topleft. All of these will be negative if the child is a leaf node
	// 4:  child topright	
	// 5:  child bottomleft	
	// 6:  child bottomright
	// 7:  upper bound
	// 8:  lower bound
	// 9:  left bound 
	// 10: right bound
	// 11: current body index. 0 if does not exist

	// If a leaf node, the data structure is instead organized as follows.
	// 0:  Total mass. 
	// 1:  X com	
	// 2:  Y com
	// 3:  acceleration x
	// 4:  acceleration y
	// 5:  velocity x	
	// 6:  velocity y 

	let objArr = new Array(slider.value).fill(0);
	let nodeArr = new Array(slider.value).fill(0);
	let root = 0;
	eNodeIndex = 1;
	iNodeIndex = 1;
	nodeArr[root + 9] = 1000;
	nodeArr[root + 11] = 1000;

	for (let i = 0; i < slider.value; i++) {
		objArr[eNodeIndex] = -object.mass;
		objArr[eNodeIndex + 1] = location.x;
		objArr[eNodeIndex + 2] = location.y;
		insertObject(root, new Body(randomInt(1000), randomInt(1000), randomInt(50)), nodeArr);
		eNodeIndex += 7;
	}
	console.log(objArr);

	render = gpu.createKernel(function (array) {
		const i = array[(this.thread.x % 1000) + (this.thread.y * 1000)];
		// if (i != null) {
		this.color(i.location.x, i.location.y, 1, 1);
		// }
		// else this.color(0, 0, 0, 1);
	}).setOutput([1000])
		.setGraphical(true);

	for (let i = 0; i < slider.value; i++) {
		// context.beginPath();
		// ctx.arc()
	}
}


// returns a random integer
function randomInt(range) {
	return Math.floor(Math.random() * range);
}

class Body {
	x;
	y;
	mass;

	constructor(x, y, mass) {
		this.x = x;
		this.y = y;
		this.mass = mass;
	}
}

function insertObject(root, object, nodeArr) {

	// m = m1 + m2
	// x = (x1m1 + x2m2) / m
	// y = (y1m1 + y2m2) / m

	nodeArr[root + 1] = (nodeArr[root + 1] * nodeArr[root] + object.x * object.mass) / nodeArr[root] + object.mass;
	nodeArr[root + 2] = (nodeArr[root + 2] * nodeArr[root] + object.y * object.mass) / nodeArr[root] + object.mass;
	nodeArr[root] += object.mass;

	// If the root is empty - insert the body here
	if (nodeArr[root] == object.mass) {
		nodeArr[root + 11] = eNodeIndex;
	}
	// If the node is internal, recurse into the correct quadrant
	else if (nodeArr[root + 11] === 0) {
		if (object.x < nodeArr[root + 9] + (nodeArr[root + 10] - nodeArr[root + 9]) / 2) {
			if (object.y < nodeArr[root + 7] + (nodeArr[root + 8] - nodeArr[root + 7]) / 2) {
				// top left
				if (nodeArr[root + 3] == 0) // empty node
				{
					// Allocate space for new node
					iNodeIndex += 12;
					// Insert object - m, x, y, or children's 0, 1, 2 dealt with
					insertObject(iNodeIndex, object, nodeArr);
					// set pointer
					nodeArr[root + 3] = iNodeIndex;
					// top, 7 
					nodeArr[iNodeIndex + 7] = nodeArr[root + 7];
					// mid, 8
					nodeArr[iNodeIndex + 8] = nodeArr[root + 7] + (nodeArr[root + 8] - nodeArr[root + 7]) / 2;
					// left, 9
					nodeArr[iNodeIndex + 9] = nodeArr[root + 9];
					// mid, 10
					nodeArr[iNodeIndex + 10] = nodeArr[root + 9] + (nodeArr[root + 10] - nodeArr[root + 9]) / 2;
				}
				else // child already allocated, pointer set, only need to change child node
					insertObject(nodeArr[root + 3], object, nodeArr);
			} else {
				// bottom left
				if (nodeArr[root + 5] == 0) // empty node
				{
					iNodeIndex += 12;
					insertObject(iNodeIndex, object, nodeArr);
					nodeArr[root + 5] = iNodeIndex;
					nodeArr[iNodeIndex + 7] = nodeArr[root + 7] + (nodeArr[root + 8] - nodeArr[root + 7]) / 2;
					nodeArr[iNodeIndex + 8] = nodeArr[root + 8];
					nodeArr[iNodeIndex + 9] = nodeArr[root + 9];
					nodeArr[iNodeIndex + 10] = nodeArr[root + 9] + (nodeArr[root + 10] - nodeArr[root + 9]) / 2;
				}
				else insertObject(nodeArr[root + 5], object, nodeArr);
			}
		} else {
			if (object.y < nodeArr[root + 7] + (nodeArr[root + 8] - nodeArr[root + 7]) / 2) {
				// top right
				if (nodeArr[root + 4] == 0) // empty node
				{
					iNodeIndex += 12;
					insertObject(iNodeIndex, object, nodeArr);
					nodeArr[root + 4] = iNodeIndex;
					nodeArr[iNodeIndex + 7] = nodeArr[root + 7];
					nodeArr[iNodeIndex + 8] = nodeArr[root + 7] + (nodeArr[root + 8] - nodeArr[root + 7]) / 2;
					nodeArr[iNodeIndex + 9] = nodeArr[root + 9] + (nodeArr[root + 10] - nodeArr[root + 9]) / 2;
					nodeArr[iNodeIndex + 10] = nodeArr[root + 10];
				}
				else insertObject(nodeArr[root + 4], object, nodeArr);
			} else {
				// bottom right
				if (nodeArr[root + 6] == 0) // empty node
				{
					iNodeIndex += 12;
					insertObject(iNodeIndex, object, nodeArr);
					nodeArr[root + 6] = iNodeIndex;
					nodeArr[iNodeIndex + 7] = nodeArr[root + 7] + (nodeArr[root + 8] - nodeArr[root + 7]) / 2;
					nodeArr[iNodeIndex + 8] = nodeArr[root + 8];
					nodeArr[iNodeIndex + 9] = nodeArr[root + 9] + (nodeArr[root + 10] - nodeArr[root + 9]) / 2;
					nodeArr[iNodeIndex + 10] = nodeArr[root + 10];
				}
				else insertObject(nodeArr[root + 6], object, nodeArr);
			}
		}
	} else { // The node already contains a child (it is an external node). In this case, we need to further subdivide. 
		
	}

}

window.onload = main;
