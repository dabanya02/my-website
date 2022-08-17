#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_color;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_world;
uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;
uniform vec3 u_lightWorldPosition;
uniform vec3 u_viewWorldPosition;

// out vec4 v_color;
out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

// all shaders have a main function
void main() {
  
  // transform the position of a point. based off of the orientation of the camera, the projection from world space to clip space, and the world position of the point
  gl_Position = u_worldViewProjection * a_position;

  // transform the point based off the world position.
  vec3 surfaceWorldPosition = (u_world * a_position).xyz;
  
  // change the normals by the world position.
  v_normal = mat3(u_worldInverseTranspose) * a_normal;
  // Texture coordinate
  v_texcoord = a_texcoord;
  // find the vector from the light to the surface point
  v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
  // find the vector from the view to the surface point
  v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
}
