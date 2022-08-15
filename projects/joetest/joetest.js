import { mat4 } from "./matrix.js"
import { fetchSources } from "./data.js"
import { setupControls, updateValues } from "./controls.js"
import { setCuboid } from "./primitives.js"

let gl;
let program;
let vao;
let canvas;

let trans = [0, 0, 0];
let transSpeed = [0, 0, 0, 0];
let rot = [0.0, 0.0, 0.0];

let prevTime = 0;
let rotationRad = 0;
let rotationSpeed = 0.005;

let lookingAt = false;

async function main() {

	canvas = document.querySelector("#webgl");
	gl = canvas.getContext("webgl2");
	if (!gl) alert("Failed to get gl context");

	setupControls(transSpeed, rot, canvas);

	let vertexShaderSource = await fetchSources("./shader.vert");
	let fragmentShaderSource = await fetchSources("./shader.frag");

	let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	program = createProgram(gl, vertexShader, fragmentShader);

	let positionAttributeLocation = gl.getAttribLocation(program, "a_position");

	let positionBuffer = gl.createBuffer();

	vao = gl.createVertexArray();

	gl.bindVertexArray(vao);

	gl.enableVertexAttribArray(positionAttributeLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, setCuboid([0, 0, 0], [10, 10, 10]), gl.STATIC_DRAW);

	await setGeometry();

	let size = 3;          // 2 components per iteration
	let type = gl.FLOAT;   // the data is 32bit floats
	let normalize = false; // don't normalize the data
	let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	let offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(
		positionAttributeLocation, size, type, normalize, stride, offset);

	
	let texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");
	let texcoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	setTexcoords();
	gl.enableVertexAttribArray(texcoordAttributeLocation);

	size = 2;
	type = gl.FLOAT;
	normalize = true;
	stride = 0;
	offset = 0;

	gl.vertexAttribPointer(texcoordAttributeLocation, size, type, normalize, stride, offset);

	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	// texImage2D(target, level, internalformat, width, height, border, format, type)
	// Placeholder blue
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

	let image = loadImage("./resources/f.png", texture);

	let cuboid_coords = setCuboid([0, 0, 0], [1, 1, 1]);
	console.log(cuboid_coords);

	// let colorAttributeLocation = gl.getAttribLocation(program, "a_color");
	// let colorBuffer = gl.createBuffer();
	// gl.enableVertexAttribArray(colorAttributeLocation);
	// gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

	// await setColors();

	// size = 3;          // 3 components per iteration
	// type = gl.UNSIGNED_BYTE;   // the data is 8bit unsigned bytes
	// normalize = true;  // Convert from 0-255 to 0.0-1.0
	// stride = 0;        // 0 = move forward size * sizeof(type) each
	// // iteration to get the next color
	// offset = 0;        // start at the beginning of the buffer
	// gl.vertexAttribPointer(
	// 	colorAttributeLocation, size, type, normalize, stride, offset);

	requestAnimationFrame(drawScene);
}

function drawScene(now) {
	now *= 0.001;
	let dTime = now - prevTime;
	prevTime = now;
	resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);

	gl.useProgram(program);
	gl.bindVertexArray(vao);

	let matrixLocation = gl.getUniformLocation(program, "u_matrix");

	let fovRad = degToRad(60);
	let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	let zNear = 0.1;
	let zFar = 2000;

	let radius = 200;

	let projectionMatrix = mat4.perspective(fovRad, aspect, zNear, zFar);

	let cameraMatrix = mat4.identity();
	// Moves the camera around
	if (lookingAt) {
		rotationRad += rotationSpeed / dTime * 0.015;
		cameraMatrix = mat4.rotateY(rotationRad);
		let fPosition = [radius, 0, 0];
		cameraMatrix = mat4.mTranslation(cameraMatrix, 0, 50, radius * 1.5);
		let cameraPosition = [
			cameraMatrix[12],
			cameraMatrix[13],
			cameraMatrix[14],
		];
		let up = [0, 1, 0];
		cameraMatrix = mat4.lookAt(cameraPosition, fPosition, up);
		// test
	} else {
		let moveMat = mat4.translation(trans[0], trans[1], trans[2]);
		moveMat = mat4.mRotateY(moveMat, degToRad(rot[1]));
		moveMat = mat4.mRotateX(moveMat, degToRad(rot[2]));
		moveMat = mat4.mRotateZ(moveMat, degToRad(rot[0]));

		let moveVec = mat4.transformVector(moveMat, transSpeed);
		trans[0] += moveVec[1];
		// trans[1] -= moveVec[2];
		trans[2] += moveVec[0];

		cameraMatrix = mat4.mTranslation(cameraMatrix, trans[0], trans[1], trans[2]);
		cameraMatrix = mat4.mRotateY(cameraMatrix, degToRad(rot[0]));
		cameraMatrix = mat4.mRotateX(cameraMatrix, degToRad(rot[1]));
		cameraMatrix = mat4.mRotateZ(cameraMatrix, degToRad(rot[2]));
	}

	let viewMatrix = mat4.inverse(cameraMatrix);

	let viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

	for (let i = 0; i < 5; ++i) {
		let angle = i * Math.PI * 2 / 5;

		let x = Math.cos(angle) * radius;
		let z = Math.sin(angle) * radius;

		let matrix = mat4.mTranslation(viewProjectionMatrix, x, 0, z);
		gl.uniformMatrix4fv(matrixLocation, false, matrix); // 

		let primitiveType = gl.TRIANGLES;
		let offset = 0;
		let count = 16 * 6;
		gl.drawArrays(primitiveType, offset, count);

	}

	let primitiveType = gl.TRIANGLES;
	let offset = 0;
	let count = 3 * 3;
	gl.drawArrays(primitiveType, offset, count);
	// matrix = mat4.scaling(matrix, scale)

	updateValues(rot, trans);
	requestAnimationFrame(drawScene);

}

function loadImage(src, texture) {
	let image = new Image;
	image.src = src;
	image.addEventListener('load', function () {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.generateMipmap(gl.TEXTURE_2D)
	});
	return image;
}

async function setColors() {
	let response = await fetch('f.json');
	let data = await response.json();
	let colors = new Uint8Array(data.Colors);
	gl.bufferData(
		gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
}

async function setTexcoords() {
	let response = await fetch('f.json');
	let data = await response.json();
	let texcoords = new Float32Array(data.TextureCoords);
	gl.bufferData(
		gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW)
}

async function setGeometry() {
	let response = await fetch('f.json');
	let data = await response.json();
	let positions =
		new Float32Array(data.Geometry);

	// Rotate locations by 180 f and move the f to fit 
	let matrix = mat4.rotateX(Math.PI);
	matrix = mat4.mTranslation(matrix, -50, -75, -15);

	// transform each point using the matrix
	for (let i = 0; i < positions.length; i += 3) {
		let vector = mat4.transformVector(matrix, [positions[i + 0], positions[i + 1], positions[i + 2], 1]);
		positions[i + 0] = vector[0];
		positions[i + 1] = vector[1];
		positions[i + 2] = vector[2];
	}

	gl.bufferData(
		gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function degToRad(degrees) {
	return degrees * (Math.PI / 180);
};

function radToDeg(rad) {
	return rad / (Math.PI / 180);
};


// returns a random integer
function randomInt(range) {
	return Math.floor(Math.random() * range);
}

// Author: Greggman from webgl2fundamentals.org  
function createProgram(gl, vertexShader, fragmentShader) {
	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	let success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}
	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}
// Author: Greggman from webgl2fundamentals.org  
function createShader(gl, type, source) {
	let shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}
	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

// Author: Greggman from webgl2fundamentals.org  
function resizeCanvasToDisplaySize(canvas) {
	const displayWidth = canvas.clientWidth;
	const displayHeight = canvas.clientHeight;

	if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
		canvas.width = displayWidth;
		canvas.height = displayHeight;
	}
}

window.onload = main;