import attribute from "./attribute.js"

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

export async function parseOBJ(text) {
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
			// If there are non triangles, convert to triangles
			const numTriangles = parts.length - 2;
			for (let tri = 0; tri < numTriangles; ++tri) {
				// Add parts
				addVertex(parts[0]);
				addVertex(parts[tri + 1]);
				addVertex(parts[tri + 2]);
			}
		},
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

	return {
		a_position: new attribute(webglVertexData[0], 3, false),
		a_texcoord: new attribute(webglVertexData[1], 2, true),
		a_normal: new attribute(webglVertexData[2], 3, false),
	};
}
