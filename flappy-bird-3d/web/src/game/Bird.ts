import * as THREE from "three";
import gsap from "gsap";
import {
  MAX_FALL_SPEED,
  BIRD_X,
  BIRD_START_Y,
  BIRD_RADIUS,
  GROUND_Y,
  CEILING_Y,
} from "./constants";

export class Bird {
  group: THREE.Group;
  velocity = 0;
  private leftWing: THREE.Mesh;
  private rightWing: THREE.Mesh;
  private body: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();

    // Body
    const bodyGeom = new THREE.SphereGeometry(BIRD_RADIUS, 16, 10);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf5c542,
      roughness: 0.55,
      metalness: 0.1,
    });
    this.body = new THREE.Mesh(bodyGeom, bodyMat);
    this.group.add(this.body);

    // Belly
    const belly = new THREE.Mesh(
      new THREE.SphereGeometry(BIRD_RADIUS * 0.7, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xfff5cc, roughness: 0.65 })
    );
    belly.position.set(0.06, -0.06, 0);
    belly.scale.set(0.9, 0.8, 0.85);
    this.group.add(belly);

    // Cheeks (blush)
    const cheekMat = new THREE.MeshStandardMaterial({
      color: 0xffaa88,
      roughness: 0.7,
      transparent: true,
      opacity: 0.5,
    });
    for (const zSign of [1, -1]) {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), cheekMat);
      cheek.position.set(0.12, -0.04, 0.2 * zSign);
      this.group.add(cheek);
    }

    // Eyes
    const eyeWhiteGeom = new THREE.SphereGeometry(0.09, 10, 7);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    const pupilGeom = new THREE.SphereGeometry(0.05, 8, 5);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    // Eye highlight
    const highlightGeom = new THREE.SphereGeometry(0.02, 6, 4);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (const zSign of [1, -1]) {
      const white = new THREE.Mesh(eyeWhiteGeom, eyeWhiteMat);
      white.position.set(0.16, 0.1, 0.16 * zSign);
      this.group.add(white);

      const pupil = new THREE.Mesh(pupilGeom, pupilMat);
      pupil.position.set(0.22, 0.12, 0.17 * zSign);
      this.group.add(pupil);

      const hl = new THREE.Mesh(highlightGeom, highlightMat);
      hl.position.set(0.23, 0.15, 0.15 * zSign);
      this.group.add(hl);
    }

    // Beak
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.18, 5),
      new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.35 })
    );
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.35, 0, 0);
    this.group.add(beak);

    // Wings
    const wingGeom = new THREE.BoxGeometry(0.04, 0.2, 0.22);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xe8b830, roughness: 0.5 });
    this.leftWing = new THREE.Mesh(wingGeom, wingMat);
    this.leftWing.position.set(-0.05, 0.05, 0.27);
    this.group.add(this.leftWing);

    this.rightWing = new THREE.Mesh(wingGeom, wingMat.clone());
    this.rightWing.position.set(-0.05, 0.05, -0.27);
    this.group.add(this.rightWing);

    // Tail
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.14, 0.16),
      wingMat.clone()
    );
    tail.position.set(-0.3, 0.08, 0);
    tail.rotation.z = Math.PI / 5;
    this.group.add(tail);

    this.group.position.set(BIRD_X, BIRD_START_Y, 0);
    scene.add(this.group);
  }

  get position() {
    return this.group.position;
  }

  /** Flap with the given upward force. */
  flap(force: number) {
    this.velocity = force;

    gsap.killTweensOf([this.leftWing.rotation, this.rightWing.rotation]);
    for (const [wing, sign] of [
      [this.leftWing, -1],
      [this.rightWing, 1],
    ] as [THREE.Mesh, number][]) {
      gsap.to(wing.rotation, {
        z: sign * 1.0,
        duration: 0.1,
        ease: "power2.out",
        onComplete: () => { gsap.to(wing.rotation, { z: 0, duration: 0.15 }); },
      });
    }

    // Squash & stretch
    gsap.to(this.body.scale, {
      x: 0.85,
      y: 1.15,
      z: 0.85,
      duration: 0.08,
      onComplete: () => { gsap.to(this.body.scale, { x: 1, y: 1, z: 1, duration: 0.15 }); },
    });

    gsap.to(this.group.rotation, { z: 0.5, duration: 0.12, overwrite: "auto" });
  }

  /** Physics tick. */
  update(dt: number, gravity: number) {
    this.velocity += gravity * dt;
    this.velocity = Math.max(this.velocity, MAX_FALL_SPEED);
    this.group.position.y += this.velocity * dt;

    const targetZ = THREE.MathUtils.clamp(this.velocity * 0.07, -1.3, 0.5);
    gsap.to(this.group.rotation, { z: targetZ, duration: 0.25, overwrite: "auto" });
  }

  animateIdle(time: number) {
    this.group.position.y = BIRD_START_Y + Math.sin(time * 2) * 0.15;
    this.group.rotation.z = Math.sin(time * 1.5) * 0.08;
    this.leftWing.rotation.z = Math.sin(time * 4) * -0.2;
    this.rightWing.rotation.z = Math.sin(time * 4) * 0.2;
  }

  die() {
    gsap.killTweensOf([
      this.group.rotation,
      this.group.position,
      this.body.scale,
      this.leftWing.rotation,
      this.rightWing.rotation,
    ]);
    gsap.to(this.group.rotation, { z: -Math.PI * 2, duration: 0.8, ease: "power2.in" });
    gsap.to(this.group.position, { y: GROUND_Y - 1, duration: 0.6, ease: "power2.in", delay: 0.1 });
  }

  getBounds(): THREE.Sphere {
    return new THREE.Sphere(this.group.position.clone(), BIRD_RADIUS * 0.8);
  }

  isOutOfBounds(): boolean {
    return this.group.position.y < GROUND_Y + BIRD_RADIUS || this.group.position.y > CEILING_Y;
  }

  reset() {
    gsap.killTweensOf([
      this.group.position,
      this.group.rotation,
      this.body.scale,
      this.leftWing.rotation,
      this.rightWing.rotation,
    ]);
    this.group.position.set(BIRD_X, BIRD_START_Y, 0);
    this.group.rotation.set(0, 0, 0);
    this.body.scale.set(1, 1, 1);
    this.leftWing.rotation.set(0, 0, 0);
    this.rightWing.rotation.set(0, 0, 0);
    this.velocity = 0;
  }
}
