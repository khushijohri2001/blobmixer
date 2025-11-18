import * as THREE from "three";
import { EXRLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla"
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import vertexShader from "./shaders/vertex.glsl";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth/window.innerHeight,
  0.1,
  1000
);

camera.position.z = 5;

const canvas = document.querySelector("canvas");
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


const ambientLight = new THREE.AmbientLight("white", 1);
scene.add(ambientLight)


const geometry = new THREE.IcosahedronGeometry(1, 64);
const material = new CustomShaderMaterial({
 baseMaterial: THREE.MeshPhysicalMaterial,
 vertexShader,
 color: "pink",
  roughness: 0.1,
  metalness: 1,
  reflectivity: 0.5,
  transmission: 1,
  transparent: true
})
const mergedGeometry = mergeVertices(geometry);
mergedGeometry.computeTangents();
const sphere = new THREE.Mesh(mergedGeometry, material);

scene.add(sphere);

const rgbeLoader = new EXRLoader();
rgbeLoader.load(
"https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/brown_photostudio_01_1k.exr",  function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  },
  undefined,
  function (err) {
    console.warn("HDRI load error:", err);
  }
);

const controls = new OrbitControls(camera, renderer.domElement);
controls.damping = true;
controls.dampingFactor = 0.2;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth/ window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
})

function animate(){
  requestAnimationFrame(animate);
  sphere.rotation.y += 0.005;
  controls.update();
  renderer.render(scene, camera);
}

animate();

