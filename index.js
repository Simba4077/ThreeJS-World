//import three.js -----------------------------------------------
import * as THREE from 'three';
//import gltfloader.js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
//import pointer lock controls
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
//import HDR loader
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
//import vignette effects
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
// --------------------------------------------------------------


// Camera setup --------------------------------------------------
//camera default to looking across -z axis, with +y axis facing up
const fov = 30;
const aspect = 2; // the canvas default
const near = 0.1;
const far = 100;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 8;
camera.position.x = -2;
camera.position.y=1.4;
camera.lookAt(0, 1, -2); // aim at chair position
//-----------------------------------------------------------------

// Texture loader -------------------------------------------------
const loadManager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(loadManager);

//loader for hdr
const rgbeLoader = new RGBELoader();
rgbeLoader.load('textures/room.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.backgroundIntensity = 0.4; // dim the HDR background
    scene.backgroundBlurriness = 0.1; // slight blur blends it better

});


// ----------------------------------------------------------------
// Scene, canvas, and renderer setup ------------------------------
const scene = new THREE.Scene();
const canvas = document.getElementById("myCanvas");
const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 0.68;
renderer.shadowMap.enabled = true;
//-----------------------------------------------------------------

//Vignette effects-------------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const vignettePass = new ShaderPass(VignetteShader);
vignettePass.uniforms['offset'].value = 0.5; // size of vignette
vignettePass.uniforms['darkness'].value = 4 // how dark the edges are
composer.addPass(vignettePass);
//-----------------------------------------------------------------

// Geometries -----------------------------------------------------
const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
const floorGeometry = new THREE.PlaneGeometry(100, 100);
//-----------------------------------------------------------------

// Material -------------------------------------------------------
const floorTexture = loader.load('textures/Floor.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(10,10);
const floorMaterial = new THREE.MeshStandardMaterial({map:floorTexture});
//-----------------------------------------------------------------


// GLTF Loader ----------------------------------------------------
const gltfLoader = new GLTFLoader();
gltfLoader.load('glb/Phone.glb', (gltf) => {
    const phone = gltf.scene;
    phone.scale.set(0.02, 0.02, 0.02);
    phone.position.set(-0.5, -0.1, -1.2);
    phone.rotation.set(0,-Math.PI / 4, 0); 
    scene.add(phone);
});
gltfLoader.load('glb/Gun.glb', (gltf) => {
    const gun = gltf.scene;
    gun.scale.set(0.3, 0.3, 0.3);
    gun.position.set(.2, -0.2, -1);
    gun.rotation.set(Math.PI / 2, 0,Math.PI/6); 
    scene.add(gun);
})
gltfLoader.load('glb/Chair.glb', (gltf) => {
    const chair = gltf.scene;
    chair.scale.set(1, 1, 1);
    chair.position.set(0, -2, -3);
    scene.add(chair);
})
gltfLoader.load('glb/Table.glb', (gltf) => {
    const table = gltf.scene;
    table.scale.set(3, 3, 3);
    table.position.set(0, -2, -1);
    scene.add(table);
})
gltfLoader.load('glb/Lamp.glb', (gltf) => {
    const lamp = gltf.scene;
    lamp.scale.set(0.2, 0.2, 0.2);
    lamp.position.set(0, -0.2, -5);
    scene.add(lamp);
})
//----------------------------------------------------------------

//Lighting --------------------------------------------------------

//Diffuse/directional lighting -------------------------
const diffuse_color = 0xFFFFFF;
const intensity = 1; 
const light = new THREE.DirectionalLight(diffuse_color, intensity);
light.position.set(-1,2,4);
//------------------------------------------------------

//Ambient lighting -------------------------------------
// const ambient_color = 0xFFFFFF;
// const a_intensity = 0.3;
// const a_light = new THREE.AmbientLight(ambient_color, a_intensity);
// scene.add(a_light);
//------------------------------------------------------

//Point lighting ---------------------------------------
const pointLight = new THREE.PointLight(0xffffff, 180, 30, 2);
pointLight.castShadow = true;
pointLight.position.set(0, 4.5, -2); // overhead light
scene.add(pointLight)
//------------------------------------------------------

//Hemisphere lighting -----------------------------------
const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.02);
scene.add(hemiLight);
//------------------------------------------------------

//-----------------------------------------------------------------

//instead of using first person or orbit controls, use PointerLockControls .....
// Pointer Lock Controls -----------------------------------------------
const controls = new PointerLockControls(camera, document.body);
canvas.addEventListener('click', () => {controls.lock()});
//click locks the pointer lock controls
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);
//-----------------------------------------------------------------

function makeInstanceTexture(geometry, materials, x){
   
    //make mesh from specified geometry and material
    const cube = new THREE.Mesh(geometry, materials);

    //add to scene
    scene.add(cube);

        
    //set position
    cube.position.x = x;

    return cube;
    
}

function makeInstance(geometry, color, x){
    //make material from specified color
    const material = new THREE.MeshPhongMaterial({color});

    //make mesh from specified geometry and material
    const cube = new THREE.Mesh(geometry, material);

    //add to scene
    scene.add(cube);

    //set position
    cube.position.x = x;

    return cube;
}


function move(){
    const delta = clock.getDelta();

    //WASD
    const speed = 5 * delta
    if (keys['w']) controls.moveForward(speed);
    if (keys['s']) controls.moveForward(-speed);
    if (keys['a']) controls.moveRight(-speed);
    if (keys['d']) controls.moveRight(speed);

}


const clock = new THREE.Clock();
function render(time){
    time *= 0.001;
    move();
    composer.render();

    // //animate Mesh cube array
    // cubes.forEach((cube, ndx) => {
    //     const speed = 1 + ndx * .1;
    //     const rot = time * speed;
    //     cube.rotation.x = rot;
    //     cube.rotation.y = rot;
    // })

    requestAnimationFrame(render);
}

// const cubes = [];
const loadingElem = document.querySelector('#loading');
const progressBarElem = loadingElem.querySelector('.progressbar');
loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
    const progress = itemsLoaded / itemsTotal;
    progressBarElem.style.transform = `scaleX(${progress})`;
};


function main(){

    //render scene once textures load
    loadManager.onLoad = () => {
        loadingElem.style.display ='none';
        const floor = makeInstanceTexture(floorGeometry, floorMaterial,-1);
        floor.receiveShadow = true;
        floor.rotation.x = -Math.PI / 2; // rotate flat
        floor.position.set(0,-1.9,0);
        requestAnimationFrame(render);
    };

    
    //add mesh to scene
    scene.add(light);

}


// call main
main()