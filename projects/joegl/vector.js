// Vector library
export class Vector3 {

	static dotProduct(a, b) {
		return [a[0] * b[0] + a[1] * b[1] + a[2] * b[2]];
	}

	static crossProduct(a, b) {
		return [a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0]];
	}

	static add(a, b) {
		return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
	}

	static sub(a, b) {
		return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
	}

	static unitVec(v) {
		let length = this.length(v);
		if (length > 0.00001) {
			return [v[0] / length, v[1] / length, v[2] / length];
		} else {
			return [0, 0, 0];
		}
	}

	static length(v) {
		return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	}
}

export class Vector2 {

	static add(a, b) {
		return [a[0] + b[0], a[1] + b[1]];
	}

	static sub(a, b) {
		return [a[0] - b[0], a[1] - b[1]];
	}

	static scale(mul, vector) {
		return [vector[0] * mul, vector[1] * mul];
	}
}

