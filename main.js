import * as THREE from 'three';
import {OrbitControls} from "three/addons/controls/OrbitControls";



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth - 50, window.innerHeight - 50);
document.body.appendChild(renderer.domElement);
renderer.setClearColor("gray")
const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
camera.position.z = 5;

let texture = {
    "position": "[11, 12, 13]",
    "weight": "20000"
}
let coloring = {
    "weight": "red"
}

let texturesSelect = document.getElementById("textures");
let coloringSelect = document.getElementById("coloring");


function createBoxWithText(posX, posY, posZ, color) {
    const box_geometry = new THREE.BoxGeometry(1, 1, 1);
    const box = new THREE.Mesh(box_geometry, createTextMaterial(texturesSelect.value, color));
    /* Borders*/
    let borders_geo = new THREE.EdgesGeometry(box_geometry);
    const red_color = new THREE.Color('black');
    const mat = new THREE.LineBasicMaterial({color: red_color});
    let borders = new THREE.LineSegments(borders_geo, mat);
    borders.renderOrder = 1; // make sure borders are rendered 2nd
    box.material.map.needsUpdate = true;
    box.add(borders)
    // box.rotation.x = 0.35;
    // box.rotation.y = -0.5;

    box.position.set(posX, posY, posZ);
    scene.add(box);
    return box;
}

let boxes = [];

boxes.push(createBoxWithText(0,0,0,"darkgreen"));
boxes.push(createBoxWithText(1,0,0,"darkblue"));

texturesSelect.addEventListener('change', () => {
    for (let box of boxes) {
        box.material = createTextMaterial(texturesSelect.value, coloring[coloringSelect.value]);
    }
})
coloringSelect.addEventListener('change', () => {
    for (let box of boxes) {
        box.material = createTextMaterial(texturesSelect.value, coloring[coloringSelect.value]);
    }
})



function createTextMaterial(textValue, colorValue) {
    let textCanvas = document.createElement('canvas');
    textCanvas.width = textCanvas.height = 128;
    let ctx = textCanvas.getContext('2d');
    ctx.fillStyle = colorValue;
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = 'white';
    ctx.font = "20px Arial";
    ctx.fillText(textValue, 15, 70);

    let canvasTexture = new THREE.CanvasTexture(textCanvas);
    let textMaterial = new THREE.MeshBasicMaterial({map: canvasTexture});
    textMaterial.map.minFilter = THREE.LinearFilter;
    return textMaterial;
}


function animate() {
    requestAnimationFrame(animate);

    for (let box of boxes) {
        // box.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
    controls.update();
}


animate();