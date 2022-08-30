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
let gl = canvas.getContext("webgl2");;

let objectsToDraw = [];

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

let textures = [];

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
			u_world: mat4.identity(),
			u_shininess: 150,
		},
		[200, 0, -300],
		[0, 0, 0],
		[1.2, 1.2, 1.2],
		16 * 6
	));

	// let planeObject = createPlaneObject();

	// // make a update uniform function for the program to run
	// objectsToDraw.push(new object(
	// 	program,
	// 	setAttributesAndCreateVAO(gl, program, planeObject),
	// 	{
	// 		u_world: mat4.identity(),
	// 		u_shininess: 150,
	// 	},
	// 	[200, 0, -500],
	// 	[0, Math.PI, 0],
	// 	[100, 100, 100],
	// 	6
	// ));

	const itr = 10;

	const radsPerUnit = Math.PI / itr; // amount increase per vertical level
	const horUnitCount = itr * 2;

	let points = [];
	let vertAngle = -Math.PI / 2; // Top

	// let joeobjSource = await fetchTextData("resources/joegl.obj");
	// let joemtlSource = await fetchTextData("resources/joegl.mtl");
	// const joeobj = await parseOBJ(joeobjSource);
	// const joemtl = await parseMTL(joemtlSource + '\n');

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

	let objFile = await fetchTextData("resources/senkomatte.obj");
	let mtlFile = await fetchTextData("resources/senkomatte.mtl");
	const senko = await parseOBJ(objFile);
	const senkoMat = await parseMTL(mtlFile + '\n');

	let white = gl.createTexture();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, white);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

	let purple = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, purple);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));

	let texIdx = 2;
	// creates texture for all the maps
	for (const material of Object.values(senkoMat)) {
		Object.entries(material)
			.filter(([key]) => key.endsWith('Map')) // get all maps from materials
			.forEach(([key, filename]) => { // name of map and the address
				let texture = textures[filename];
				if (!texture) {
					loadImageEL("./resources/" + filename, function (image) {
						let tex = gl.createTexture();
						gl.activeTexture(gl.TEXTURE0 + textures[filename]);
						gl.bindTexture(gl.TEXTURE_2D, tex);
						gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
						gl.generateMipmap(gl.TEXTURE_2D);
					});
					textures[filename] = texIdx;
					texIdx++;
				}
				material[key] = textures[filename];
			})
	};

	senko.geometries.map(({ material, data }) => {
		let obj = new object(
			objProgram,
			setAttributesAndCreateVAO(gl, program, data),
			{
				u_world: mat4.identity(),
				u_ambientLight: [0.0, 0.0, 0.0],
				...defaultMaterial,
				...senkoMat[material],
			},
			[0, -120, -400],
			[0, 0, 0],
			[30, 30, 30],
			data.a_position.buffer.length / 3
		);

		objectsToDraw.push(obj);
	});

	let lanternOBJ = await fetchTextData("resources/lantern/lantern.obj");
	let lanternMTL = await fetchTextData("resources/lantern/lantern.mtl");
	const lantern = await parseOBJ(lanternOBJ);
	const lanternmtl = await parseMTL(lanternMTL + '\n');

	// creates texture for all the maps
	for (const material of Object.values(lanternmtl)) {
		Object.entries(material)
			.filter(([key]) => key.endsWith('Map')) // get all maps from materials
			.forEach(([key, filename]) => { // name of map and the address
				let texture = textures[filename];
				if (!texture) {
					loadImageEL("./resources/lantern/" + filename, function (image) {
						let tex = gl.createTexture();
						gl.activeTexture(gl.TEXTURE0 + textures[filename]);
						gl.bindTexture(gl.TEXTURE_2D, tex);
						gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
						gl.generateMipmap(gl.TEXTURE_2D);
					});
					textures[filename] = texIdx;
					texIdx++;
				}
				material[key] = textures[filename];
			})
	};

	lantern.geometries.map(({ material, data }) => {
		let obj = new object(
			objProgram,
			setAttributesAndCreateVAO(gl, program, data),
			{
				u_world: mat4.identity(),
				u_ambientLight: [0.0, 0.0, 0.0],
				...defaultMaterial,
				...lanternmtl[material],
			},
			[-10, -30, -50],
			[0, 0, 0],
			[50, 50, 50],
			data.a_position.buffer.length / 3
		);

		objectsToDraw.push(obj);
	});

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

	// resizeCanvasToDisplaySize(gl.canvas);
	// gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	// let projectionMatrix = mat4.perspective(camera.fovRad, camera.aspect, camera.zNear, camera.zFar);

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

	// let viewMatrix = mat4.inverse(cameraMatrix);

	// let viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix);

	// for (let object of objectsToDraw) {

	// 	gl.useProgram(object.program);
	// 	gl.bindVertexArray(object.vao);
	// 	setUniforms(gl, constUniforms, object.program.uniforms);

	// 	let worldMatrix = mat4.translation(object.translation[0], object.translation[1], object.translation[2]);
	// 	worldMatrix = mat4.mRotateX(worldMatrix, object.rotation[0]);
	// 	worldMatrix = mat4.mRotateY(worldMatrix, object.rotation[1]);
	// 	worldMatrix = mat4.mRotateZ(worldMatrix, object.rotation[2]);
	// 	worldMatrix = mat4.mScaling(worldMatrix, object.scaling[0], object.scaling[1], object.scaling[2]);
	// 	let worldViewProjectionMatrix = mat4.multiply(viewProjectionMatrix, worldMatrix);
	// 	let worldInverseTransposeMatrix = mat4.transpose(mat4.inverse(worldMatrix));

	// 	setUniforms(gl, object.uniforms, object.program.uniforms);

	// 	setUniforms(gl, object.material, object.program.uniforms);

	// 	setUniforms(gl, {
	// 		u_worldViewProjection: worldViewProjectionMatrix,
	// 		u_worldInverseTranspose: worldInverseTransposeMatrix,
	// 		u_world: worldMatrix,
	// 		u_viewWorldPosition: [
	// 			cameraMatrix[12],
	// 			cameraMatrix[13],
	// 			cameraMatrix[14],],
	// 	}, object.program.uniforms)

	scene.cameraMatrix = cameraMatrix;
	scene.render(gl,
		{
			...constUniforms,
		});
	gl.drawArrays(gl.TRIANGLES, 0, object.vertexes);
	// }						
	// console.log(scene.objects);
	// debugger;
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
