import * as THREE from "three";
import gsap from "gsap";
import { Bird } from "./Bird";
import { PipeManager } from "./Pipes";
import { Environment } from "./Environment";
import {
  PIPE_SPAWN_X,
  BIRD_X,
  SCENE_CHANGE_INTERVAL,
  THEMES,
  DIFFICULTIES,
  type Difficulty,
  type DifficultyConfig,
} from "./constants";

export type GameState = "idle" | "playing" | "dead";

export interface GameCallbacks {
  onScoreChange?: (score: number) => void;
  onGameOver?: (score: number) => void;
  onStateChange?: (state: GameState) => void;
  onThemeChange?: (name: string) => void;
}

export class FlappyBirdGame {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private bird: Bird;
  private pipeManager: PipeManager;
  private environment: Environment;

  private state: GameState = "idle";
  private score = 0;
  private animationId: number | null = null;
  private clock: THREE.Clock;
  private elapsedTime = 0;

  private difficulty: DifficultyConfig = DIFFICULTIES.rookie;
  private callbacks: GameCallbacks;

  // Input bindings
  private boundKey: (e: KeyboardEvent) => void;
  private boundPointer: (e: MouseEvent | TouchEvent) => void;
  private resizeObs: ResizeObserver;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks = {}) {
    this.callbacks = callbacks;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xc8e6ff, 15, 30);

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 50);
    this.camera.position.set(1, 0.5, 10);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Objects
    this.environment = new Environment(this.scene);
    this.bird = new Bird(this.scene);
    this.pipeManager = new PipeManager(this.scene);

    // Input
    this.boundKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        this.handleInput();
      }
    };
    this.boundPointer = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      this.handleInput();
    };
    window.addEventListener("keydown", this.boundKey);
    canvas.addEventListener("mousedown", this.boundPointer);
    canvas.addEventListener("touchstart", this.boundPointer, { passive: false });

    // Resize
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(canvas);

    // Loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  // ── Public API ─────────────────────────────────────
  setDifficulty(key: Difficulty) {
    this.difficulty = DIFFICULTIES[key];
  }

  restart() {
    this.state = "idle";
    this.score = 0;
    this.bird.reset();
    this.pipeManager.reset();
    this.environment.reset();
    this.callbacks.onStateChange?.("idle");
  }

  dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener("keydown", this.boundKey);
    const c = this.renderer.domElement;
    c.removeEventListener("mousedown", this.boundPointer);
    c.removeEventListener("touchstart", this.boundPointer);
    this.resizeObs.disconnect();
    this.pipeManager.dispose();
    this.renderer.dispose();
  }

  // ── Private ────────────────────────────────────────
  private handleInput() {
    if (this.state === "idle") {
      this.start();
      this.bird.flap(this.difficulty.flapForce);
    } else if (this.state === "playing") {
      this.bird.flap(this.difficulty.flapForce);
    }
  }

  private start() {
    this.state = "playing";
    this.score = 0;
    this.bird.reset();
    this.pipeManager.reset();
    this.environment.reset();
    this.callbacks.onScoreChange?.(0);
    this.callbacks.onStateChange?.("playing");
  }

  private die() {
    this.state = "dead";
    this.bird.die();
    this.callbacks.onGameOver?.(this.score);
    this.callbacks.onStateChange?.("dead");

    // Camera shake
    const ox = this.camera.position.x;
    const oy = this.camera.position.y;
    gsap.to(this.camera.position, {
      x: ox + 0.15,
      y: oy - 0.1,
      duration: 0.05,
      repeat: 5,
      yoyo: true,
      ease: "power2.inOut",
      onComplete: () => {
        this.camera.position.x = ox;
        this.camera.position.y = oy;
      },
    });
  }

  /** Determine theme index from score. */
  private themeIndexForScore(s: number): number {
    const idx = Math.floor(s / SCENE_CHANGE_INTERVAL);
    return Math.min(idx, THEMES.length - 1);
  }

  /** Score particles. */
  private spawnScoreParticles() {
    const pos = this.bird.position.clone();
    const baseMat = new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 1 });
    const geom = new THREE.OctahedronGeometry(0.06, 0);

    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(geom, baseMat.clone());
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const angle = (i / 10) * Math.PI * 2;
      const dist = 0.5 + Math.random() * 0.6;
      gsap.to(mesh.position, {
        x: pos.x + Math.cos(angle) * dist,
        y: pos.y + Math.sin(angle) * dist + 0.6,
        z: pos.z + (Math.random() - 0.5) * 0.5,
        duration: 0.6,
        ease: "power2.out",
      });
      gsap.to(mesh.material as THREE.MeshBasicMaterial, {
        opacity: 0,
        duration: 0.6,
        onComplete: () => {
          this.scene.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
        },
      });
      gsap.to(mesh.scale, { x: 0, y: 0, z: 0, duration: 0.6 });
    }
  }

  // ── Render loop ────────────────────────────────────
  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsedTime += dt;
    const d = this.difficulty;

    if (this.state === "playing") {
      this.bird.update(dt, d.gravity);
      this.pipeManager.update(dt, d.pipeSpeed);

      // Spawn pipes
      const lastX = this.pipeManager.getLastPipeX();
      if (lastX === -Infinity || lastX < PIPE_SPAWN_X - d.pipeSpacing) {
        this.pipeManager.spawnPipe(d.pipeGap);
      }

      // Scoring
      const scored = this.pipeManager.checkScore(BIRD_X);
      if (scored) {
        this.score = this.pipeManager.score;
        this.callbacks.onScoreChange?.(this.score);
        this.spawnScoreParticles();

        // Theme change check
        const newIdx = this.themeIndexForScore(this.score);
        if (newIdx !== this.environment.themeIndex) {
          this.environment.setTheme(newIdx);
          this.pipeManager.transitionTheme(THEMES[newIdx], 2.0);
          this.callbacks.onThemeChange?.(THEMES[newIdx].name);
        }
      }

      // Collision
      if (this.pipeManager.checkCollision(this.bird.getBounds()) || this.bird.isOutOfBounds()) {
        this.die();
      }
    } else if (this.state === "idle") {
      this.bird.animateIdle(this.elapsedTime);
    }

    this.environment.update(dt, this.state === "playing", d.pipeSpeed);

    // Camera follow
    if (this.state === "playing") {
      const ty = this.bird.position.y * 0.15 + 0.5;
      this.camera.position.y += (ty - this.camera.position.y) * 2.5 * dt;
    } else if (this.state === "idle") {
      this.camera.position.y += (0.5 - this.camera.position.y) * dt;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private resize() {
    const c = this.renderer.domElement;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
