export function setCuboid(v1, v2) {
	let x1 = v1[0];
	let y1 = v1[1];
	let z1 = v1[2];

	let x2 = v2[0];
	let y2 = v2[1];
	let z2 = v2[2];

	return new Float32Array([
		// front bottom
		x1, y1, z1,
		x1, y2, z1,
		x2, y1, z1,
		// front top
		x1, y2, z1,
		x2, y2, z1,
		x2, y1, z1,
		// top front
		x1, y2, z1,
		x1, y2, z2,
		x2, y2, z1,
	]);
}

function setCircle(x, y, radius, res) {
	let arr = new Array();
	let centrex = x;
	let centrey = y;
	let prevx = x;
	let prevy = y + radius;
	let step = 2 * Math.PI / res;
	let cur = 0;
	for (let i = 0; i < res; i++) {
		arr.push(prevx);
		arr.push(prevy);
		arr.push(centrex);
		arr.push(centrey);
		cur += step;
		prevx = centrex + Math.sin(cur) * radius;
		prevy = centrey + Math.cos(cur) * radius;
		arr.push(prevx);
		arr.push(prevy);
	}
	let bufferarr = new Float32Array(arr);
	gl.bufferData(gl.ARRAY_BUFFER, bufferarr, gl.STATIC_DRAW);
}

// counter-clockwise counting of vertices
function setRectangle(gl, x, y, width, height) {
	let x1 = x;
	let x2 = x + width;
	let y1 = y;
	let y2 = y + height;

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		x1, y1,
		x2, y1,
		x1, y2,
		x1, y2,
		x2, y1,
		x2, y2,
	]), gl.STATIC_DRAW);
}
