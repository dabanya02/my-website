#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_worldViewProjection;

// out vec4 v_color;
out vec2 v_texcoord;

// all shaders have a main function
void main() {
  
  // transform the position of a point. based off of the orientation of the camera, the projection from world space to clip space, and the world position of the point
  gl_Position = u_worldViewProjection * a_position;

  // Texture coordinate
  v_texcoord = a_texcoord;

}
