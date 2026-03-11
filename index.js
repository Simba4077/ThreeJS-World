//import three.js -----------------------------------------------
import * as THREE from 'three';
//import objloader.js
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
//import pointer lock controls
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
// --------------------------------------------------------------

// OBJ Loader ----------------------------------------------------
const objLoader = new OBJLoader();
objLoader.load('windmill_001.obj', (root) => {
    scene.add(root);
})
//----------------------------------------------------------------

// Camera setup --------------------------------------------------
//camera default to looking across -z axis, with +y axis facing up
const fov = 100;
const aspect = 2; // the canvas default
const near = 0.1;
const far = 5;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;
//-----------------------------------------------------------------

// Texture loader -------------------------------------------------
const loadManager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(loadManager);

// ----------------------------------------------------------------
// Scene, canvas, and renderer setup ------------------------------
const scene = new THREE.Scene();
const canvas = document.getElementById("myCanvas");
const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
//-----------------------------------------------------------------

// Geometries -----------------------------------------------------
const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
//-----------------------------------------------------------------

// Material -------------------------------------------------------
const materials = [
    new THREE.MeshBasicMaterial({map: loader.load('flower-1.jpg')}),
    new THREE.MeshBasicMaterial({map: loader.load('flower-2.jpg')}),
    new THREE.MeshBasicMaterial({map: loader.load('flower-3.jpg')}),
    new THREE.MeshBasicMaterial({map: loader.load('flower-4.jpg')}),
    new THREE.MeshBasicMaterial({map: loader.load('flower-5.jpg')}),
    new THREE.MeshBasicMaterial({map: loader.load('flower-6.jpg')}),
];
//-----------------------------------------------------------------

//Lighting --------------------------------------------------------

//Diffuse/directional lighting -------------------------
const diffuse_color = 0xFFFFFF;
const intensity = 30; 
const light = new THREE.DirectionalLight(diffuse_color, intensity);
light.position.set(-1,2,4);
//------------------------------------------------------

//Ambient lighting -------------------------------------
const ambient_color = 0xFFFFFF;
const a_intensity = 1;
const a_light = new THREE.AmbientLight(ambient_color, a_intensity);
scene.add(a_light);
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
    renderer.render(scene, camera);

    //animate Mesh cube array
    cubes.forEach((cube, ndx) => {
        const speed = 1 + ndx * .1;
        const rot = time * speed;
        cube.rotation.x = rot;
        cube.rotation.y = rot;
    })

    requestAnimationFrame(render);
}

const cubes = [];
const loadingElem = document.querySelector('#loading');
const progressBarElem = loadingElem.querySelector('.progressbar');
loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
    const progress = itemsLoaded / itemsTotal;
    progressBarElem.style.transform = `scaleX(${progress})`;
};


function main(){

    //add mesh to scene
    scene.add(light);

    //render scene once textures load
    loadManager.onLoad = () => {
        loadingElem.style.display ='none';
        // Mesh -----------------------------------------------------------
        //call makeInstance 3 times and story Mesh instances in an array
        cubes.push(
            makeInstanceTexture(boxGeometry, materials, 0),
            makeInstance(boxGeometry, 0x8844aa, -2),
            makeInstance(boxGeometry, 0xaa8844, 2),
        );
        //-----------------------------------------------------------------
        requestAnimationFrame(render);
    };

}


// call main
main()