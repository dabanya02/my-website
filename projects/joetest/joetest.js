import { mat4 } from "./matrix.js"
import { fetchTextData, fetchJSONData } from "./data.js"
import { setupControls, updateValues } from "./controls.js"
import { setCuboid, createSphere, createConeObject } from "./primitives.js"
import { Vector3 } from "./vector.js";
import { Type, setUniforms, loadImage, createProgram, createShader, resizeCanvasToDisplaySize, setAttributesAndCreateVAO, createProgramFromSource } from "./glhelpers.js"
import { degToRad, radToDeg, randomInt } from "./math.js";
import attribute from "./attribute.js";
import uniform from "./uniform.js";
import object from "./object.js"
import material from "./material.js"

let gl;
let program;
let fvao;
let canvas;

let cvao;
let tvao;

let trans = [0, 0, 0];
let transSpeed = [0, 0, 0, 0];
let rot = [0.0, 0.0, 0.0];

let prevTime = 0;
let rotationRad = 0;
let rotationSpeed = 1;

async function main() {

	canvas = document.querySelector("#webgl");
	gl = canvas.getContext("webgl2");
	if (!gl) alert("Failed to get gl context");

	setupControls(transSpeed, rot, canvas);
	
	program = await createProgramFromSource(gl, "shader.vert", "shader.frag");

	createSphere(2);
	
	let fData = await fetchJSONData('f.json');
	let fGeometry = correctFVertices(new Float32Array(fData.Geometry));
	let fTexcoord = new Float32Array(fData.TextureCoords);
	let fNormals = new Float32Array(fData.Normals);
	let fObject = {
		a_position: new attribute(fGeometry, 3, false),
		a_texcoord: new attribute(fTexcoord, 2, true),
		a_normal: new attribute(fNormals, 3, false),
	}

	fvao = setAttributesAndCreateVAO(gl, program, fObject);

	let texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	// texImage2D(target, level, internalformat, width, height, border, format, type)
	// Placeholder blue
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
	loadImage(gl, "./resources/f.png", texture);

	let coneObject = createConeObject(15);
	cvao = setAttributesAndCreateVAO(gl, program, coneObject);

	let triangleObject = {
		a_position: new attribute(new Float32Array(0, 0, 0, 0, 1, 0, 1, 0, 0), 3, false),
		a_texcoord: new attribute(new Float32Array(0, 0, 0, 1, 1, 0), 2, true),
		a_normal: new attribute(new Float32Array(1, 0, 0, 1, 0, 0, 1, 0, 0), 3, false),
	};
	tvao = setAttributesAndCreateVAO(gl, program, triangleObject);

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
	gl.bindVertexArray(fvao);

	let constUniforms = {
		u_color: [[0.2, 1, 0.2, 1], Type.vec3],
		u_reverseLightDirection: [Vector3.unitVec([0.5, 0.7, 1]), Type.vec3],
		u_lightWorldPosition: [[200, 30, 50], Type.vec3],
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

	// cameraMatrix = lookingAtDemo(dTime);

	let moveMat = mat4.translation(trans[0], trans[1], trans[2]);
	moveMat = mat4.mRotateY(moveMat, degToRad(rot[1]));
	moveMat = mat4.mRotateX(moveMat, degToRad(rot[2]));
	moveMat = mat4.mRotateZ(moveMat, degToRad(rot[0]));

	let moveVec = mat4.transformVector(moveMat, transSpeed);
	trans[0] += moveVec[1];
	trans[2] += moveVec[0];

	cameraMatrix = mat4.mTranslation(cameraMatrix, trans[0], trans[1], trans[2]);
	cameraMatrix = mat4.mRotateY(cameraMatrix, degToRad(rot[0]));
	cameraMatrix = mat4.mRotateX(cameraMatrix, degToRad(rot[1]));
	cameraMatrix = mat4.mRotateZ(cameraMatrix, degToRad(rot[2]));

	let viewMatrix = mat4.inverse(cameraMatrix);

	let viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

	let objects = [];
	let num = 15;
	for (let i = 0; i < num; ++i) {
		let angle = i * Math.PI * 2 / num;

		let x = Math.cos(angle) * radius;
		let z = Math.sin(angle) * radius;

		objects.push(new object([x, 0, z], [0, angle, 0], new material(150)));
	}

	for (let object of objects) {
		let tr = object.translation;
		let ro = object.rotation;
		let worldMatrix = mat4.translation(tr[0], tr[1], tr[2]);
		worldMatrix = mat4.mRotateX(worldMatrix, ro[0]);
		worldMatrix = mat4.mRotateY(worldMatrix, ro[1]);
		worldMatrix = mat4.mRotateZ(worldMatrix, ro[2]);
		worldMatrix = mat4.mScaling(worldMatrix, 1.2, 1.2, 1.2);
		let worldViewProjectionMatrix = mat4.multiply(viewProjectionMatrix, worldMatrix);
		let worldInverseTransposeMatrix = mat4.transpose(mat4.inverse(worldMatrix));

		let uniforms = {
			u_worldViewProjection: [worldViewProjectionMatrix, Type.mat4],
			u_worldInverseTranspose: [worldInverseTransposeMatrix, Type.mat4],
			u_world: [worldMatrix, Type.mat4],
			u_viewWorldPosition: [[
				cameraMatrix[12],
				cameraMatrix[13],
				cameraMatrix[14],], Type.vec3],
			u_shininess: [object.material.shininess, Type.float],
		};

		setUniforms(gl, program, uniforms);

		let primitiveType = gl.TRIANGLES;
		let offset = 0;
		let count = 16 * 6;
		gl.drawArrays(primitiveType, offset, count);
	}

	// gl.useProgram(program);
	// console.log(cvao);
	gl.bindVertexArray(cvao);
	let worldMatrix = mat4.scaling(50, 100, 50);
	worldMatrix = mat4.mTranslation(worldMatrix, 0, -1, 0);
	let worldViewProjectionMatrix = mat4.multiply(viewProjectionMatrix, worldMatrix);
	let worldInverseTransposeMatrix = mat4.transpose(mat4.inverse(worldMatrix));

	let uniforms = {
		u_worldViewProjection: [worldViewProjectionMatrix, Type.mat4],
		u_worldInverseTranspose: [worldInverseTransposeMatrix, Type.mat4],
		u_world: [worldMatrix, Type.mat4],
		u_viewWorldPosition: [[
			cameraMatrix[12],
			cameraMatrix[13],
			cameraMatrix[14],], Type.vec3],
		u_shininess: [150.0, Type.float],
	};
	setUniforms(gl, program, uniforms);
	gl.drawArrays(gl.TRIANGLES, 0, 15 * 3);

	updateValues(rot, trans);
	requestAnimationFrame(drawScene);

}

function lookingAtDemo(dTime) {
	rotationRad += rotationSpeed / dTime * 0.00015;
	let cameraMatrix = mat4.rotateY(rotationRad);
	let fPosition = [radius, 0, 0];
	cameraMatrix = mat4.mTranslation(cameraMatrix, 0, 50, radius * 1.5);
	let cameraPosition = [
		cameraMatrix[12],
		cameraMatrix[13],
		cameraMatrix[14],
	];
	let up = [0, 1, 0];
	return mat4.lookAt(cameraPosition, fPosition, up)
}

function correctFVertices(fGeometry) {
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
	return fGeometry;
}

window.onload = main;
