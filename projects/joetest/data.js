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
	const keywords = {

	};

	
   	const keywordRE = /(\w*)(?: )*(.*)/;

	const lines = text.split('\n');

	for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
		const line = lines[lineNo].trim();
		// Skip comments
		if (line === '' || line.startsWith('#')) {
			continue;
		}

		// Splits line into space separated array
		const parts = line.split(/\s+/);
		
		const m = keywordRE.exec(line);
		if (!m) {
			continue;
		}
		const [, keyword, unparsedArgs] = m;
		parts = line.split(/\s+/).slice(1);
		const handler = keywords[keyword];
		if (!handler) {
			console.warn('unhandled keyword:', keyword, 'at line', lineNo + 1);
			continue;
		}
		handler(parts, unparsedArgs);
	}
}
