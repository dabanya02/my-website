// Based off of the description of this assignment:
// https://www.cs.princeton.edu/courses/archive/fall03/cs126/assignments/barnes-hut.html

import Vec2 from "./Vec.js"

export class Object {
	location;
	mass;
	velocity;
	acceleration;
	
	constructor(x, y, mass) {
		this.location = new Vec2(x, y);
		this.mass = mass;
		this.velocity = new Vec2(0, 0);
		this.acceleration = new Vec2(0, 0);
	}

	constructor(x, y, mass, velocity, acceleration) {
		this.location = new Vec2(x, y);
		this.mass = mass;
		this.velocity = velocity;
		this.acceleration = acceleration;
	}

	integrateTimestep(time, array) {
		let force = new Vec2(0, 0);
		let totalForce = 0;
		for (obj in array) {
			let distSqrtX = (this.x - x);
			let distSqrtY = (this.y - y);
			totalForce = obj.mass * this.mass / (distSqrtX * distSqrtX + distSqrtY * distSqrtY);
			dir = Math.atan2(distSqrtY, distSqrtX);
			force.x += totalForce * Math.cos(dir);
			force.y += totalForce * Math.sin(dir);
		}
		this.acceleration = Vec2(force.x / this.mass, force.y / this.mass);
		this.velocity = add(this.velocity, scale(time, acceleration));
		this.x += scale(time, this.velocity.x);
		this.y += scale(time, this.velocity.y);
	}
}

class QuadTreeNode {
	childTL;
	childTR;
	childBL;
	childBR;
	hasBody;
	topLeft;
	bottomRight;
	centreOfMass;
	totalMass;

	constructor(topLeft, bottomRight) {
		this.body = null;
		this.hasBody = false;
		this.topLeft = topLeft;
		this.bottomRight = bottomRight;
	}

	insertNode(body) {
		
		// if (this.hasBody) {
		// 	this.hasBody = false;
		// 	if() {
		// 		this.childBL = new QuadTreeNode();
		// 		this.childBL.insertNode(body);
		// 	} else if () {
				
		// 	} else if () {
				
		// 	} else {
				
		// 	}
			
			
		// } else {
		// 	this.body = body;
		// 	this.hasBody = true;
		// 	this.centreOfMass = new Vec2(body.location);
		// 	this.totalMass = body.mass;
		// }
		
	}
}

function buildQuadTree(root) {

}
