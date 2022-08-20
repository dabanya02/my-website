export default class object {
	translation;
	rotation;
	scaling;
	material;
	vertexes;
	
	program; vao; uniforms;
	
	constructor(program, vao, uniforms, translation, rotation, scaling, material, vertexes) {
		this.program = program;
		this.vao = vao;
		this.uniforms = uniforms;
		this.translation = translation;
		this.rotation = rotation;
		this.scaling = scaling;
		this.material = material;
		this.vertexes = vertexes;
	}
}
