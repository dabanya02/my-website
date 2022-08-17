import { mat4 } from "./matrix.js"
import { fetchSources } from "./data.js"
import { setupControls, updateValues } from "./controls.js"
import { setCuboid } from "./primitives.js"
import { Vector3 } from "./vector.js";
import { loadImage, setNormals, setColors, setTexcoords, setGeometry, createProgram, createShader, resizeCanvasToDisplaySize } from "./glhelpers.js"
import {degToRad, radToDeg, randomInt} from "./math.js";

let gl;
let program;
let vao;
let canvas;

let trans = [0, 0, 0];
let transSpeed = [0, 0, 0, 0];
let rot = [0.0, 0.0, 0.0];

let prevTime = 0;
let rotationRad = 0;
let rotationSpeed = 1;

let lookingAt = false;
let fpath = 'f.json';

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
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	// uploads buffer
	await setGeometry(gl, fpath);
	vao = gl.createVertexArray();
	// select the vertex array to bind
	gl.bindVertexArray(vao);
	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.vertexAttribPointer(
		positionAttributeLocation, 3, gl.FLOAT, false, 0, 0); // upload data to pa location, size (3 for 3d space), don't normalize, stride (jump), offset (where to start reading)


	let texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");
	let texcoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	await setTexcoords(gl, fpath);
	gl.enableVertexAttribArray(texcoordAttributeLocation);
	gl.vertexAttribPointer(texcoordAttributeLocation, 2, gl.FLOAT, true, 0, 0);

	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	// texImage2D(target, level, internalformat, width, height, border, format, type)
	// Placeholder blue
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

	loadImage(gl, "./resources/f.png", texture);

	// let colorAttributeLocation = gl.getAttribLocation(program, "a_color");
	// let colorBuffer = gl.createBuffer();
	// gl.enableVertexAttribArray(colorAttributeLocation);
	// gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

	// await setColors();

	// gl.vertexAttribPointer(
	// 	colorAttributeLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);

	let normalLocation = gl.getAttribLocation(program, "a_normal");
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	await setNormals(gl, fpath);
	gl.enableVertexAttribArray(normalLocation);
	gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);

	requestAnimationFrame(drawScene);

}

function drawScene(now) {

	now *= 0.001;
	// visibleObjects.forEach(function (obj) {
	// 	let programInfo = obj.programInfo;
	// 	gl.useProgram(programInfo.program);
	// 	gl.bindVertexArray(obj.vertexArray);
	// 	setUniforms(programInfo, obj.uniforms);
	// 	drawBufferInfo(gl, bufferInfo);
	// });

	let dTime = now - prevTime;
	prevTime = now;
	resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.useProgram(program);
	gl.bindVertexArray(vao);

	// get uniform locations
	let worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
	let colorLocation = gl.getUniformLocation(program, "u_color");
	let reverseLightDirectionLocation = gl.getUniformLocation(program, "u_reverseLightDirection");
	let worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
	let worldLocation = gl.getUniformLocation(program, "u_world");
	let lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
	let viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
	let shininessLocation = gl.getUniformLocation(program, "u_shininess");
	let lightColorLocation = gl.getUniformLocation(program, "u_lightColor");
	let specularColorLocation = gl.getUniformLocation(program, "u_specularColor");
	let innerLimitLocation = gl.getUniformLocation(program, "u_innerLimit");
	let outerLimitLocation = gl.getUniformLocation(program, "u_outerLimit");
	let lightDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");

	let fovRad = degToRad(60);
	let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	let zNear = 0.1;
	let zFar = 2000;
	let radius = 200;

	let projectionMatrix = mat4.perspective(fovRad, aspect, zNear, zFar);

	let cameraMatrix = mat4.identity();
	// Moves the camera around
	if (lookingAt) {
		rotationRad += rotationSpeed / dTime * 0.00015;
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

		// set matrices
		let worldMatrix = mat4.translation(x, 0, z);
		worldMatrix = mat4.mRotateY(worldMatrix, angle);
		let worldViewProjectionMatrix = mat4.multiply(viewProjectionMatrix, worldMatrix);
		let worldInverseTransposeMatrix = mat4.transpose(mat4.inverse(worldMatrix));
		gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
		gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
		gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]);
		gl.uniform3fv(reverseLightDirectionLocation, Vector3.unitVec([0.5, 0.7, 1]));
		gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
		gl.uniform3fv(lightWorldPositionLocation, [200, 30, 50]);
		gl.uniform3fv(viewWorldPositionLocation, [
			cameraMatrix[12],
			cameraMatrix[13],
			cameraMatrix[14],
		]);
		let shininess = 150;
		gl.uniform1f(shininessLocation, shininess);
		gl.uniform3fv(lightColorLocation, Vector3.unitVec([1, 1, 1]));
		gl.uniform3fv(specularColorLocation, Vector3.unitVec([1, 1, 1]));
		gl.uniform1f(outerLimitLocation, 5.0);
		gl.uniform1f(innerLimitLocation, 1.0);
		gl.uniform3fv(lightDirectionLocation, [1, 2, 30]);

		let primitiveType = gl.TRIANGLES;
		let offset = 0;
		let count = 16 * 6;
		gl.drawArrays(primitiveType, offset, count);

	}

	updateValues(rot, trans);
	requestAnimationFrame(drawScene);

}

window.onload = main;
