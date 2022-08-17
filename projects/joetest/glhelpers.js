import {mat4} from './matrix.js'; 

export function loadImage(gl, src, texture) {
	let image = new Image;
	image.src = src;
	image.addEventListener('load', function () {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.generateMipmap(gl.TEXTURE_2D)
	});
	return image;
}

export async function setNormals(gl, path) {
	let response = await fetch(path);
	let data = await response.json();
	gl.bufferData(
		gl.ARRAY_BUFFER, new Float32Array(data.Normals), gl.STATIC_DRAW);
}

export async function setColors(gl, path) {
	let response = await fetch(path);
	let data = await response.json();
	let colors = new Uint8Array(data.Colors);
	gl.bufferData(
		gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
}

export async function setTexcoords(gl, path) {
	let response = await fetch(path);
	let data = await response.json();
	let texcoords = new Float32Array(data.TextureCoords);
	gl.bufferData(
		gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW)
}

export async function setGeometry(gl, path) {
	let response = await fetch(path);
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
export function setAttribs(gl, program) {
	const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	const indices = [...Array(numUniforms).keys()];
	const blockIndices = gl.getActiveUniforms(program, indices, gl.UNIFORM_BLOCK_INDEX);
	const offsets = gl.getActiveUniforms(program, indices, gl.UNIFORM_OFFSET);

	for (let ii = 0; ii < numUniforms; ++ii) {
		const uniformInfo = gl.getActiveUniform(program, ii);
		if(isBuiltIn(uniformInfo))
			continue;
		const {name, type, size} = uniformInfo;
		const blockIdx = blockIndices[ii];
		const offset = offsets[ii];
		console.log(name, size, glEnumToString(gl, type), blockIdx, offset);
	}
}

function isBuiltIn(info) {
  const name = info.name;
  return name.startsWith("gl_") || name.startsWith("webgl_");
}

function glEnumToString(gl, value) {
  const keys = [];
  for (const key in gl) {
    if (gl[key] === value) {
      keys.push(key);
    }
  }
  return keys.length ? keys.join(' | ') : `0x${value.toString(16)}`;
}
