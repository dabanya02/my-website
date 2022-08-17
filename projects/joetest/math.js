
function degToRad(degrees) {
	return degrees * (Math.PI / 180);
};

function radToDeg(rad) {
	return rad / (Math.PI / 180);
};

// returns a random integer
function randomInt(range) {
	return Math.floor(Math.random() * range);
}

export {degToRad, radToDeg, randomInt};
