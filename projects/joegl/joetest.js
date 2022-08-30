import { mat4 } from "./matrix.js"
import { fetchTextData, fetchJSONData, parseOBJ, parseMTL } from "./data.js"
import { setupControls, updateValues } from "./controls.js"
import { createSphereObject, createConeObject, createPlaneObject } from "./primitives.js"
import { Vector3 } from "./vector.js";
import { setUniforms, resizeCanvasToDisplaySize, setAttributesAndCreateVAO, createProgramFromSource, loadImageEL, getUniformLocationsFromProgram } from "./glhelpers.js"
import { degToRad, radToDeg, randomInt } from "./math.js";
import attribute from "./attribute.js";
import object from "./object.js"
import Scene from "./Scene.js"

/** @type {HTMLCanvasElement} */
let canvas = document.querySelector("#webgl");

/** @type {WebGLRenderingContext} */
let gl = canvas.getContext("webgl2");

let trans = [0, 0, 0];
let transSpeed = [0, 0, 0, 0];
let rot = [0.0, 0.0, 0.0];

let prevTime = 0;
let rotationRad = 0;
let rotationSpeed = 1;

let camera = {
	fovRad: degToRad(60),
	aspect: gl.canvas.clientWidth / gl.canvas.clientHeight,
	zNear: 0.1,
	zFar: 2000,
}

let constUniforms = {
	u_color: [0.2, 1, 0.2, 1],
	u_reverseLightDirection: Vector3.unitVec([0.5, 0.7, 1]),
	u_lightWorldPosition: [200, 30, 50],
	u_lightColor: [1, 1, 1],
	u_specularColor: [1, 1, 1],
	u_innerLimit: 1.0,
	u_outerLimit: 5.0,
	u_lightDirection: [1, 2, 30],
	u_ambient: [0.2, 0.2, 0.2, 1],
	u_ambientLight: [0.05, 0.05, 0.05],
};

const defaultMaterial = {
	diffuse: [1, 1, 1],
	diffuseMap: 0,
	ambient: [0, 0, 0],
	specular: [0.2, 0.2, 0.2],
	specularMap: 0,
	shininess: 400,
	opacity: 1,
};

let fps = document.getElementById("fps");

/** @type {Scene} */
let scene;

async function main() {

	if (!gl) alert("Failed to get gl context");

	setupControls(transSpeed, rot, canvas);

	let program = await createProgramFromSource(gl, "shader.vert", "shader.frag");
	let objProgram = await createProgramFromSource(gl, "mtl.vert", "mtl.frag");

	program.uniforms = getUniformLocationsFromProgram(gl, program);
	objProgram.uniforms = getUniformLocationsFromProgram(gl, objProgram);

	scene = new Scene([1, 1, 1], camera);

	scene.addTexture(gl, new Uint8Array([255, 255, 255, 255]));
	scene.addTexture(gl, new Uint8Array([255, 0, 255, 255]));

	let fData = await fetchJSONData('f.json');
	let fGeometry = correctFVertices(new Float32Array(fData.Geometry));
	let fTexcoord = new Float32Array(fData.TextureCoords);
	let fNormals = new Float32Array(fData.Normals);
	let fObject = {
		a_position: new attribute(fGeometry, 3, false),
		a_texcoord: new attribute(fTexcoord, 2, true),
		a_normal: new attribute(fNormals, 3, false),
	}

	// // make a update uniform function for the program to run
	scene.addObject(new object(
		program,
		setAttributesAndCreateVAO(gl, program, fObject),
		{
			u_texture: 0,
			u_world: mat4.identity(),
			u_shininess: 150,
		},
		[200, 0, -300],
		[0, 0, 0],
		[1.2, 1.2, 1.2],
		16 * 6
	));

	let planeObject = createPlaneObject();

	// make a update uniform function for the program to run
	scene.addObject(new object(
		program,
		setAttributesAndCreateVAO(gl, program, planeObject),
		{
			u_texture: 0,
			u_world: mat4.identity(),
			u_shininess: 150,
		},
		[200, 0, -500],
		[0, Math.PI, 0],
		[100, 100, 100],
		6
	));

	const itr = 10;

	const radsPerUnit = Math.PI / itr; // amount increase per vertical level
	const horUnitCount = itr * 2;

	let points = [];
	let vertAngle = -Math.PI / 2; // Top

	await scene.loadModel(
		"resources/joegl.obj",
		"joegl"
	);

	for (let vertUnit = 0; vertUnit < itr; vertUnit++) {
		let radius = Math.cos(vertAngle) * 150;
		let height = Math.sin(vertAngle) * 150;
		let horAngle = 0;
		for (let horUnit = 0; horUnit <= horUnitCount; horUnit++) {
			let x = Math.cos(horAngle) * radius - 300;
			let z = Math.sin(horAngle) * radius;
			points = [x, height, z - 200];
			scene.createInstanceOfModel(
				gl,
				objProgram,
				"joegl",
				"joegl",
				points,
				[0, 180, 0],
				[10, 10, 10],
				defaultMaterial,
				{
					u_world: mat4.identity(),
					u_ambientLight: [0.0, 0.0, 0.0],
					diffuseMap: 1,
				},
			);
			horAngle -= radsPerUnit;

		}
		vertAngle += radsPerUnit;
	}


	await scene.loadModel("resources/senko.obj", "senko");
	await scene.loadMaterial(gl, "resources/senko.mtl", "senko", "resources/");
	scene.createInstanceOfModel(
		gl,
		objProgram,
		"senko",
		"senko",
		[0, -120, -400],
		[0, 0, 0],
		[30, 30, 30],
		defaultMaterial,
		{
			u_world: mat4.identity(),
			u_ambientLight: [0.0, 0.0, 0.0],
		}
	)


	await scene.loadModel("resources/lantern/lantern.obj", "lantern");
	await scene.loadMaterial(gl, "resources/lantern/lantern.mtl", "lantern", "resources/lantern/");
	scene.createInstanceOfModel(
		gl,
		objProgram,
		"lantern",
		"lantern",
		[20, 0, -200],
		[0, 0, 0],
		[30, 30, 30],
		defaultMaterial,
		{
			u_world: mat4.identity(),
			u_ambientLight: [0.0, 0.0, 0.0],
		}
	)

	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);

	requestAnimationFrame(drawScene);
}

function drawScene(now) {

	gl.clearColor(0.0, 0.0, 255.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	now *= 0.001;
	let dTime = now - prevTime;
	prevTime = now;

	fps.innerHTML = 1 / dTime;
	
	let moveMat = mat4.translation(trans[0], trans[1], trans[2]);
	moveMat = mat4.mRotateY(moveMat, degToRad(rot[1]));
	moveMat = mat4.mRotateX(moveMat, degToRad(rot[2]));
	moveMat = mat4.mRotateZ(moveMat, degToRad(rot[0]));

	let moveVec = mat4.transformVector(moveMat, transSpeed);
	trans[0] += moveVec[1] * dTime * 144;
	trans[2] += moveVec[0] * dTime * 144;

	let cameraMatrix = mat4.identity();
	cameraMatrix = mat4.mTranslation(cameraMatrix, trans[0], trans[1], trans[2]);
	cameraMatrix = mat4.mRotateY(cameraMatrix, degToRad(rot[0]));
	cameraMatrix = mat4.mRotateX(cameraMatrix, degToRad(rot[1]));
	cameraMatrix = mat4.mRotateZ(cameraMatrix, degToRad(rot[2]));

	scene.cameraMatrix = cameraMatrix;
	scene.render(gl,
		{
			...constUniforms,
		});
	
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
