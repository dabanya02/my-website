let speed;
let xy;
let cv;

// set up pointer lock and variables
export function setupControls(transSpeed, mouse, canvas) {
	speed = transSpeed;
	xy = mouse;
	cv = canvas;

	// mouse controls
	canvas.requestPointerLock = canvas.requestPointerLock ||
		canvas.mozRequestPointerLock;

	document.exitPointerLock = document.exitPointerLock ||
		document.mozExitPointerLock;
	canvas.onclick = function () {
		canvas.requestPointerLock();
	}
	document.addEventListener('pointerlockchange', lockChangeInterrupt, false);
	document.addEventListener('mozpointerlockchange', lockChangeInterrupt, false);

	// keyboard
	document.addEventListener('keydown', kbdDownInterrupt);
	document.addEventListener('keyup', kbdUpInterrupt);

	// // controls and stuff
	// let transX = document.getElementById("transX");
	// let transXDisp = document.getElementById("transXDisp");

	// transXDisp.innerHTML = transX.value;
	// transX.oninput = () => {
	// 	transXDisp.innerHTML = transX.value;
	// 	// drawScene();
	// };

	// let transY = document.getElementById("transY");
	// let transYDisp = document.getElementById("transYDisp");

	// transYDisp.innerHTML = transY.value;
	// transY.oninput = () => {
	// 	transYDisp.innerHTML = transY.value;
	// 	// drawScene();
	// };

	// let transZ = document.getElementById("transZ");
	// let transZDisp = document.getElementById("transZDisp");

	// transZDisp.innerHTML = transZ.value;
	// transZ.oninput = () => {
	// 	transZDisp.innerHTML = transZ.value;
	// 	// drawScene();
	// };

	// let rotX = document.getElementById("rotX");
	// let rotXDisp = document.getElementById("rotXDisp");

	// // rotXDisp.innerHTML = rot[0];
	// rotX.oninput = () => {
	// 	rotXDisp.innerHTML = rotX.value;
	// 	// rot[0] = rotX.value;
	// 	// drawScene();
	// };

	// let rotY = document.getElementById("rotY");
	// let rotYDisp = document.getElementById("rotYDisp");

	// // rotYDisp.innerHTML = rot[1];
	// rotY.oninput = () => {
	// 	rotYDisp.innerHTML = rotY.value;
	// 	// rot[1] = rotY.value;
	// 	// drawScene();
	// };

	// let rotZ = document.getElementById("rotZ");
	// let rotZDisp = document.getElementById("rotZDisp");

	// rotZDisp.innerHTML = rotZ.value;
	// rotZ.oninput = () => {
	// 	rotZDisp.innerHTML = rotZ.value;
	// 	// rot[2] = rotZ.value;
	// 	// drawScene();
	// };

	let button = document.getElementById("start");
}

export function updateValues(rot, trans) {
	document.getElementById("transZDisp").innerHTML = "Translate Z: " + trans[2];
	document.getElementById("transYDisp").innerHTML = "Translate Y: " + trans[1];
	document.getElementById("transXDisp").innerHTML = "Translate X: " + trans[0];
	document.getElementById("rotXDisp").innerHTML = "Rotate X: " + rot[0];
	document.getElementById("rotYDisp").innerHTML = "Rotate Y: " + rot[1];
	document.getElementById("rotZDisp").innerHTML = "Rotate Z: " + rot[2];
}

function kbdDownInterrupt(event) {
	switch (event.code) {
		case "KeyW":
			speed[0] = -1;
			break;
		case "KeyS":
			speed[0] = 1;
			break;
		case "KeyD":
			speed[1] = 1;
			break;
		case "KeyA":
			speed[1] = -1;
			break;
	}
}

function kbdUpInterrupt(event) {
	switch (event.code) {
		case "KeyW":
			speed[0] = 0;
			break;
		case "KeyS":
			speed[0] = 0;
			break;
		case "KeyD":
			speed[1] = 0;
			break;
		case "KeyA":
			speed[1] = 0;
			break;
	}
}

function lockChangeInterrupt() {
	if (document.pointerLockElement === cv ||
		document.mozPointerLockElement === cv) {
		document.addEventListener("mousemove", updateRotation, false);
	} else {
		document.removeEventListener("mousemove", updateRotation, false);
	}
}

function updateRotation(e) {
	xy[0] -= (e.movementX * 0.5);
	xy[1] -= (e.movementY * 0.5);
}
