//import three.js -----------------------------------------------
import * as THREE from 'three';
// --------------------------------------------------------------

// Camera setup --------------------------------------------------
//camera default to looking across -z axis, with +y axis facing up
const fov = 75;
const aspect = 2; // the canvas default
const near = 0.1;
const far = 5;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;
//-----------------------------------------------------------------

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
const material = new THREE.MeshPhongMaterial({color: 0x44aa88});
//-----------------------------------------------------------------

//Lighting --------------------------------------------------------
const color = 0xFFFFFF;
const intensity = 3; 
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1,2,4);
//-----------------------------------------------------------------

// Mesh -----------------------------------------------------------
const cube = new THREE.Mesh(boxGeometry, material);
//-----------------------------------------------------------------

function render(time){
    time *= 0.001;
    
    cube.rotation.x = time;
    cube.rotation.y = time;

    renderer.render(scene, camera);

    requestAnimationFrame(render);
}

function main(){

    //add mesh to scene
    scene.add(cube);
    scene.add(light);

    //render scene
    requestAnimationFrame(render);

}


// call main
main()