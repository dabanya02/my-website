#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

in vec3 v_normal;
in vec4 v_color;
in vec2 v_texcoord;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;
uniform sampler2D u_texture;
uniform float u_shininess;
uniform vec3 u_lightColor;
uniform vec3 u_specularColor;
uniform vec3 u_lightDirection;
uniform float u_innerLimit;
uniform float u_outerLimit;
uniform vec4 u_colorMult;
uniform vec4 u_ambient;

// we need to declare an output for the fragment shader
out vec4 outColor;
 
void main() {

  vec3 normal = normalize(v_normal);

  // directional lighting
  // float light = dot(normal, u_reverseLightDirection);

  // point lighting
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  // The vertical direction away from the surface
  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
  
  // The dot product between the direction of the light and the angle
  float dotFromDirection = dot(surfaceToLightDirection, -u_lightDirection);
  // modifier 
  float inLight = smoothstep(u_outerLimit, u_innerLimit, dotFromDirection);
  // light hitting plane
  float light = dot(normal, surfaceToLightDirection);
  // specular highlights - strengthen at the points where the light is in the angle thats hitting our view
  float specular = pow(dot(normal, halfVector), u_shininess);
  
  outColor = texture(u_texture, v_texcoord);
	// vec4(1, 0, 0, 1);
    outColor += u_ambient;
  outColor.rgb *= light * u_lightColor;
  outColor.rgb += specular * u_specularColor;
  // outColor.rgb *= u_colorMult;
}
