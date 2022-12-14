#version 300 es
 
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

in vec3 v_normal;
in vec3 v_tangent;
in vec4 v_color;
in vec2 v_texcoord;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform vec3 u_reverseLightDirection;
uniform vec3 diffuse;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
uniform vec3 u_ambientLight;

uniform sampler2D diffuseMap;
uniform sampler2D specularMap;
uniform sampler2D normalMap;

out vec4 outColor;
 
void main() {

  vec3 normal = normalize(v_normal);
  vec3 tangent = normalize(v_tangent);
  vec3 bitangent = normalize(cross(normal, tangent));

  // tangent bitangent normal matrix, translates the normals from tangent space to world space
  mat3 tbn = mat3(tangent, bitangent, normal);
  normal = texture(normalMap, v_texcoord).rgb * 2. - 1.;
  normal = normalize(tbn * normal);
  
  // directional lighting
  // float light = dot(normal, u_reverseLightDirection);

  // vec3 normal = texture(normalMap, v_texcoord).rgb;
  // normal = normalize(normal*2.0 - 1.0);

  // point lighting
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  // The vertical direction away from the surface
  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
  
  // The dot product between the direction of the light and the angle
  float dotFromDirection = dot(surfaceToLightDirection, u_reverseLightDirection);

  // light hitting plane
  float light = dot(normal, surfaceToLightDirection) * 0.5 + 0.5;
  // specular highlights - strengthen at the points where the light is in the angle thats hitting our view
  float specularLight = pow(clamp(dot(normal, halfVector), 0.0, 1.0), shininess);

  vec4 diffuseMapColor = texture(diffuseMap, v_texcoord);
  vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb;
  vec4 specularMapColor = texture(specularMap, v_texcoord);
  vec3 effectiveSpecular = specular * specularMapColor.rgb;
  float effectiveOpacity = opacity * diffuseMapColor.a;


  
  outColor = vec4(emissive + 
				  ambient * u_ambientLight + 
				  effectiveDiffuse * light +
				  effectiveSpecular * specularLight
				  , effectiveOpacity
				  );

  // outColor = vec4(diffuseMapColor);
						
}
