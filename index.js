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
//SMAA import
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
//Bloom post processing import
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
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
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});
//-----------------------------------------------------------------



//Vignette effects-------------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new SMAAPass(window.innerWidth, window.innerHeight)); 
// bloom pass
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    .3,  // strength
    0.2,  // radius
    0.999  // threshold - only pixels brighter than this bloom
);
composer.addPass(bloomPass);
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
const torusGeometry = new THREE.TorusGeometry( 0.2, 0.05, 16,32);
//-----------------------------------------------------------------

// Material -------------------------------------------------------
const floorTexture = loader.load('textures/Floor.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(10,10);
const floorMaterial = new THREE.MeshStandardMaterial({map:floorTexture});
//-----------------------------------------------------------------

//GLTF enable shadows ---------------------------------------------
function enableShadows(gltf) {
    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}
//-----------------------------------------------------------------

// GLTF Loader ----------------------------------------------------
const gltfLoader = new GLTFLoader();
gltfLoader.load('glb/Phone.glb', (gltf) => {
    const phone = gltf.scene;
    enableShadows(gltf);
    phone.scale.set(0.02, 0.02, 0.02);
    phone.position.set(-0.5, -0.3, -1.2);
    phone.rotation.set(0,-Math.PI / 4, 0); 
    scene.add(phone);
});
gltfLoader.load('glb/Gun.glb', (gltf) => {
    const gun = gltf.scene;
    enableShadows(gltf);
    gun.scale.set(0.3, 0.3, 0.3);
    gun.position.set(.2, -0.3, -1);
    gun.rotation.set(Math.PI / 2, 0,Math.PI/6); 
    scene.add(gun);
})
gltfLoader.load('glb/Chair.glb', (gltf) => {
    const chair = gltf.scene;
    enableShadows(gltf);
    chair.scale.set(1, 1, 1);
    chair.position.set(0, -2, -3);
    scene.add(chair);
})
gltfLoader.load('glb/Table.glb', (gltf) => {
    const table = gltf.scene;
    enableShadows(gltf);
    table.scale.set(3, 3, 3);
    table.position.set(0, -2, -1);
    scene.add(table);
})
gltfLoader.load('glb/Lamp.glb', (gltf) => {
    const lamp = gltf.scene;
    lamp.traverse((child) => {
        if (child.isMesh) {
            const lambert = new THREE.MeshLambertMaterial({
                map: child.material.map,
                color: child.material.color,
                transparent: child.material.transparent,
                opacity: child.material.opacity,
                emissive: child.material.color, // glow with own color
                emissiveMap: child.material.map, // use texture for glow
                emissiveIntensity: 0.9,          // soft inner glow
            });
            child.material = lambert;
        }
    });
    enableShadows(gltf);
    lamp.scale.set(0.2, 0.2, 0.2);
    lamp.position.set(0, -0.4, -5);
    scene.add(lamp);
})

let tvMesh = null;
let tvOn = false;

function makeStaticTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = data[i+1] = data[i+2] = v;
        data[i+3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size);
    texture.needsUpdate = true;
    return texture;
}

gltfLoader.load('glb/TV.glb', (gltf) => {
    const tv = gltf.scene;
    enableShadows(gltf);
    tv.traverse((child) => {
        if (child.isMesh) {
            console.log('TV mesh:', child.name);
        }
        if (child.isMesh && child.name === 'TVScreen') {
            tvMesh = child;
            tvMesh.material = new THREE.MeshStandardMaterial({
                color: 0x111111,
                emissive: 0x000000,
                emissiveIntensity: 0,
                roughness: 0.1,
                metalness: 0,
            });
        }
    });
    tv.scale.set(0.07, 0.07, 0.07);
    tv.position.set(-6, -0.3, -4);
    tv.rotation.set(0, -Math.PI/1.5, Math.PI);
    scene.add(tv);
})

window.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
        tvOn = !tvOn;
        if (tvOn && tvMesh) {
            turnOnTV();
        } else if (tvMesh) {
            newsTV = null;
            tvMesh.material.emissive.set(0x000000);
            tvMesh.material.emissiveMap = null;
            tvMesh.material.emissiveIntensity = 0;
            tvMesh.material.needsUpdate = true;
        }
    }
});

gltfLoader.load('glb/Plant.glb', (gltf) => {
    const plant = gltf.scene;
    enableShadows(gltf);
    plant.scale.set(3, 3, 3);
    plant.position.set(-6.8, -1, -2.5);
    scene.add(plant);
})
gltfLoader.load('glb/Candle.glb', (gltf) => {
    const candle = gltf.scene;
    enableShadows(gltf);
    candle.scale.set(.4, .4, .4);
    candle.position.set(-1.2, .6, -9.5);
    candle.traverse((child) => {
        if (child.isMesh && child.material.emissive) {
            child.material.emissiveIntensity = 3;
        }
    });
    scene.add(candle);
})
gltfLoader.load('glb/Bookshelf.glb', (gltf) => {
    const bookshelf = gltf.scene;
    enableShadows(gltf);
    bookshelf.scale.set(3, 1.4, 4);
    bookshelf.position.set(-1.6, -2, -9.5);
    bookshelf.rotation.set(0,-Math.PI/7,0);
    scene.add(bookshelf);
})
gltfLoader.load('glb/Carpet.glb', (gltf) => {
    const carpet = gltf.scene;
    enableShadows(gltf);
    carpet.scale.set(4, 4, 4);
    carpet.position.set(-3, -1.9, -4);
    carpet.traverse((child) => {
        if (child.isMesh) {
            child.material.color.multiplyScalar(2); 
        }
    });
    scene.add(carpet);
})
gltfLoader.load('glb/TVTable.glb', (gltf) => {
    const tvtable = gltf.scene;
    enableShadows(gltf);
    tvtable.scale.set(2, 2, 3);
    tvtable.position.set(-6.3, -2, -5);
    tvtable.rotation.set(0,-Math.PI/2,0);
    scene.add(tvtable);
})
let dog; //pasing as global, since going to be moving dog around
gltfLoader.load('glb/Dog.glb', (gltf) => {
    dog = gltf.scene;
    enableShadows(gltf);
    dog.scale.set(1.5, 1.5, 1.5);
    dog.position.set(-3, -2.4, 3);
    scene.add(dog);
})
let skateboard;
gltfLoader.load('glb/SkateBoard.glb', (gltf) => {
    skateboard = gltf.scene;
    enableShadows(gltf);
    skateboard.scale.set(.1, .1, .1);
    skateboard.position.set(-3, -2.6, 3);
    scene.add(skateboard);
})


//----------------------------------------------------------------
const waypoints = [
    new THREE.Vector3(3, -1, 3),
    new THREE.Vector3(3, -1, -5),
    new THREE.Vector3(-3, -1, -5),
    new THREE.Vector3(-3, -1, 3),
];
let waypointIndex = 0;

function lerpAngle(current, target, t) {
    let diff = target - current;
    // wrap to -PI to PI range so it always takes the shortest path
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * t;
}

function move_dog(delta){
    if (!dog) return;
    if(!skateboard) return;
    if(!halo) return;

    if (haloLight) {
    haloLight.position.set(dog.position.x, dog.position.y + 1, dog.position.z);
    }

    
    const speed = 2;
    const target = waypoints[waypointIndex];
    const direction = target.clone().sub(dog.position);
    const distance = direction.length();
    const direction2 = target.clone().sub(skateboard.position);
    const distance2 = direction.length();
    const direction3 = target.clone().sub(halo.position);
    const distance3 = direction.length();

    if (distance < 0.1 || distance2 < 0.1 || distance3 < 0.3 ){
        // reached waypoint, move to next
        waypointIndex = (waypointIndex + 1) % waypoints.length;
    } else {
        // move toward waypoint
        direction.normalize();
        direction2.normalize();
        direction3.normalize();
        dog.position.addScaledVector(direction, speed * delta);
        skateboard.position.addScaledVector(direction, speed * delta);
        halo.position.addScaledVector(direction, speed * delta);

        // face direction of movement
        const targetRotation = Math.atan2(direction.x, direction.z);
        dog.rotation.y = lerpAngle(dog.rotation.y, targetRotation, 5 * delta);
        skateboard.rotation.y = lerpAngle(skateboard.rotation.y, targetRotation + Math.PI / 2, 5 * delta);
    }
}
//Lighting --------------------------------------------------------

//Diffuse/directional lighting -------------------------
const diffuse_color = 0xFFFFFF;
const intensity = 0.5; 
const light = new THREE.DirectionalLight(diffuse_color, intensity);
light.position.set(-1,2,4);
light.castShadow = true;
//------------------------------------------------------

//Ambient lighting -------------------------------------
// const ambient_color = 0xFFFFFF;
// const a_intensity = .3;
// const a_light = new THREE.AmbientLight(ambient_color, a_intensity);
// scene.add(a_light);
//------------------------------------------------------

//Point lighting ---------------------------------------
const pointLight = new THREE.PointLight(0xffffff, 140, 30, 2);
pointLight.castShadow = true;
pointLight.shadow.bias = -0.005;
pointLight.shadow.normalBias = 0.02;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.position.set(-5, 4.5, -5); // overhead light
scene.add(pointLight)

// add light at lamp position
const lampLight = new THREE.PointLight(0xffee88, 30, 3, 1);
lampLight.castShadow = false;
lampLight.position.set(-0.34, 0.9, -0.59); // center x/z, slightly below top
scene.add(lampLight);

//add halo light
let haloLight;
haloLight = new THREE.PointLight(0xff88ee, 10, 3, 1);
haloLight.castShadow = false;
scene.add(haloLight);

//add light at candle position
const candleLight = new THREE.PointLight(0xffee88, 30, 2, 2);
candleLight.position.set(-1.2, 1.3, -9.5);
candleLight.shadow.camera.near = 0.1;
candleLight.shadow.camera.far = 10;
candleLight.shadow.bias = -0.001; // was -0.005, reduce it
candleLight.shadow.normalBias = 0.05; // increase this
candleLight.castShadow = true;
scene.add(candleLight);

//add candle flicker
function flicker(time){
    candleLight.intensity = 15 + Math.sin(time * 10) * 2 + Math.random() * 2;
}
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


function move(delta){

    //WASD
    const speed = 5 * delta
    if (keys['w']) controls.moveForward(speed);
    if (keys['s']) controls.moveForward(-speed);
    if (keys['a']) controls.moveRight(-speed);
    if (keys['d']) controls.moveRight(speed);

}

let frameCount = 0;
const clock = new THREE.Clock();
let newsTV = null;

// when TV turns on:
function turnOnTV() {
    newsTV = createNewsTexture();
    newsTV.texture.flipY=false;

    newsTV.texture.center.set(0.5, 0.5);
    newsTV.texture.rotation = -Math.PI/2; // flip it
    newsTV.texture.repeat.set(-1, -1); // mirror to correct orientation
    tvMesh.material.emissiveMap = newsTV.texture;
    tvMesh.material.emissive.set(0xffffff);
    tvMesh.material.emissiveIntensity = 1.5;
    tvMesh.material.needsUpdate = true;
}

function render(time){
    time *= 0.001;
    const delta = clock.getDelta();
    if (tvOn && newsTV) {
        newsTV.drawFrame(time);
    }
    flicker(time);
    move_dog(delta);
    move(delta);
    composer.render();
    requestAnimationFrame(render);
}

// const cubes = [];
const loadingElem = document.querySelector('#loading');
const progressBarElem = loadingElem.querySelector('.progressbar');
loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
    const progress = itemsLoaded / itemsTotal;
    progressBarElem.style.transform = `scaleX(${progress})`;
};

let halo;
function main(){

    //render scene once textures load
    loadManager.onLoad = () => {
        loadingElem.style.display ='none';
        const floor = makeInstanceTexture(floorGeometry, floorMaterial,-1);
        floor.receiveShadow = true;
        floor.rotation.x = -Math.PI / 2; // rotate flat
        floor.position.set(0,-1.9,0);

        halo = new THREE.Mesh(torusGeometry, new THREE.MeshStandardMaterial({
            color: 0xff88ee,
            emissive: 0xff88ee,
            emissiveIntensity: 3,  // bright enough to trigger bloom
            roughness: 0,
            metalness: 1,
        }));
        scene.add(halo);
        halo.rotation.x = Math.PI/2;
        halo.position.set(
            -3,
            -2.4 + 1,
            3
        );
        

        requestAnimationFrame(render);
    };
    //add mesh to scene
    scene.add(light);

}


// call main
main()



//Create news texture------------------------------------
function createNewsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const headlines = [
        "BREAKING: US strike likely hit school in Iran due to outdated intelligence, sources say",
        "BREAKING: U.S. military is using AI to help plan Iran air attacks, sources say, as lawmakers call for oversight", 
        "BREAKING: Millions face tornado and storm warnings after homes destroyed in Midwest",
        "BREAKING: Iran War’s oil spike fuels Republican anxieties about midterms",
        "BREAKING: Foreign hacker reportedly breached FBI servers holding Epstein files in 2023",
        "BREAKING: Justice Department posts more Epstein files related to accusations about Trump",
    ];
    
    let tickerX = 512;
    let headlineIndex = 0;
    let glitchTimer = 0;
    let scanlineOffset = 0;
    
    function drawFrame(time) {
        // background - dark grey like old CRT
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, 512, 512);
        
        // random glitch blocks
        glitchTimer++;
        if (glitchTimer % 20 === 0) {
            for (let i = 0; i < 3; i++) {
                const gy = Math.random() * 400;
                const gh = Math.random() * 30 + 5;
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
                ctx.fillRect(0, gy, 512, gh);
            }
        }
        
        // static noise overlay
        for (let i = 0; i < 800; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 400;
            const brightness = Math.random() * 255;
            ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},0.15)`;
            ctx.fillRect(x, y, 2, 2);
        }
        
        // top bar - red breaking news banner
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(0, 0, 512, 50);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ BREAKING NEWS ⚠', 256, 35);
        
        // channel logo top right
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('CH-6 NEWS', 505, 20);
        
        // main content area - dark with vignette feel
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 50, 512, 350);
        
        // glitchy main headline
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        const headline = headlines[headlineIndex % headlines.length];
        
        // split into two lines if long
        const words = headline.split(' ');
        const mid = Math.floor(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');
        ctx.fillText(line1, 256, 180);
        ctx.fillText(line2, 256, 210);
        
        // timestamp
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        const now = new Date();
        ctx.fillText(now.toTimeString().slice(0,8) + ' EST', 10, 380);
        
        // LIVE badge
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(420, 360, 80, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('● LIVE', 460, 380);
        
        // bottom ticker bar
        ctx.fillStyle = '#000066';
        ctx.fillRect(0, 400, 512, 40);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(0, 400, 130, 40);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('URGENT', 65, 425);
        
        // scrolling ticker text
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.save();
        ctx.rect(130, 400, 382, 40);
        ctx.clip();
        const tickerText = headlines.join('   ///   ');
        ctx.fillText(tickerText, tickerX, 425);
        ctx.restore();
        
        // advance ticker
        tickerX -= 1;
        const textWidth = ctx.measureText(tickerText).width;
        if (tickerX < -textWidth) {
            tickerX = 512;
            headlineIndex++;
        }
        
        // scanlines overlay
        scanlineOffset = (scanlineOffset + 1) % 4;
        for (let y = scanlineOffset; y < 512; y += 4) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, y, 512, 2);
        }
        
        texture.needsUpdate = true;
    }
    
    return { texture, drawFrame };
}
//-------------------------------------------------------