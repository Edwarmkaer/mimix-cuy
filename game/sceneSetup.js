import * as THREE from 'three';
import { StonePath } from './stone-path.js';
import { GalaxyBackground } from './shared/fx/GalaxyBackground.js';
import { GAME_AREA_LENGTH, LANE_WIDTH } from './constants.js'; // Ensure LANE_WIDTH is imported here

export class SceneSetup {
    constructor(renderDiv) {
        this.renderDiv = renderDiv;
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0d1117);
        // Scene background is now transparent by default (no color set)
        // Fog is removed
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, this.renderDiv.clientWidth / this.renderDiv.clientHeight, 0.1, 180);
        this.resetCamera();
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setSize(this.renderDiv.clientWidth, this.renderDiv.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0); // Set clear color to black with 0 alpha (transparent)
        this.renderDiv.appendChild(this.renderer.domElement);
        this.galaxy = new GalaxyBackground(this.scene, {renderer:this.renderer, intro:false});
        this.galaxy.mesh.material.uniforms.uOpacity.value = 0.38;
        this.galaxy.mesh.material.uniforms.uFlareGain.value = 0.04;
        this.galaxy.mesh.material.uniforms.uTwinkleIntensity.value = 0.12;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 3.0); // Increased intensity from 3.0
        this.directionalLight.position.set(0, 6, -7); // Keep initial position for now
        this.scene.add(this.directionalLight);
        
        // Add the light's target object to the scene so it can be updated
        this.scene.add(this.directionalLight.target);
        
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(8, GAME_AREA_LENGTH * 1.5, 32, 32); // Size it relative to game area
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x625e55,
            roughness: 1,
            metalness: 0,
            transparent: true,
            opacity: 1
        });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2; // Rotate to be flat
        this.floor.position.y = -0.19; // Position it below the player/lava level
        this.floor.position.z = -(GAME_AREA_LENGTH * 1.5) / 2 + 10; // Center it along the Z axis, adjust offset as needed
        this.scene.add(this.floor);
        this.stonePath = new StonePath(this.scene);
        
    }

    resetCamera() {
        // Increased Y position significantly and moved Z back slightly
        this.camera.position.set(0, 5.5, 10); // Higher Y, slightly further back Z
        this.camera.lookAt(0, 1, -8); // Look slightly further down the path
    }

    setGameOverBackground() {
        // No scene background or fog to change anymore
    }

    resetAppearance() {
        this.stonePath.reset();
    }

    updateSize() {
        this.camera.aspect = this.renderDiv.clientWidth / this.renderDiv.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.renderDiv.clientWidth, this.renderDiv.clientHeight);
    }
}