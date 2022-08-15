export async function fetchSources(source) {
	let response = await fetch(source);
	let responseText = await getTextFromStream(response.body);
	return responseText;
}

export async function getTextFromStream(readableStream) {
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
