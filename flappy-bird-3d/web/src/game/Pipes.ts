import * as THREE from "three";
import gsap from "gsap";
import {
  PIPE_RADIUS,
  PIPE_CAP_RADIUS,
  PIPE_CAP_HEIGHT,
  PIPE_SPAWN_X,
  PIPE_DESPAWN_X,
  GROUND_Y,
  CEILING_Y,
  type SceneTheme,
} from "./constants";

interface PipePair {
  group: THREE.Group;
  gapCenterY: number;
  gapWidth: number;
  scored: boolean;
}

export class PipeManager {
  private scene: THREE.Scene;
  private pipes: PipePair[] = [];
  score = 0;

  pipeMat: THREE.MeshStandardMaterial;
  capMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.pipeMat = new THREE.MeshStandardMaterial({
      color: 0x4caf50,
      roughness: 0.4,
      metalness: 0.2,
    });
    this.capMat = new THREE.MeshStandardMaterial({
      color: 0x388e3c,
      roughness: 0.3,
      metalness: 0.3,
    });
  }

  // ── Theme colors ───────────────────────────────────
  transitionTheme(theme: SceneTheme, duration: number) {
    const pc = new THREE.Color(theme.pipeColor);
    const cc = new THREE.Color(theme.pipeCapColor);
    gsap.to(this.pipeMat.color, { r: pc.r, g: pc.g, b: pc.b, duration, ease: "power2.inOut" });
    gsap.to(this.capMat.color, { r: cc.r, g: cc.g, b: cc.b, duration, ease: "power2.inOut" });

    // Emissive glow (neon theme)
    this.pipeMat.emissive.set(theme.pipeEmissive);
    this.capMat.emissive.set(theme.pipeCapColor);
    gsap.to(this.pipeMat, { emissiveIntensity: theme.pipeEmissiveIntensity, duration });
    gsap.to(this.capMat, {
      emissiveIntensity: theme.pipeEmissiveIntensity > 0 ? theme.pipeEmissiveIntensity * 0.8 : 0,
      duration,
    });
  }

  // ── Pipe creation ──────────────────────────────────
  private createPipePair(gapCenterY: number, gapWidth: number): THREE.Group {
    const group = new THREE.Group();

    // Bottom pipe
    const bottomTop = gapCenterY - gapWidth / 2;
    const bottomHeight = bottomTop - (GROUND_Y - 1);
    if (bottomHeight > 0) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(PIPE_RADIUS, PIPE_RADIUS, bottomHeight, 16),
        this.pipeMat
      );
      pipe.position.y = (GROUND_Y - 1) + bottomHeight / 2;
      group.add(pipe);

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(PIPE_CAP_RADIUS, PIPE_CAP_RADIUS, PIPE_CAP_HEIGHT, 16),
        this.capMat
      );
      cap.position.y = bottomTop - PIPE_CAP_HEIGHT / 2;
      group.add(cap);
    }

    // Top pipe
    const topBottom = gapCenterY + gapWidth / 2;
    const topHeight = CEILING_Y + 3 - topBottom;
    if (topHeight > 0) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(PIPE_RADIUS, PIPE_RADIUS, topHeight, 16),
        this.pipeMat
      );
      pipe.position.y = topBottom + topHeight / 2;
      group.add(pipe);

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(PIPE_CAP_RADIUS, PIPE_CAP_RADIUS, PIPE_CAP_HEIGHT, 16),
        this.capMat
      );
      cap.position.y = topBottom + PIPE_CAP_HEIGHT / 2;
      group.add(cap);
    }

    return group;
  }

  spawnPipe(gapWidth: number) {
    const margin = 1.0;
    const minY = GROUND_Y + margin + gapWidth / 2;
    const maxY = CEILING_Y - margin - gapWidth / 2;
    const gapCenterY = minY + Math.random() * (maxY - minY);

    const group = this.createPipePair(gapCenterY, gapWidth);
    group.position.x = PIPE_SPAWN_X;

    // Entrance animation
    group.scale.set(0, 0, 0);
    gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "back.out(1.5)" });

    this.scene.add(group);
    this.pipes.push({ group, gapCenterY, gapWidth, scored: false });
  }

  update(dt: number, speed: number) {
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.group.position.x -= speed * dt;

      if (pipe.group.position.x < PIPE_DESPAWN_X) {
        this.scene.remove(pipe.group);
        pipe.group.traverse((obj) => {
          if (obj instanceof THREE.Mesh) obj.geometry.dispose();
        });
        this.pipes.splice(i, 1);
      }
    }
  }

  /** Returns true when a new point is scored. */
  checkScore(birdX: number): boolean {
    for (const pipe of this.pipes) {
      if (!pipe.scored && pipe.group.position.x < birdX) {
        pipe.scored = true;
        this.score++;

        // Flash green on score
        pipe.group.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            const mat = (obj.material as THREE.MeshStandardMaterial).clone();
            obj.material = mat;
            const orig = mat.color.clone();
            mat.emissive.set(0x88ff88);
            mat.emissiveIntensity = 0.6;
            gsap.to(mat, {
              emissiveIntensity: 0,
              duration: 0.4,
              onComplete: () => { mat.color.copy(orig); },
            });
          }
        });

        return true;
      }
    }
    return false;
  }

  checkCollision(birdSphere: THREE.Sphere): boolean {
    const bp = birdSphere.center;
    const r = birdSphere.radius;

    for (const pipe of this.pipes) {
      const px = pipe.group.position.x;
      if (Math.abs(px - bp.x) > PIPE_CAP_RADIUS + r) continue;

      const gapTop = pipe.gapCenterY + pipe.gapWidth / 2;
      const gapBottom = pipe.gapCenterY - pipe.gapWidth / 2;
      if (bp.y + r > gapTop || bp.y - r < gapBottom) return true;
    }
    return false;
  }

  getLastPipeX(): number {
    if (this.pipes.length === 0) return -Infinity;
    return this.pipes[this.pipes.length - 1].group.position.x;
  }

  reset() {
    for (const pipe of this.pipes) {
      this.scene.remove(pipe.group);
      pipe.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
    }
    this.pipes = [];
    this.score = 0;
  }

  dispose() {
    this.reset();
    this.pipeMat.dispose();
    this.capMat.dispose();
  }
}
