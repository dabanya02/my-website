import { mat4 } from "./matrix.js"
import { fetchTextData, fetchJSONData } from "./data.js"
import { setupControls, updateValues } from "./controls.js"
import { setCuboid } from "./primitives.js"
import { Vector3 } from "./vector.js";
import { Type, setAttributesAndCreateVAO, setUniforms, loadImage, createProgram, createShader, resizeCanvasToDisplaySize } from "./glhelpers.js"
import { degToRad, radToDeg, randomInt } from "./math.js";
import attribute from "./attribute.js";
import uniform from "./uniform.js";

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

let constUniforms;

let lookingAt = false;

async function main() {

	canvas = document.querySelector("#webgl");
	gl = canvas.getContext("webgl2");
	if (!gl) alert("Failed to get gl context");

	setupControls(transSpeed, rot, canvas);

	let vertexShaderSource = await fetchTextData("./shader.vert");
	let fragmentShaderSource = await fetchTextData("./shader.frag");

	let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	program = createProgram(gl, vertexShader, fragmentShader);

	let fData = await fetchJSONData('f.json');
	let fGeometry = new Float32Array(fData.Geometry);
	// Rotate locations by 180 f and move the f to fit 
	let matrix = mat4.rotateX(Math.PI);
	matrix = mat4.mTranslation(matrix, -50, -75, -15);

	// transform each point using the matrix
	for (let i = 0; i < fGeometry.length; i += 3) {
		let vector = mat4.transformVector(matrix, [fGeometry[i + 0], fGeometry[i + 1], fGeometry[i + 2], 1]);
		fGeometry[i + 0] = vector[0];
		fGeometry[i + 1] = vector[1];
		fGeometry[i + 2] = vector[2];
	}

	let fTexcoord = new Float32Array(fData.TextureCoords);
	let fNormals = new Float32Array(fData.Normals);
	let fObject = {
		a_position: new attribute(fGeometry, 3, false),
		a_texcoord: new attribute(fTexcoord, 2, true),
		a_normal: new attribute(fNormals, 3, false),
	}

	vao = setAttributesAndCreateVAO(gl, program, fObject);

	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	// texImage2D(target, level, internalformat, width, height, border, format, type)
	// Placeholder blue
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
	loadImage(gl, "./resources/f.png", texture);

	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);

	requestAnimationFrame(drawScene);
}

function drawScene(now) {

	now *= 0.001;

	let dTime = now - prevTime;
	prevTime = now;
	resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.useProgram(program);
	gl.bindVertexArray(vao);

	let shininess = 150;
	constUniforms = {
		u_color: [[0.2, 1, 0.2, 1], Type.vec3],
		u_reverseLightDirection: [Vector3.unitVec([0.5, 0.7, 1]), Type.vec3],
		u_lightWorldPosition: [[200, 30, 50], Type.vec3],
		u_shininess: [shininess, Type.float],
		u_lightColor: [Vector3.unitVec([1, 1, 1]), Type.vec3],
		u_specularColor: [Vector3.unitVec([1, 1, 1]), Type.vec3],
		u_innerLimit: [1.0, Type.float],
		u_outerLimit: [5.0, Type.float],
		u_lightDirection: [[1, 2, 30], Type.vec3],
	};
	setUniforms(gl, program, constUniforms);

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

	for(let i = 0; i < 5; ++i) {
		
	}
	
	for (let i = 0; i < 5; ++i) {
		let angle = i * Math.PI * 2 / 5;

		let x = Math.cos(angle) * radius;
		let z = Math.sin(angle) * radius;

		// set matrices
		let worldMatrix = mat4.translation(x, 0, z);
		worldMatrix = mat4.mRotateY(worldMatrix, angle);
		let worldViewProjectionMatrix = mat4.multiply(viewProjectionMatrix, worldMatrix);
		let worldInverseTransposeMatrix = mat4.transpose(mat4.inverse(worldMatrix));
		let shininess = 150;

		let uniforms = {
			u_worldViewProjection: [worldViewProjectionMatrix, Type.mat4],
			// u_color: [[0.2, 1, 0.2, 1], Type.vec3],
			// u_reverseLightDirection: [Vector3.unitVec([0.5, 0.7, 1]), Type.vec3],
			u_worldInverseTranspose: [worldInverseTransposeMatrix, Type.mat4],
			u_world: [worldMatrix, Type.mat4],
			// u_lightWorldPosition: [[200, 30, 50], Type.vec3],
			u_viewWorldPosition: [[
				cameraMatrix[12],
				cameraMatrix[13],
				cameraMatrix[14],], Type.vec3],
			// u_shininess: [shininess, Type.float],
			// u_lightColor: [Vector3.unitVec([1, 1, 1]), Type.vec3],
			// u_specularColor: [Vector3.unitVec([1, 1, 1]), Type.vec3],
			// u_innerLimit: [1.0, Type.float],
			// u_outerLimit: [5.0, Type.float],
			// u_lightDirection: [[1, 2, 30], Type.vec3],
		};

		setUniforms(gl, program, uniforms);

		let primitiveType = gl.TRIANGLES;
		let offset = 0;
		let count = 16 * 6;
		gl.drawArrays(primitiveType, offset, count);

	}

	updateValues(rot, trans);
	requestAnimationFrame(drawScene);

}

window.onload = main;
