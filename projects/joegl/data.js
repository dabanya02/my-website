import attribute from "./attribute.js"
import { Vector2, Vector3 } from "./vector.js"

export async function fetchTextData(path) {
	let response = await fetch(path);
	let responseText = await getTextFromStream(response.body);
	return responseText;
}

export async function fetchJSONData(path) {
	let response = await fetch(path);
	let data = await response.json();
	return data;
}

async function getTextFromStream(readableStream) {
	let reader = readableStream.getReader();
	let utf8Decoder = new TextDecoder();
	let nextChunk;
	let resultStr = '';
	while (!(nextChunk = await reader.read()).done) {
		let partialData = nextChunk.value;
		resultStr += utf8Decoder.decode(partialData);
	}
	return resultStr;
}

export function loadAndCallback(url, callback) {
	fetch(url)
		.then(function (response) { return response.text(); })
		.then(function (text) { return callback(text) });
};

export function parseOBJ(text) {

	const materialLibs = [];

	// because indices are base 1 let's just fill in the 0th data
	const objPositions = [[0, 0, 0]];
	const objTexcoords = [[0, 0]];
	const objNormals = [[0, 0, 0]];

	// same order as `f` indices
	const objVertexData = [
		objPositions,
		objTexcoords,
		objNormals,
	];

	// same order as `f` indices
	let webglVertexData = [
		[],   // positions
		[],   // texcoords
		[],   // normals
	];

	const geometries = [];
	let geometry;
	let material = 'default';
	let object = 'default';
	let groups = ['default'];

	function newGeometry() {
		// If there is an existing geometry and it's
		// not empty then start a new one.
		if (geometry && geometry.data.a_position.length !== 0) {
			geometry = undefined;
		}
	}

	function setGeometry() {
		if (!geometry) {
			const a_position = [];
			const a_texcoord = [];
			const a_normal = [];
			webglVertexData = [
				a_position,
				a_texcoord,
				a_normal,
			];
			// pushes this geometry into geometries array
			geometry = {
				object,
				groups,
				material,
				data: {
					a_position: new attribute(a_position, 3, false),
					a_texcoord: new attribute(a_texcoord, 2, true),
					a_normal: new attribute(a_normal, 3, false),
				},
			};
			geometries.push(geometry);
		}
	}

	// finds the correct vertex to push 
	function addVertex(vert) {
		const ptn = vert.split('/');
		// i -> 0, 1, 2 or xyz
		// objIndexStr -> string of the index to find the vertex
		ptn.forEach((objIndexStr, i) => {
			if (!objIndexStr) {
				return;
			}
			// parsed into index
			const objIndex = parseInt(objIndexStr);
			const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
			// gets data from obj array and pushes into relevant buffer
			webglVertexData[i].push(...objVertexData[i][index]);
		});
	}

	const noop = () => { };

	const keywords = {
		// push into temporary array
		v(parts) {
			objPositions.push(parts.map(parseFloat));
		},
		vn(parts) {
			objNormals.push(parts.map(parseFloat));
		},
		vt(parts) {
			objTexcoords.push(parts.map(parseFloat));
		},
		f(parts) {
			setGeometry();
			// If there are non triangles, convert to triangles
			const numTriangles = parts.length - 2;
			for (let tri = 0; tri < numTriangles; ++tri) {
				// Add parts
				addVertex(parts[0]);
				addVertex(parts[tri + 1]);
				addVertex(parts[tri + 2]);
			}
		},
		usemtl(parts, unparsedArgs) {
			material = unparsedArgs;
			newGeometry();
		},
		mtllib(parts, unparsedArgs) {
			materialLibs.push(unparsedArgs);
		},
		o(parts, unparsedArgs) {
			object = unparsedArgs;
			newGeometry();
		},
		s: noop, // don't do anything for smoothing groups
		l: noop,
		map_d: noop,
		g(parts) {
			groups = parts;
			newGeometry();
		}
	};

	// regex, gets everything except newlines
	const keywordRE = /(\w*)(?: )*(.*)/;

	const lines = text.split('\n');

	for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
		const line = lines[lineNo].trim();
		// Skip comments
		if (line === '' || line.startsWith('#')) {
			continue;
		}

		// Splits line into space separated array
		// const split = line.split(/\s+/);

		// parse using regex rule
		const m = keywordRE.exec(line);
		if (!m) {
			continue;
		}

		// creates array of 3 - the full line, the keyword, and the arguments
		const [, keyword, unparsedArgs] = m;

		const args = line.split(/\s+/).slice(1);
		// get correct handler
		const handler = keywords[keyword];
		if (!handler) {
			console.warn('unhandled keyword:', keyword, 'at line', lineNo + 1);
			continue;
		}
		// handle unparsed args
		handler(args, unparsedArgs);
	}

	for (const geometry of geometries) {
		// filters data that is of 0 size, or where one of the normal/texcoord/position arrays are missing
		geometry.data = Object.fromEntries(
			Object.entries(geometry.data).filter(([, array]) => array.buffer.length > 0)
		);
	}

	return {
		materialLibs,
		geometries,
	};
}

function parseMapArgs(unparsedArgs) {
	return unparsedArgs;
}

// returns an associative array with material data
export function parseMTL(text) {
	const materials = {};
	let curMaterial = {};

	const keywords = {
		newmtl(parts, unparsedArgs) {
			curMaterial = {};
			materials[unparsedArgs] = curMaterial;
		},

		// Ns: specular shininess
		// Ka: ambient colour
		// Kd: diffuse colour
		// Ks: specular colour
		// Ke: emissive colour
		// Ni: Optical density
		// d: dissolve, or opacity
		// illum: illumination
		Ns(parts) { curMaterial.shininess = parseFloat(parts[0]); },
		Ka(parts) { curMaterial.ambient = parts.map(parseFloat); },
		Kd(parts) { curMaterial.diffuse = parts.map(parseFloat); },
		Ks(parts) { curMaterial.specular = parts.map(parseFloat); },
		Ke(parts) { curMaterial.emissive = parts.map(parseFloat); },
		// bump maps, diffuse maps, specular maps
		map_Kd(parts, unparsedArgs) { curMaterial.diffuseMap = parseMapArgs(unparsedArgs); },
		map_Ns(parts, unparsedArgs) { curMaterial.specularMap = parseMapArgs(unparsedArgs); },
		map_Bump(parts, unparsedArgs) { curMaterial.normalMap = parseMapArgs(unparsedArgs); },
		Ni(parts) { curMaterial.opticalDensity = parseFloat(parts[0]); },
		d(parts) { curMaterial.opacity = parseFloat(parts[0]); },
		illum(parts) { curMaterial.illum = parseFloat(parts[0]); },
	}

	// This is nearly the same as the parseOBJ function
	// regex, gets everything except newlines
	const keywordRE = /(\w*)(?: )*(.*)/;

	const lines = text.split('\n');

	for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
		const line = lines[lineNo].trim();
		// Skip comments
		if (line === '' || line.startsWith('#')) {
			continue;
		}

		// Splits line into space separated array
		// const split = line.split(/\s+/);

		// parse using regex rule
		const m = keywordRE.exec(line);
		if (!m) {
			continue;
		}

		// creates array of 3 - the full line, the keyword, and the arguments
		const [, keyword, unparsedArgs] = m;

		const args = line.split(/\s+/).slice(1);
		// get correct handler
		const handler = keywords[keyword];
		if (!handler) {
			console.warn('unhandled keyword:', keyword, 'at line', lineNo + 1);
			continue;
		}
		// handle unparsed args
		handler(args, unparsedArgs);
	}

	return materials;

}

export function generateTangents(position, texcoord) {

	let tangents = new Array();
	let bitTangents = new Array();

	// generate tangent vectors
	for (let i = 0; i < position.buffer.length / 3; i++) {
		let posIdx = 3 * i;
		let texIdx = 2 * i;

		let p1 = position.buffer.slice(posIdx, posIdx + 3);
		let p2 = position.buffer.slice(posIdx + 3, posIdx + 6);
		let p3 = position.buffer.slice(posIdx + 6, posIdx + 9);

		let uv1 = texcoord.buffer.slice(texIdx, texIdx + 2);
		let uv2 = texcoord.buffer.slice(texIdx + 2, texIdx + 4);
		let uv3 = texcoord.buffer.slice(texIdx + 4, texIdx + 6);

		let edge1 = Vector3.sub(p2, p1);
		let edge2 = Vector3.sub(p3, p1);

		let dUV1 = Vector2.sub(uv2, uv1);
		let dUV2 = Vector2.sub(uv3, uv1);

		let f = 1.0 / (dUV1[0] * dUV2[1] - dUV2[0] * dUV1[1]);

		// console.log(dUV1[0] * dUV2[1] - dUV2[0] * dUV1[1]);
		// debugger

		if (!Number.isFinite(f)) {
			tangents.push(1, 0, 0);
		} else {
			tangents.push(
				f * (dUV2[1] * edge1[0] - dUV1[1] * edge2[0]),
				f * (dUV2[1] * edge1[1] - dUV1[1] * edge2[1]),
				f * (dUV2[1] * edge1[2] - dUV1[1] * edge2[2]),
			);
		}

		bitTangents.push([
			f * (-dUV2[0] * edge1[0] - dUV1[0] * edge2[0]),
			f * (-dUV2[0] * edge1[1] - dUV1[0] * edge2[1]),
			f * (-dUV2[0] * edge1[2] - dUV1[0] * edge2[2]),
		]);
	}

	// console.log(tangents);
	return tangents;
}
