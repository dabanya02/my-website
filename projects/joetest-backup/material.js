export default class material {
	ambient;
	diffuse;
	specular;
	shininess;
	specularFactor;

	constructor(ambient, diffuse, specular, shininess, emissive, opticalDensity, opacity, illum) {
		this.ambient = ambient;
		this.diffuse = diffuse;
		this.specular = specular;
		this.shininess = shininess;
		this.emissive = emissive;
		this.opticalDensity = opticalDensity;
		this.opacity = opacity;
		this.illum = illum;
	}
}
