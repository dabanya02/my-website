import { fetchTextData, parseOBJ, parseMTL, loadAndCallback } from "./data.js"
import object from "./object.js"
import { setAttributesAndCreateVAO, resizeCanvasToDisplaySize, loadImageEL, setUniforms } from "./glhelpers.js"
import { mat4 } from "./matrix.js"
import attribute from "./attribute.js"

export default class Scene {
	lights;
	models;
	materials;
	objects;
	textures;
	background;
	camera;
	cameraMatrix;
	projectionMatrix;

	constructor(background, camera) {
		this.lights = [];
		this.objects = [];
		this.textures = {};
		this.models = {};
		this.materials = {};
		this.background = background;
		this.camera = camera;
		this.projectionMatrix = mat4.perspective(this.camera.fovRad, this.camera.aspect, this.camera.zNear, this.camera.zFar);
	}

	// loads an object file and material file if it exists.
	async loadModel(objPath, name) {
		if (!this.models[name]) {
			const objSource = await fetchTextData(objPath);
			const obj = parseOBJ(objSource);
			this.models[name] = obj;
		} else {
			console.error("Name already taken:", name);
		}
	}

	async loadMaterial(mtlPath, name) {
		if (!this.materials[name]) {
			const mtlSource = await fetchTextData(mtlPath);
			this.materials[name] = parseMTL(mtlSource);

			// parses the materials list and saves all the textures as indexes
			for (const material of Object.values(this.materials[name])) {
				Object.entries(material)
					.filter(([key]) => key.endsWith('Map')) // get all maps from materials
					.forEach(([key, filename]) => { // name of map and the path
						let texture = this.textures[filename];
						if (!texture) {
							loadImageEL("./resources/" + filename, function (image) {
								let tex = gl.createTexture();
								gl.activeTexture(gl.TEXTURE0 + this.textures[filename]);
								gl.bindTexture(gl.TEXTURE_2D, tex);
								gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
								gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
								gl.generateMipmap(gl.TEXTURE_2D);
							});
							this.textures[filename] = texIdx;
							texIdx++;
						}
						material[key] = this.textures[filename];
					})
			};
		} else {
			console.error("Name already taken:", name);
		}

	}

	createInstanceOfModel(gl, program, objName, mtlName, translation, rotation, scaling, defaultMtl, uniforms) {
		if (!this.models[objName]) {
			console.error("Object not found: ", objName);
			return;
		}

		this.models[objName].geometries.map(({ material, data }) => {
			let curMaterials = {}
			if (this.materials[mtlName]) {
				curMaterials = this.materials[mtlName][material];
			}

				let geometry = new object(
					program,
					setAttributesAndCreateVAO(gl, program, data),
					{
						...defaultMtl,
						...curMaterials,
						...uniforms,
					},
					translation,
					rotation,
					scaling,
					data.a_position.buffer.length / 3
				);

			this.objects.push(geometry);
		});
	}

	render(gl, uniforms) {

		gl.clearColor(0.0, 0.0, 255.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		resizeCanvasToDisplaySize(gl.canvas);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		let viewMatrix = mat4.inverse(this.cameraMatrix);

		let viewProjectionMatrix = mat4.multiply(this.projectionMatrix, viewMatrix);

		for (let geometry of this.objects) {

			gl.useProgram(geometry.program);
			gl.bindVertexArray(geometry.vao);

			let worldMatrix = mat4.translation(geometry.translation[0], geometry.translation[1], geometry.translation[2]);
			worldMatrix = mat4.mRotateX(worldMatrix, geometry.rotation[0]);
			worldMatrix = mat4.mRotateY(worldMatrix, geometry.rotation[1]);
			worldMatrix = mat4.mRotateZ(worldMatrix, geometry.rotation[2]);
			worldMatrix = mat4.mScaling(worldMatrix, geometry.scaling[0], geometry.scaling[1], geometry.scaling[2]);
			let worldViewProjectionMatrix = mat4.multiply(viewProjectionMatrix, worldMatrix);
			let worldInverseTransposeMatrix = mat4.transpose(mat4.inverse(worldMatrix));

			setUniforms(gl, geometry.uniforms, geometry.program.uniforms);
			setUniforms(gl, geometry.material, geometry.program.uniforms);
			setUniforms(gl, uniforms, geometry.program.uniforms);

			setUniforms(gl, {
				u_worldViewProjection: worldViewProjectionMatrix,
				u_worldInverseTranspose: worldInverseTransposeMatrix,
				u_world: worldMatrix,
				u_viewWorldPosition: [
					this.cameraMatrix[12],
					this.cameraMatrix[13],
					this.cameraMatrix[14],],
			}, geometry.program.uniforms);
			gl.drawArrays(gl.TRIANGLES, 0, geometry.vertexes);
		}
	}

	addObject(object) {
		this.objects.push(object);
	}

	removeObject(name) {

	}

	setCamera(fov, aspect, zNear, zFar) {
		this.camera = {
			fovRad: degToRad(fov),
			aspect: aspect,
			zNear: zNear,
			zFar: zFar,
		}
	}

	setCameraMatrix(mat) {
		this.cameraMatrix = mat;
		this.projectionMatrix = mat4.perspective(this.camera.fovRad, this.camera.aspect, this.camera.zNear, this.camera.zFar);
	}
}
