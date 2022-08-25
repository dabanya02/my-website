import { fetchTextData } from "./data.js"

export const Type = {
	void: 0,
	bool: 1,
	int: 2,
	float: 3,
	vec2: 4,
	vec3: 5,
	vec4: 6,
	// reserve
	mat2: 16,
	mat3: 17,
	mat4: 18,
	sampler2D: 19,
	samplerCube: 20,
};

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
	image.addEventListener('load', function() {
		callback(image);
	});
}

// export function loadImage(gl, src, texture, textureNum) {
// 	let image = new Image;
// 	image.src = src;
// 	image.addEventListener('load', function () {
// 		gl.activeTexture(gl.TEXTURE0 + textureNum);
// 		gl.bindTexture(gl.texture_2D, texture);
// 		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
// 		gl.generateMipmap(gl.TEXTURE_2D);
// 	});
// 	return image;
// }

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

// taken from https://webglfundamentals.org/webgl/lessons/webgl-qna-how-can-i-get-all-the-uniforms-and-uniformblocks.html
export function setUniforms(gl, program, uniforms) {
	for (let name in uniforms) {
		const data = uniforms[name][0];
		const type = uniforms[name][1];
		const location = gl.getUniformLocation(program, name);
		switch (type) {
			case (Type.float):
				gl.uniform1f(location, data);
				break;
			case (Type.vec3):
				gl.uniform3fv(location, data);
				break;
			case (Type.vec4):
				gl.uniform4fv(location, data);
				break;
			case (Type.mat2):
				gl.uniformMatrix2fv(location, false, data);
				break;
			case (Type.mat3):
				gl.uniformMatrix3fv(location, false, data);
				break;
			case (Type.mat4):
				gl.uniformMatrix4fv(location, false, data);
				break;
			case (Type.sampler2D):
				gl.uniform1i(location, data);
				break;
			default:
		}
	}
}
