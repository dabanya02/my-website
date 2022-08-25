#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;
in vec2 v_texcoord;

uniform sampler2D diffuseMap;

out vec4 outColor;
 
void main() {
  outColor = vec4(texture(diffuseMap, v_texcoord).rgb, 1);
}
