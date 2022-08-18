export default class attribute {
	buffer;
	numComponents;
	normalization;

	constructor(buffer, numComponents, normalization) {
		this.buffer = buffer;
		this.numComponents = numComponents;
		this.normalization = normalization;
	}
}
