import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const canvas = document.querySelector('#canvas')
camera.position.x = 1000;
camera.position.z = 0;
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor("gray")
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);


function createTextMaterial(text, color, width, height) {
    console.log(text)
    let textBorder = {x: 20.0, y: 20.0};
    let context = document.createElement('canvas').getContext('2d');
    context.canvas.width = width;
    context.canvas.height = height;
    let fontLimit = -1;
    let length;
    const computeFont = function (context, text, width, height) {
        console.log(height)
        let fontName = 'Helvetica';
        let fontSize = height - textBorder.y;
        let lengthLimit = width - textBorder.x;
        console.log("lengthLimit: " + lengthLimit);
        if (fontLimit !== -1 &&
            fontSize > fontLimit) {
            fontSize = fontLimit;
        }

        let calcNewLength = function (size) {
            console.log("size: " + size);
            context.font = 'normal + ' + size + 'px ' + fontName;
            return context.measureText(text).width;
        }
        length = calcNewLength(fontSize);
        console.log("length: " + length)
        let interval = {start: 0, end: fontSize};

        if (length <= lengthLimit) {
            console.log("length: " + length + ", lengthLimit: " + lengthLimit)
            return 'normal +' + fontSize / 5 + 'px ' + fontName;
        }

        while (interval.end - interval.start > 1) {
            let center = interval.start + Math.round((interval.end - interval.start) / 2);
            length = calcNewLength(center);
            console.log("length: " + length)
            if (length > lengthLimit) {
                interval.end = center;
            } else {
                interval.start = center;
            }
        }
        return 'normal +' + interval.start + 'px ' + fontName;
    }

    context.fillStyle = color;
    context.fillRect(0, 0, width, height);

    context.fillStyle = 'black';
    context.font = computeFont(context, text, width, height)
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, width / 2, height / 2);

    let canvasTexture = new THREE.CanvasTexture(context.canvas);
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.wrapS = THREE.ClampToEdgeWrapping;
    canvasTexture.wrapT = THREE.ClampToEdgeWrapping;


    return new THREE.MeshBasicMaterial({
        map: canvasTexture,
        transparent: true
    });
}

function getTextMaterial(text, color, width, height, length) {
    const material = [
        // // right
        // createTextMaterial("righthand longer text", color, width, height),
        // // left
        // createTextMaterial("left", color, width, height),
        // // top
        // createTextMaterial("top", color, length, width),
        // // bottom
        // createTextMaterial("bottom", color, length, width),
        // // front
        // createTextMaterial("front", color, length, height),
        // // back
        // createTextMaterial("back", color, length, height)
        // right
        createTextMaterial(text, color, width, height),
        // left
        createTextMaterial(text, color, width, height),
        // top
        createTextMaterial(text, color, length, width),
        // bottom
        createTextMaterial(text, color, length, width),
        // front
        createTextMaterial(text, color, length, height),
        // back
        createTextMaterial(text, color, length, height)
    ];
    return material;
}

function createTexturedBox(text, color, length, height, width) {

    const geometry = new THREE.BoxGeometry(length, height, width);
    const material = getTextMaterial(text, color, width, height, length);

    return new THREE.Mesh(geometry, material);
}

let texturedBox = createTexturedBox("Item 010101010101", "#345435", 400, 200, 300);
scene.add(texturedBox);
renderer.render(scene, camera);

function render() {
    requestAnimationFrame(render)
    // texturedBox.rotation.y += 0.001;
    renderer.render(scene, camera);
}

render();