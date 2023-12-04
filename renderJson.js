import * as THREE from 'three';
import json from "./solution.json";
import {OrbitControls} from 'three/addons/controls/OrbitControls';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader';
import {GUI} from 'three/addons/libs/lil-gui.module.min';
import {func} from "three/addons/nodes/code/FunctionNode";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200000);
camera.position.x = 20;
// camera.position.y = 20;
// camera.position.z = 20;

const canvas = document.querySelector('#canvas');
canvas.height = window.innerHeight - 100;
canvas.width = window.innerWidth;
let renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setSize(canvas.width, canvas.height);
renderer.setClearColor("gray")
renderer.setPixelRatio(window.devicePixelRatio);

const controls = new OrbitControls(camera, renderer.domElement);
const texturesSelect = document.getElementById("textures");
const coloringSelect = document.getElementById("coloring");
const saveButton = document.getElementById("save");
const infoLabel = document.getElementById("info");

let hidden = [];
let sceneMeshes = [];
const resetButton = document.getElementById("reset");

resetButton.addEventListener('click', () => {
    for (let hiddenElement of hidden) {
        hiddenElement.visible = true;
        if (hiddenElement.userData.loadingDevice) {
            console.log("loadingDevice")
            scene.remove(hiddenElement);
            loadPalletModel();
        }
    }
    hidden = [];

})

texturesSelect.addEventListener('change', () => {
    changeTextureAndColor();
})

coloringSelect.addEventListener('change', () => {
    changeTextureAndColor();
})

window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight - 100);
    renderer.render(scene, camera);
}

function changeTextureAndColor() {
    let text, color;
    for (let box of boxes) {
        if (texturesSelect.value === "weight") {
            text = box.userData.weight;
        } else if (texturesSelect.value === "position") {
            console.log(box.userData)
            text = JSON.stringify(box.userData.position);
        } else if (texturesSelect.value === "description") {
            text = box.userData.description;
        }

        if (coloringSelect.value === "weight") {
            color = "green";
        } else if (coloringSelect.value === "package") {
            color = box.userData.color;
        }

        box.material = getTextMaterial(text, color, box.userData.width, box.userData.height, box.userData.length);
    }
}

let boxes = [];

function setupLights() {
    const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 5);
    const mainLight = new THREE.DirectionalLight(0xffffff, 5);
    mainLight.position.set(30, 30, 30);
    scene.add(ambientLight, mainLight);
    controls.addEventListener('change', light_update);

    function light_update() {
        mainLight.position.copy(camera.position);
    }

}

setupLights();
loadPalletModel();
renderItemsFromJson();

function renderItemsFromJson() {
    for (let index in json.orderItems) {
        let item = json.orderItems[index];

        const box = createTexturedBox(item.description, item.color, item.length / 100, item.height / 100, item.width / 100);
        box.name = item.description;
        box.userData.color = item.color;
        box.userData.weight = item.weight;
        box.userData.description = item.description;
        box.userData.position = item.position;
        box.userData.width = item.width / 100;
        box.userData.length = item.length / 100;
        box.userData.height = item.height / 100;
        // rotate(item.rotation.x, item.rotation.y, item.rotation.z, box);

        let borders_geo = new THREE.EdgesGeometry(box.geometry);
        const borderColor = new THREE.Color('black');
        const mat = new THREE.LineBasicMaterial({color: borderColor});
        let borders = new THREE.LineSegments(borders_geo, mat);
        borders.renderOrder = 1; // make sure borders are rendered 2nd
        box.material.map.needsUpdate = true;
        box.add(borders)
        box.position.set(item.position.x / 100 + ((box.userData.length) / 2), item.position.y / 100 + ((box.userData.height) / 2), item.position.z / 100 + ((box.userData.width) / 2));
        scene.add(box);
        boxes.push(box);
        sceneMeshes.push(box);
        console.log(box)

    }
}

function createTextMaterial(text, color, width, height) {
    console.log(text)
    let textBorder = {x: 20.0, y: 50.0};
    let context = document.createElement('canvas').getContext('2d');
    context.canvas.width = width;
    context.canvas.height = height;
    let fontLimit = -1;
    let length;
    const computeFont = function (context, text, width, height) {
        let fontName = 'Helvetica';
        let fontSize = height - textBorder.y;
        let lengthLimit = width - textBorder.x;
        console.log(lengthLimit)
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
        console.log("lengthLimit: " + lengthLimit)
        let interval = {start: 0, end: fontSize};

        if (length <= lengthLimit) {
            return 'normal +' + fontSize / 5 + 'px ' + fontName;
        }

        while (interval.end - interval.start > 1) {
            let center = interval.start + Math.round((interval.end - interval.start) / 2);
            console.log("center: " + center)
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

    console.log(context.font)
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
        // right
        createTextMaterial(text, color, width * 100, height * 100),
        // left
        createTextMaterial(text, color, width * 100, height * 100),
        // top
        createTextMaterial(text, color, length * 100, width * 100),
        // bottom
        createTextMaterial(text, color, length * 100, width * 100),
        // front
        createTextMaterial(text, color, length * 100, height * 100),
        // back
        createTextMaterial(text, color, length * 100, height * 100)
    ];
    return material;
}

function createTexturedBox(text, color, length, height, width) {

    const geometry = new THREE.BoxGeometry(length, height, width);
    const material = getTextMaterial(text, color, width, height, length);

    return new THREE.Mesh(geometry, material);
}

function loadPalletModel() {
    const loader = new GLTFLoader();
    const onLoad = (gltf, position, scale) => {
        let model = gltf.scene;
        model.scale.set(scale.x, scale.y, scale.z);
        model.position.copy(position);
        model.userData.loadingDevice = true;
        scene.add(model);
    };

    // Ladefortschritt
    const onProgress = (xhr) => {
        console.log(`${(xhr.loaded / xhr.total)}% loaded`);
    };

    // Fehlermeldung an Conole
    const onError = (errorMessage) => {
        console.log(errorMessage);
    };

    // Modell asynchron laden.
    const palletPosition = new THREE.Vector3(0, -0.22, 0);
    const palletScale = new THREE.Vector3(20, 20, 20);
    loader.load('./models/euro_pallet_wt.glb', (gltf) => onLoad(gltf, palletPosition, palletScale), (xhr) => onProgress(xhr), (error) => onError(error));

}


saveButton.addEventListener('click', () => {
    render();
    canvas.toBlob((blob) => {
        saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    });
});

const saveBlob = (function () {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    return function saveData(blob, fileName) {
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
    };
}());


class PickHelper {
    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.pickedObject = null;
        this.pickedObjectSavedColor = 0;
    }

    pick(normalizedPosition, scene, camera, ctrlDown) {
        // restore the color if there is a picked object
        if (this.pickedObject && this.pickedObject.material.color !== undefined) {
            this.pickedObject.material.color.setHex(this.pickedObjectSavedColor);
            this.pickedObject = undefined;
        }

        // cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children);
        if (intersectedObjects.length && ctrlDown) {

            this.pickedObject = intersectedObjects[0].object;
            console.log(this.pickedObject)
            if (this.pickedObject.parent.type !== "Scene") {
                this.pickedObject.parent.visible = false;
                hidden.push(this.pickedObject.parent);
                hidden.push(this.pickedObject)
            }
        } else if (intersectedObjects.length) {
            // pick the first object. It's the closest one
            this.pickedObject = intersectedObjects[0].object;

            if (this.pickedObject !== undefined && this.pickedObject.material.color !== undefined) {
                infoLabel.innerHTML = "Name: " + this.pickedObject.parent.name + " Color: " + this.pickedObject.parent.userData.color;
                this.pickedObjectSavedColor = this.pickedObject.material.color.getHex();
                this.pickedObject.material.color.setHex(0xffff00);
            }
            // save its color
            // set its emissive color to flashing red/yellow
        }
    }
}

const pickPosition = {x: 0, y: 0};
const pickHelper = new PickHelper();
clearPickPosition();

function getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * canvas.width / rect.width,
        y: (event.clientY - rect.top) * canvas.height / rect.height,
    };
}

function setPickPosition(event) {
    const pos = getCanvasRelativePosition(event);
    pickPosition.x = (pos.x / renderer.domElement.clientWidth) * 2 - 1;
    pickPosition.y = -(pos.y / renderer.domElement.clientHeight) * 2 + 1;  // note we flip Y
}


function clearPickPosition() {
    // unlike the mouse which always has a position
    // if the user stops touching the screen we want
    // to stop picking. For now we just pick a value
    // unlikely to pick something
    pickPosition.x = -10000000;
    pickPosition.y = -10000000;
}

window.addEventListener('mousemove', setPickPosition);
window.addEventListener('click', (event) => {
    pickHelper.pick(pickPosition, scene, camera, event.ctrlKey);
});
window.addEventListener('mouseout', clearPickPosition);
window.addEventListener('mouseleave', clearPickPosition);

window.addEventListener('dblclick', onDoubleClick, false);
window.addEventListener('mousemove', onMouseMove, false);

const raycaster = new THREE.Raycaster();


const arrowHelper = new THREE.ArrowHelper(
    new THREE.Vector3(),
    new THREE.Vector3(),
    25,
    0xffff00
);
scene.add(arrowHelper)

function onMouseMove(event) {
    setPickPosition(event);

    // console.log(mouse)

    raycaster.setFromCamera(pickPosition, camera);

    const intersects = raycaster.intersectObjects(sceneMeshes, false);

    if (intersects.length > 0) {
        const n = new THREE.Vector3();
        n.copy((intersects[0].face).normal);
        n.transformDirection(intersects[0].object.matrixWorld);

        arrowHelper.setDirection(n);
        arrowHelper.position.copy(intersects[0].point);
    }
}

function onDoubleClick(event) {
    const coneGeometry = new THREE.ConeGeometry(80, 200, 6);
    const material = new THREE.MeshNormalMaterial();
    setPickPosition(event);
    raycaster.setFromCamera(pickPosition, camera);

    const intersects = raycaster.intersectObjects(sceneMeshes, false);
    if (intersects.length > 0) {
        const n = new THREE.Vector3();
        n.copy((intersects[0].face).normal);
        n.transformDirection(intersects[0].object.matrixWorld);

        // const cube = new THREE.Mesh(boxGeometry, material)
        const cube = new THREE.Mesh(coneGeometry, material);

        cube.lookAt(n);
        cube.rotateX(Math.PI / 2);
        cube.position.copy(intersects[0].point);
        cube.position.addScaledVector(n, 0.1);

        scene.add(cube);

        sceneMeshes.push(cube);
    }
}


function render() {
    // pickHelper.pick(pickPosition, scene, camera);
    renderer.render(scene, camera);
    controls.update();
    requestAnimationFrame(render);

}

const axesHelper = new THREE.AxesHelper(5000);
axesHelper.visible = false;
scene.add(axesHelper)

const gui = new GUI();

gui.add(controls, "autoRotate", true, false).name("Rotation");
gui.add(axesHelper, "visible", true, false).name("Axes");
const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(camera.position, "x", 0, 2000).name("X").listen();
cameraFolder.add(camera.position, "y", 0, 2000).name("y").listen();
cameraFolder.add(camera.position, "z", 0, 2000).name("z").listen();
cameraFolder.open();

const mouseFolder = gui.addFolder("Mouse Position");
mouseFolder.add(pickPosition, "x").listen();
mouseFolder.add(pickPosition, "y").listen();


gui.close();


requestAnimationFrame(render)





