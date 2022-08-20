import attribute from "./attribute.js";
import { Vector3 } from "./vector.js";

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

// The normals are off - need to fix
export function createConeObject(edges) {
	const radsPerUnit = 2 * Math.PI / edges;
	let angle = 0;
	const points = [];
	const normal = [];
	const texcoord = [];

	const unitRad = 0.5 / Math.sqrt(1.25);
	const unitHeight = 1 / Math.sqrt(1.25);
	for (let horUnit = 0; horUnit < edges; horUnit++) {

		let firstP = [Math.cos(angle) / 2, 0, Math.sin(angle) / 2];
		angle -= radsPerUnit;
		let secondP = [Math.cos(angle) / 2, 0, Math.sin(angle) / 2];

		// top
		points.push(firstP[0]);
		points.push(0);
		points.push(firstP[2]);

		normal.push(Math.cos(angle - radsPerUnit / 2));
		normal.push(unitHeight);
		normal.push(Math.sin(angle - radsPerUnit / 2));

		angle -= radsPerUnit;
		points.push(secondP[0]);
		points.push(0);
		points.push(secondP[2]);

		normal.push(Math.cos(angle - radsPerUnit / 2));
		normal.push(unitHeight);
		normal.push(Math.sin(angle - radsPerUnit / 2));

		points.push(0);
		points.push(1);
		points.push(0);

		normal.push(Math.cos(angle - radsPerUnit / 2));
		normal.push(unitHeight);
		normal.push(Math.sin(angle - radsPerUnit / 2));

		// bottom

		points.push(secondP[0]);
		points.push(0);
		points.push(secondP[2]);

		points.push(firstP[0]);
		points.push(0);
		points.push(firstP[2]);

		points.push(0);
		points.push(0);
		points.push(0);

		normal.push(0);
		normal.push(-1);
		normal.push(0);

		normal.push(0);
		normal.push(-1);
		normal.push(0);

		normal.push(0);
		normal.push(-1);
		normal.push(0);

		texcoord.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1);
	}

	return {
		a_position: new attribute(new Float32Array(points), 3, false),
		a_texcoord: new attribute(new Float32Array(texcoord), 2, true),
		a_normal: new attribute(new Float32Array(normal), 3, false),
	};
}

export function createSphereObject(density) {
	const radsPerUnit = Math.PI / density; // amount increase per vertical level
	const horUnitCount = density * 2;

	const points = [];
	let vertAngle = -Math.PI / 2; // Top
	points.push([0, -1, 0]);

	for (let vertUnit = 0; vertUnit < density; vertUnit++) {
		let radius = Math.cos(vertAngle);
		let height = Math.sin(vertAngle);
		let horAngle = 0;
		for (let horUnit = 0; horUnit <= horUnitCount; horUnit++) {
			let x = Math.cos(horAngle) * radius;
			let z = Math.sin(horAngle) * radius;
			points.push([x, height, z]);
			horAngle -= radsPerUnit;
		}
		vertAngle += radsPerUnit;
	}
	points.push([0, 1, 0]);

	const triangles = [];
	for (let vertUnit = 0; vertUnit < density - 1; vertUnit++) {
		const initialP = (vertUnit * horUnitCount) + 1;
		for (let horUnit = 0; horUnit < horUnitCount; horUnit++) {
			const thisP = initialP + horUnit;
			const nextP = initialP + ((horUnit + 1) % horUnitCount);
			if (vertUnit === 0) {
				triangles.push(points[0], points[nextP], points[thisP]);
			}
			if (vertUnit === density - 2) {
				triangles.push([points[thisP], points[nextP], points[points.length - 1]]);
			}
			if (vertUnit < density - 2 && density > 2) {
				triangles.push([points[thisP], points[nextP + horUnitCount], points[thisP + horUnitCount]]);
				triangles.push([points[thisP], points[nextP], points[nextP + horUnitCount]]);
			}
		}
	}

	// let string = new String();
	// for (let i = 0; i < points.length; i++) {
	// 	string += "\n" + triangles[i][0] + " " + triangles[i][1] + " " + triangles[i][2];
	// }
	// console.log(string);

	const data = [];
	for (let triangle of triangles) {
		data.push(triangle[0], triangle[1], triangle[2]);
	}

	// console.log(data);

	// let string = new String();
	// for (let i = 0; i < data.length; i++) {
	// 	string += "\n" + data[i];
	// }
	// console.log(string);

	return {
		a_position: new attribute(new Float32Array(data), 3, false),
		a_texcoord: new attribute([0, 0], 2, true),
		a_normal: new attribute([0, 0, 0], 3, false),
	};

	// console.log(triangles);
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
