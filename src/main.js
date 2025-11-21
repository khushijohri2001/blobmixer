import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/Addons.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import vertexShader from "./shaders/vertex.glsl";
import textVertexShader from "./shaders/textVertex.glsl";
import textFragmentShader from "./shaders/textFragment.glsl";
import { Text } from "troika-three-text";
import { blobs } from "../public/configVal";
import gsap from "gsap";

const loadingManager = new THREE.LoadingManager();
const rgbeLoader = new EXRLoader(loadingManager);
const textureLoader = new THREE.TextureLoader(loadingManager);

let isAnimating = false;
let currentIndex = 0;
let currentBlob = blobs[currentIndex].config;

const scene = new THREE.Scene();
scene.background = new THREE.Color(blobs[currentIndex].background);
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 5;



const canvas = document.querySelector("canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const ambientLight = new THREE.AmbientLight("white", 1);
scene.add(ambientLight);

const uniforms = {
  uTime: { value: 0 },
  uPositionFrequency: { value: currentBlob.uPositionFrequency },
  uPositionStrength: { value: currentBlob.uPositionStrength },
  uTimeFrequency: { value: 1 },
  uSmallWavePositionFrequency: { value:currentBlob.uSmallWavePositionFrequency },
  uSmallWavePositionStrength: { value: currentBlob.uSmallWavePositionStrength },
  uSmallWaveTimeFrequency: { value: 0.5 },
};

const geometry = new THREE.IcosahedronGeometry(1, 64);
const material = new CustomShaderMaterial({
  baseMaterial: THREE.MeshPhysicalMaterial,
  vertexShader,
  uniforms,
  map: textureLoader.load(`./gradient/${currentBlob.map}.png`),
  roughness: currentBlob.roughness,
  metalness: currentBlob.metalness,
  envMapIntensity: currentBlob.envMapIntensity,
  transmission: currentBlob.transmission,
  clearcoat: currentBlob.clearcoat,
  clearcoatRoughness: currentBlob.clearcoatRoughness,
  flatShading: currentBlob.flatShading,
  wireframe: currentBlob.wireframe,
});
const mergedGeometry = mergeVertices(geometry);
mergedGeometry.computeTangents();
const sphere = new THREE.Mesh(mergedGeometry, material);

scene.add(sphere);

rgbeLoader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/brown_photostudio_01_1k.exr",
  function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  },
  undefined,
  function (err) {
    console.warn("HDRI load error:", err);
  }
);

const textMaterial = new THREE.ShaderMaterial({
  vertexShader: textVertexShader,
  fragmentShader: textFragmentShader,
  side: THREE.DoubleSide,
  uniforms: {
    progress: { value: 0.0 },
    direction: { value: 1 },
  },
});

const texts = blobs.map((blob, index) => {
  const myText = new Text();
  myText.text = blob.name;
  myText.font = `./aften_screen.woff`;
  myText.anchorX = "center";
  myText.anchorY = "middle";
  myText.material = textMaterial;
  myText.position.set(0, 0, 2);
  if (index !== 0) myText.scale.set(0, 0, 0);
  myText.letterSpacing = -0.08;
  myText.fontSize = window.innerWidth / 3000;
  myText.glyphGeometryDetail = 20;
  myText.outlineColor = new THREE.Color(0x111111);
  myText.outlineWidth = 0.01;
  myText.outlineBlur = 0.03;
  myText.outlineOpacity = 0.15;
  myText.sync();
  scene.add(myText);
  return myText;
});



window.addEventListener("wheel", (e) => {
  // Already animating? Ignore new scrolls
  if (isAnimating) return;

  // Ignore micro scrolls (trackpad bounce)
  if (Math.abs(e.deltaY) < 30) return;

  isAnimating = true;

  const direction = Math.sign(e.deltaY); // 1 for down, -1 for up
  const next = (currentIndex + direction + blobs.length) % blobs.length;

  texts[next].scale.set(1, 1, 1);
  texts[next].position.x = direction * 4;

  gsap.to(textMaterial.uniforms.progress, {
    value: 0.5,
    duration: 1,
    ease: "linear",
    onComplete: () => {
      currentIndex = next;
      textMaterial.uniforms.progress.value = 0;

      // unlock only AFTER animation completes
      setTimeout(() => {
        isAnimating = false;
      }, 500);
    },
  });

gsap.to(texts[currentIndex].position, {
  x: -direction*4,
  duration: 1,
  ease: "power2.inOut",
})

gsap.to(texts[next].position, {
  x: 0,
  duration: 1,
  ease: "power2.inOut",
})

let targetY = sphere.rotation.y + Math.PI * -direction * 4;

gsap.to(sphere.rotation, {
  y: targetY,
  duration: 1,
  ease: "power2.inOut"
});


const bg = new THREE.Color(blobs[next].background);
gsap.to(scene.background, {
  r: bg.r,
  g: bg.g,
  b: bg.b,
  duration: 1,
  ease: "power2.inOut",
})

updateBlob(blobs[next].config);

});

function updateBlob(config) {
  if(!config) return;

  if(config.uPositionFrequency !== undefined) gsap.to( uniforms.uPositionFrequency, { value: config.uPositionFrequency, duration: 1, ease: "power2.inOut" });
  if(config.uPositionStrength !== undefined) gsap.to( uniforms.uPositionStrength, { value: config.uPositionStrength, duration: 1, ease: "power2.inOut" });
  if(config.uSmallWavePositionFrequency !== undefined) gsap.to( uniforms.uSmallWavePositionFrequency, { value: config.uSmallWavePositionFrequency, duration: 1, ease: "power2.inOut" });
  if(config.uSmallWavePositionStrength !== undefined) gsap.to( uniforms.uSmallWavePositionStrength, { value: config.uSmallWavePositionStrength, duration: 1, ease: "power2.inOut" });
  
  // Update material properties
  if(config.map) {
    setTimeout(() => {
      material.map = textureLoader.load(`./gradient/${config.map}.png`)
    }, 500);
  };
  if(config.roughness !== undefined) gsap.to( material, { roughness: config.roughness, duration: 1, ease: "power2.inOut" });
  if(config.metalness !== undefined) gsap.to( material, { metalness: config.metalness, duration: 1, ease: "power2.inOut" });
  if(config.envMapIntensity !== undefined) gsap.to( material, { envMapIntensity: config.envMapIntensity, duration: 1, ease: "power2.inOut" });
  if(config.transmission !== undefined) gsap.to( material, { transmission: config.transmission, duration: 1, ease: "power2.inOut" });
  if(config.clearcoat !== undefined) gsap.to( material, { clearcoat: config.clearcoat, duration: 1, ease: "power2.inOut" });
  if(config.clearcoatRoughness !== undefined) gsap.to( material, { clearcoatRoughness: config.clearcoatRoughness, duration: 1, ease: "power2.inOut" });
  if(config.flatShading !== undefined) material.flatShading = config.flatShading;
  if(config.wireframe !== undefined) material.wireframe = config.wireframe;
}

function updateSphereScale() {
  const width = window.innerWidth;

  if (width <= 600) {
    sphere.scale.set(0.5, 0.5, 0.5); // Mobile
  } else if (width <= 1024) {
    sphere.scale.set(0.6, 0.6, 0.6); // Tablet
  } else {
    sphere.scale.set(1, 1,1); // Desktop
  }
}

function updateTextScale() {
  const baseSize = window.innerWidth < 600 
    ? 0.0004  // mobile
    : 0.0003;   // desktop

  texts.forEach(t => {
    t.fontSize = window.innerWidth * baseSize;
    t.sync();
  });
}




// call once at start
updateSphereScale();
updateTextScale();


window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateSphereScale();
  updateTextScale();
});

const clock = new THREE.Clock();

loadingManager.onLoad = () => {
  function animate() {
    requestAnimationFrame(animate);
    uniforms.uTime.value = clock.getElapsedTime() * 0.1;
    renderer.render(scene, camera);
  }

  animate();
};
