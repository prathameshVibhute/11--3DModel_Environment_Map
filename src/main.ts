import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import * as dat from 'dat.gui';
import { environmentMapKeys, environmentMaps } from './environmentMap-constant';

interface SIZE {
  width: number,
  height: number
}

const canvas: HTMLElement | null = document.getElementById('three-js');
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({canvas} as any);
const scene: THREE.Scene = new THREE.Scene();
const clock = new THREE.Clock();

function getSize(): SIZE {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

scene.environmentIntensity = 1;           // Changes light intensity on object in the scene
scene.backgroundBlurriness = 0;           // Changes background blurriness
scene.backgroundIntensity = 1;            // Changes background intensity i.e show background dark to bright

/**
 * Applying environment map and textures
 */

let environmentMap = {
  map: "interiorView"
}

function getTextureLoaderObject(isNormalTexture: boolean) {
  return isNormalTexture ? new THREE.TextureLoader() : new HDRLoader();
}

function getTexturePath(environmentMapKey: string) {
  return environmentMaps.find(
    (environmentMap) => environmentMapKey in environmentMap
  )?.[environmentMapKey];
}

const changeEnvironmentMap = (environmentMapKey: string = 'interiorView') => {

  // HDRI Loader
  const texturePath = getTexturePath(environmentMapKey);
  if(donut) {
    if(environmentMapKey === 'interiorView') {
      donut.material.visible = true;
    } else {
      donut.material.visible = false;
    }
  }

  const isNormalTexture: boolean = !texturePath.includes('.hdr');
  const hdrLoader: THREE.TextureLoader | HDRLoader = getTextureLoaderObject(isNormalTexture);

  hdrLoader.load(texturePath,(environmentMap: any) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping;
    environmentMap.colorSpace = THREE.SRGBColorSpace;
    scene.background = environmentMap;
  });
}


/**
 * Implementing 3d Model and Geometries
 */

// Flight helmet
const gltfLoader: GLTFLoader = new GLTFLoader();
gltfLoader.load('public/models/FlightHelmet/glTF/FlightHelmet.gltf',(gltf: any) => {
  gltf.scene.scale.set(15,15,15);
  gltf.scene.position.set(0,-5,0);
  scene.add(gltf.scene);
})

// Torus
const torusGeometry: THREE.TorusKnotGeometry = new THREE.TorusKnotGeometry(1.2,0.5,240,20);
const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial(
  {
    roughness: 0, 
    metalness: 1, 
    color: 0xaaaaaa,
  }
);
const torus: THREE.Mesh = new THREE.Mesh(torusGeometry,material);
torus.position.x = -5;
scene.add(torus);

// Donut
const donutGeometry: THREE.TorusGeometry = new THREE.TorusGeometry(8,0.5);
const donutMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({color: new THREE.Color(10,4,2)});
const donut = new THREE.Mesh(donutGeometry,donutMaterial);
/**
 * Enabling layer to 1 will tell CubeCamera to look over only this mesh.
 */
donut.layers.enable(1);
scene.add(donut);

changeEnvironmentMap();


/**
 * Camera
 */

/**
 * WHY DOES THE TORUS APPEAR TO "EMIT LIGHT" ON THE MODEL?
 * ----------------------------------------------------------------
 * The torus is NOT a real light source (no PointLight/SpotLight here).
 * This is an illusion created using Image Based Lighting (IBL) via
 * a CubeCamera + WebGLCubeRenderTarget.
 *
 * STEP 1: CubeCamera sits inside the scene (usually at the center).
 *   const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
 *   const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
 *   scene.add(cubeCamera);
 *
 * STEP 2: It takes a 360° "photo" of everything around it —
 * the white glowing torus, the HDR background, other objects.
 *   cubeCamera.update(renderer, scene);
 * This renders the scene 6 times (once per cube face: +X, -X, +Y, -Y, +Z, -Z).
 *
 * STEP 3: That captured cube texture is assigned as the envMap
 * on the model/geometry material.
 *   mesh.material.envMap = cubeRenderTarget.texture;
 * This tells the material: "this is what your surroundings look like."
 *
 * STEP 4: The PBR shader (MeshStandardMaterial) reads this envMap
 * and simulates how light would bounce off those surroundings onto
 * the object — bright areas in the envMap = simulated light contribution.
 *
 * WHY THE TORUS SPECIFICALLY "LIGHTS UP" THE MODEL:
 * The torus material is bright/white (often via emissive or basic white color).
 * When the CubeCamera photographs the scene, the torus shows up as a
 * bright white shape in the cube texture. The model's shader then treats
 * that bright region as a light source during shading — similar to how
 * a real object near a bright white wall appears illuminated by it.
 *
 * SUMMARY:
 *  - Torus does NOT emit light (no real light source).
 *  - CubeCamera takes a 360° snapshot of the scene (including the torus).
 *  - That snapshot becomes the envMap for the model.
 *  - PBR shader interprets bright spots in envMap as "light" bouncing onto the object.
 *  - This technique is called Image Based Lighting (IBL).
 *  - The same trick is used by HDR environment backgrounds for realistic lighting.
 */

const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(
  256,
  {
    type: THREE.HalfFloatType
  }
);
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
/**
 * Layers
 * All Object3D has a property called layers. We can call layer like tabIndex in css.
 * Here we have set layer to 1 which mean CubeCamera will only capture the element which has layer as "1".
 * For that we also need to enable layer as 1 to some geometry (Above we have set layer.enable(1) for our donut).
 * This will tell cubeCamera to capture our donut and only donut reflection will be visible on the torus. 
 */
cubeCamera.layers.set(1);
scene.add(cubeCamera);

scene.environment = cubeRenderTarget.texture;


let size: SIZE = getSize();
const fieldOfView: number = 65;
const aspectRatio: number = size.width / size.height;
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(fieldOfView,aspectRatio);
camera.position.z = 15;
camera.position.x = 10;
scene.add(camera);

window.addEventListener('resize',() => {
  size = getSize();
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(size.width,size.height);
  renderer.render(scene,camera);
});


/**
 * Rendering
 */
renderer.setAnimationLoop(animation);
renderer.setSize(size.width,size.height);
renderer.render(scene,camera);

const controls: OrbitControls = new OrbitControls(camera,canvas);
controls.autoRotate = true;

function rotateDonut() {
  const elapsedTime: number = clock.getElapsedTime();
  donut.rotation.x = Math.sin(elapsedTime) * 2;
}

function animation() {
  if(donut) {
    rotateDonut();
    cubeCamera.update(renderer,scene);
  }
  renderer.setSize(size.width,size.height);
  renderer.render(scene,camera);
}

/**
 * Dat.GUI Helper
 */

const gui = new dat.GUI();
gui.width = 400;

// Tweaking background properties 
gui.add(scene,'environmentIntensity').min(0).max(15).step(0.1);
gui.add(scene,'backgroundBlurriness').min(0).max(0.5).step(0.01);
gui.add(scene,'backgroundIntensity').min(0).max(10).step(0.01);
gui.add(scene.backgroundRotation,'y').min(0).max(Math.PI * 2).step(0.001).name('Background Rotation Y');
gui.add(scene.environmentRotation,'y').min(0).max(Math.PI * 2).step(0.001).name('Environment Rotation Y');

// Change environmentMap dynamically
gui.add(environmentMap,'map',environmentMapKeys).onChange((environmentMapKey) => changeEnvironmentMap(environmentMapKey));
