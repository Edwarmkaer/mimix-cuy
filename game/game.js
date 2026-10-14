import * as THREE from 'three';
import { SceneSetup } from './sceneSetup.js';
import { runnerSpeed, lookAhead } from './difficulty.js';
import { CharacterAura } from './character-aura.js';
import { Coins } from './coins.js';
import { Powerups } from './powerups.js';
import { PowerupState } from './powerup-rules.js';
import { Player } from './player.js';
// Removed PlatformManager import
import { LavaManager } from './lavaManager.js'; // Import LavaManager
import { LANES, LANE_WIDTH, INITIAL_GAME_SPEED } from './constants.js'; // Import speed constants

export class Game {
    constructor(renderDiv, updateScoreCallback, showGameOverCallback, updatePowerCallback = () => {}) {
        this.renderDiv = renderDiv;
        this.updatePowerCallback = updatePowerCallback;
        this.power = new PowerupState();
        this.updateScoreCallback = updateScoreCallback; // Store the score callback
        this.showGameOverCallback = showGameOverCallback; // Store the game over callback
        this.sceneSetup = new SceneSetup(renderDiv);
        this.scene = this.sceneSetup.scene;
        this.camera = this.sceneSetup.camera;
        this.renderer = this.sceneSetup.renderer;
        this.player = new Player();
        this.scene.add(this.player.mesh);
        this.aura = new CharacterAura(this.player);
        // Removed PlatformManager instantiation
        this.powerups = new Powerups(this.scene, this.player.mesh);
        this.coins = new Coins(this.scene);
        this.lavaManager = new LavaManager(this.scene, (x, z) => this.powerups.spawn(x, z), (x, z, options) => this.coins.spawnRow(x, z, options)); // Instantiate LavaManager
        this.clock = new THREE.Clock();
        this.running = false;
        this.gameOver = false;
        this.score = 0; this.coinCount = 0; this.runSeconds = 0; // Add score property
        this.currentSpeed = INITIAL_GAME_SPEED; // Add current speed state
        this.animationId = null; // Track animation frame ID
        this._update = this._update.bind(this);
        this._resize = this._onWindowResize.bind(this);
        window.addEventListener('resize', this._resize, false);
    }

    start() {
        this._stopGameLoop();
        this._resetGameState();
        this.updateScoreCallback(0, 0);
        this.running = true;
        this.clock.start();
        this._update();
    }

    pause() { this._stopGameLoop(); }
    resume() {
        if (this.running || this.gameOver) return;
        this.running = true; this.clock.start(); this._update();
    }

    dispose() {
        this._stopGameLoop();
        window.removeEventListener('resize', this._resize);
        this.player.disposed = true;
        this.player.mixer?.stopAllAction();
        this.aura.dispose();
        this.lavaManager.dispose();
        this.powerups.dispose(); this.coins.dispose();
        this.sceneSetup.stonePath.dispose();
        this.sceneSetup.galaxy.dispose();
        const released = new Set();
        const release = object => { if (object && !released.has(object)) { released.add(object); object.dispose?.(); } };
        this.scene.traverse(object => {
            release(object.geometry); release(object.skeleton);
            for (const material of [object.material].flat()) {
                if (!material) continue;
                for (const value of Object.values(material)) if (value?.isTexture) release(value);
                release(material);
            }
        });
        this.renderer.dispose(); this.renderer.domElement.remove();
    }

    stop() {
        console.log("Game stopping...");
        this._stopGameLoop();
        this.gameOver = true;
        // Preserve current speed and score for game over display
    }

    _stopGameLoop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            console.log("Game loop cancelled");
        }
    }

    _resetGameState() {
        // Reset all game variables to initial state
        this.score = 0; this.coinCount = 0; this.runSeconds = 0;
        this.currentSpeed = INITIAL_GAME_SPEED;
        this.running = false; // Will be set to true after reset
        this.gameOver = false;

        // Reset all game components
        this.lavaManager.reset();
        this.power.reset(); this.powerups.reset(); this.coins.reset(); this.updatePowerCallback(0);
        this.player.reset(); this.aura.reset();
        this.sceneSetup.resetAppearance();
        this.sceneSetup.resetCamera();

        // Reset the clock
        this.clock.stop();
        this.clock = new THREE.Clock(); // Create a fresh clock

        console.log("Game state reset - Score:", this.score, "Speed:", this.currentSpeed);
    }

    isRunning() {
        return this.running && !this.gameOver;
    }

    getPlayer() {
        return this.player;
    }

    _update() {
        // Store the animation ID immediately
        this.animationId = requestAnimationFrame(this._update);

        // Exit immediately if not running
        if (!this.running || this.gameOver) {
            this._stopGameLoop();
            return;
        }

        const deltaTime = Math.min(this.clock.getDelta(), 0.05);

        // Double-check running state after getting delta time
        if (!this.running || this.gameOver) {
            this._stopGameLoop();
            return;
        }

        // Increase speed over time
        this.runSeconds += deltaTime;
        this.currentSpeed = runnerSpeed(this.runSeconds);

        const scoreTime = this.power.advance(deltaTime);

        // Update game objects
        this.sceneSetup.galaxy.update(deltaTime * 0.35, this.currentSpeed / INITIAL_GAME_SPEED);
        this.sceneSetup.stonePath.update(deltaTime, this.currentSpeed);
        const far = lookAhead(this.currentSpeed) + 80;
        if (far > this.camera.far) { this.camera.far = far; this.camera.updateProjectionMatrix(); }
        this.player.update(deltaTime);
        this.lavaManager.update(deltaTime, this.player.mesh.position.z, this.currentSpeed, this.score);

        this.powerups.update(deltaTime, this.currentSpeed, this.player.mesh, this.power);
        const collected = this.coins.update(deltaTime, this.currentSpeed, this.player.mesh.position);
        this.coinCount += collected;
        this.score += collected * (this.power.active ? 20 : 10);
        if (collected) this.aura.collectedCoin();
        this.aura.update(deltaTime, this.power.remaining);
        this.updatePowerCallback(this.power.remaining);

        // Update Score
        const SCORE_RATE = 10; // Points per second
        this.score += scoreTime * SCORE_RATE;
        this.updateScoreCallback(Math.floor(this.score), this.coinCount);

        // Collision Checks / Game Over Conditions
        const hitLava = this.lavaManager.checkCollision(this.player);

        if (hitLava && !this.power.active) {
            console.log("Game Over - Hit Lava! Final Score:", Math.floor(this.score), "Final Speed:", this.currentSpeed.toFixed(2));
            this.gameOver = true;
            this.running = false;
            this._stopGameLoop(); // Immediately stop the loop
            this.sceneSetup.setGameOverBackground();
            this.showGameOverCallback(this.score);
            return; // Exit immediately
        }

        // Adjust camera to follow player's lane smoothly
        const targetCameraX = LANES[this.player.currentLane];
        const cameraFollowSpeed = 1 - Math.exp(-8 * deltaTime);
        this.camera.position.x += (targetCameraX - this.camera.position.x) * cameraFollowSpeed;

        // Update Directional Light Position and Target
        const dirLight = this.sceneSetup.directionalLight;
        if (dirLight) {
            dirLight.position.copy(this.camera.position);
            dirLight.target.position.copy(this.player.mesh.position);
            dirLight.target.updateMatrixWorld();
        }

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }

    _onWindowResize() {
        this.sceneSetup.updateSize();
    }
}
