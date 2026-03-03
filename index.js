//import three.js -----------------------------------------------
import * as THREE from 'three';
// --------------------------------------------------------------

// Camera setup --------------------------------------------------
//camera default to looking across -z axis, with +y axis facing up
const fov = 80;
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

//call makeInstance 3 times and story Mesh instances in an array
const cubes = [
    makeInstance(boxGeometry, 0x44aa88, 0),
    makeInstance(boxGeometry, 0x8844aa, -2),
    makeInstance(boxGeometry, 0xaa8844, 2),
];
//-----------------------------------------------------------------

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

function render(time){
    time *= 0.001;
    
    cube.rotation.x = time;
    cube.rotation.y = time;

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

function main(){

    //add mesh to scene
    scene.add(cube);
    scene.add(light);

    //render scene
    requestAnimationFrame(render);

}


// call main
main()