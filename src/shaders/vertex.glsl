#include simplexNoise4d.glsl
attribute vec3 tangent;


float getBlob(vec3 position){
    vec3 wrappedPosition = position;
    wrappedPosition += simplexNoise4d(vec4(position*1.5, 1.0*0.7))*0.3;
    return simplexNoise4d(vec4(position*1.5, 1.0*0.7))*0.3;

}

void main(){
vec3 bitangent = cross(tangent.xyz, normal);
float shift = 0.7;
vec3 A = csm_Position + shift * bitangent;
vec3 B = csm_Position - shift * bitangent;

float blob = getBlob(csm_Position);
csm_Position+= blob*normal;
}