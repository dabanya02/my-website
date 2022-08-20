export default class object {
	translation;
	rotation;
	material;
	vertexes;
	
	program; vao; uniforms;
	
	constructor(program, vao, uniforms, translation, rotation, material, vertexes) {
		this.program = program;
		this.vao = vao;
		this.uniforms = uniforms;
		this.translation = translation;
		this.rotation = rotation;
		this.material = material;
		this.vertexes = vertexes;
	}
}
