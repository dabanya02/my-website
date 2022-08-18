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
