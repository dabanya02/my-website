import { fetchTextData } from "./data.js"

export function loadImages(urls, callback) {
	let images = [];
	let imagesToLoad = urls.length;

	// Called each time an image finished loading.
	var onImageLoad = function () {
		--imagesToLoad;
		// If all the images are loaded call the callback.
		if (imagesToLoad === 0) {
			callback(images);
		}
	};

	for (var ii = 0; ii < imagesToLoad; ++ii) {
		var image = loadImage(urls[ii], onImageLoad);
		images.push(image);
	}
}

export function loadImage(url, callback) {
	let image = new Image();
	image.src = url;
	image.onload = callback(image);
	return image;
}

export function loadImageEL(url, callback) {
	let image = new Image();
	image.src = url;
	image.addEventListener('load', function () {
		callback(image);
	});
}

export function setAttributesAndCreateVAO(gl, program, attributes) {
	let vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	for (let name in attributes) {
		// Create a new buffer for each attribute and point each attribute to the associated buffer
		let buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attributes[name].buffer), gl.STATIC_DRAW);
		const location = gl.getAttribLocation(program, name);
		gl.enableVertexAttribArray(location);
		gl.vertexAttribPointer(location, attributes[name].numComponents, gl.FLOAT, attributes[name].normalization, 0, 0);
	}
	return vao;
}

export async function createProgramFromSource(gl, vpath, fpath) {
	let vertexShaderSource = await fetchTextData(vpath);
	let fragmentShaderSource = await fetchTextData(fpath);

	let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	return createProgram(gl, vertexShader, fragmentShader);
}

// Author: Greggman from webgl2fundamentals.org  
export function createProgram(gl, vertexShader, fragmentShader) {
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
export function createShader(gl, type, source) {
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
export function resizeCanvasToDisplaySize(canvas) {
	const displayWidth = canvas.clientWidth;
	const displayHeight = canvas.clientHeight;

	if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
		canvas.width = displayWidth;
		canvas.height = displayHeight;
	}
}

export function setUniforms(gl, uniforms, uniformLocations) {
	for (let name in uniforms) {
		let uniformData = uniformLocations[name];
		const data = uniforms[name];
		if (!uniformData) continue;
		switch (uniformData.type) {
			case (gl.FLOAT):
				gl.uniform1f(uniformData.location, data);
				break;
			case (gl.FLOAT_VEC3):
				gl.uniform3fv(uniformData.location, data);
				break;
			case (gl.FLOAT_VEC4):
				gl.uniform4fv(uniformData.location, data);
				break;
			case (gl.FLOAT_MAT2):
				gl.uniformMatrix2fv(uniformData.location, false, data);
				break;
			case (gl.FLOAT_MAT3):
				gl.uniformMatrix3fv(uniformData.location, false, data);
				break;
			case (gl.FLOAT_MAT4):
				gl.uniformMatrix4fv(uniformData.location, false, data);
				break;
			case (gl.SAMPLER_2D):
				gl.uniform1i(uniformData.location, data);
				break;
			default:
		}
	}
}

// from https://webglfundamentals.org/webgl/lessons/webgl-qna-how-can-i-get-all-the-uniforms-and-uniformblocks.html
export function getUniformLocationsFromProgram(gl, program) {

	const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	const indices = [...Array(numUniforms).keys()];
	const blockIndices = gl.getActiveUniforms(program, indices, gl.UNIFORM_BLOCK_INDEX);
	const offsets = gl.getActiveUniforms(program, indices, gl.UNIFORM_OFFSET);

	const uniformLocations = {}

	let isBuiltIn = (info) => {
		const name = info.name;
		return name.startsWith("gl_") || name.startsWith("webgl_");
	}

	for (let ii = 0; ii < numUniforms; ++ii) {
		const uniformInfo = gl.getActiveUniform(program, ii);
		if (isBuiltIn(uniformInfo)) { continue; }

		uniformLocations[uniformInfo.name] = {
			name: uniformInfo.name,
			type: uniformInfo.type,
			location: gl.getUniformLocation(program, uniformInfo.name),
			blockIndex: blockIndices[ii],
			offset: offsets[ii],
			size: uniformInfo.size,
		}
	}

	return uniformLocations;
}
