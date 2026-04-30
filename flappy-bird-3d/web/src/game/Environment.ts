import * as THREE from "three";
import gsap from "gsap";
import { GROUND_Y, THEMES, type SceneTheme } from "./constants";

/** Tween a THREE.Color toward a hex target. */
function tweenColor(c: THREE.Color, hex: number, dur: number) {
  const t = new THREE.Color(hex);
  if (dur <= 0) {
    c.copy(t);
    return;
  }
  gsap.to(c, { r: t.r, g: t.g, b: t.b, duration: dur, ease: "power2.inOut" });
}

// ─── Procedural textures ─────────────────────────────────────
function createGrassTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#7cb342";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const h = 3 + Math.random() * 10;
    const hue = 80 + Math.random() * 40;
    const light = 30 + Math.random() * 30;
    ctx.strokeStyle = `hsl(${hue}, 65%, ${light}%)`;
    ctx.lineWidth = 0.8 + Math.random() * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, y - h);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2);
  return tex;
}

function createDirtTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#795548";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 3;
    const light = 25 + Math.random() * 20;
    ctx.fillStyle = `hsl(20, 30%, ${light}%)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  return tex;
}

// ─── Environment class ───────────────────────────────────────
export class Environment {
  private scene: THREE.Scene;
  private groundWidth = 25;

  // Scrolling ground segments
  private ground1: THREE.Mesh;
  private ground2: THREE.Mesh;

  // Shared material refs (for tweening)
  private skyMat: THREE.ShaderMaterial;
  private groundMat: THREE.MeshStandardMaterial;
  private dirtMat: THREE.MeshStandardMaterial;
  private hillMat1: THREE.MeshStandardMaterial;
  private hillMat2: THREE.MeshStandardMaterial;
  private cloudMat: THREE.MeshStandardMaterial;
  private hemiLight: THREE.HemisphereLight;
  private dirLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;

  // Decorations
  private clouds: THREE.Group[] = [];
  private sun: THREE.Group;
  private moon: THREE.Group;
  private stars: THREE.Points;
  private neonGrid: THREE.GridHelper;

  private currentThemeIdx = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // ── Sky ────────────────────────────────────────────
    const theme0 = THEMES[0];
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(theme0.skyTop) },
        bottomColor: { value: new THREE.Color(theme0.skyBottom) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0);
        }`,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), this.skyMat);
    sky.position.set(0, 3, -15);
    scene.add(sky);

    // ── Hills ──────────────────────────────────────────
    this.hillMat1 = new THREE.MeshStandardMaterial({ color: theme0.hillColor1, roughness: 0.9 });
    this.hillMat2 = new THREE.MeshStandardMaterial({ color: theme0.hillColor2, roughness: 0.9 });
    for (let i = 0; i < 10; i++) {
      const radius = 2 + Math.random() * 3;
      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        i % 2 === 0 ? this.hillMat1 : this.hillMat2
      );
      hill.position.set(-15 + i * 4 + Math.random() * 2, GROUND_Y, -8 - Math.random() * 4);
      hill.scale.y = 0.3 + Math.random() * 0.3;
      scene.add(hill);
    }

    // ── Ground ─────────────────────────────────────────
    const grassTex = createGrassTexture();
    this.groundMat = new THREE.MeshStandardMaterial({
      color: theme0.groundColor,
      map: grassTex,
      roughness: 0.85,
    });
    const groundGeom = new THREE.BoxGeometry(this.groundWidth, 0.5, 8);
    this.ground1 = new THREE.Mesh(groundGeom, this.groundMat);
    this.ground1.position.set(0, GROUND_Y - 0.25, 0);
    scene.add(this.ground1);

    this.ground2 = new THREE.Mesh(groundGeom.clone(), this.groundMat);
    this.ground2.position.set(this.groundWidth, GROUND_Y - 0.25, 0);
    scene.add(this.ground2);

    // Dirt
    const dirtTex = createDirtTexture();
    this.dirtMat = new THREE.MeshStandardMaterial({
      color: theme0.dirtColor,
      map: dirtTex,
      roughness: 0.92,
    });
    const dirtGeom = new THREE.BoxGeometry(this.groundWidth, 2, 8);
    const dirt1 = new THREE.Mesh(dirtGeom, this.dirtMat);
    dirt1.position.set(0, -1.0, 0);
    this.ground1.add(dirt1);

    const dirt2 = new THREE.Mesh(dirtGeom.clone(), this.dirtMat);
    dirt2.position.set(0, -1.0, 0);
    this.ground2.add(dirt2);

    // Grass tufts
    const grassTuftMat = new THREE.MeshStandardMaterial({ color: 0x7cb342, roughness: 0.8 });
    const tuftGeom = new THREE.ConeGeometry(0.06, 0.22, 4);
    for (const parent of [this.ground1, this.ground2]) {
      for (let i = 0; i < 35; i++) {
        const t = new THREE.Mesh(tuftGeom, grassTuftMat);
        t.position.set((Math.random() - 0.5) * this.groundWidth, 0.36, (Math.random() - 0.5) * 6);
        parent.add(t);
      }
    }

    // ── Clouds ─────────────────────────────────────────
    this.cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: theme0.cloudOpacity,
    });
    for (let i = 0; i < 14; i++) {
      const cloud = this.createCloud();
      cloud.position.set(Math.random() * 35 - 12, 2 + Math.random() * 4, -2 + (Math.random() - 0.5) * 8);
      cloud.scale.setScalar(0.5 + Math.random() * 0.8);
      scene.add(cloud);
      this.clouds.push(cloud);
    }

    // ── Sun ────────────────────────────────────────────
    this.sun = new THREE.Group();
    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0xffdd44 })
    );
    this.sun.add(sunCore);
    const sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0xffaa22, transparent: true, opacity: 0.12 })
    );
    this.sun.add(sunGlow);
    const sunGlow2 = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0.05 })
    );
    this.sun.add(sunGlow2);
    this.sun.position.set(14, 7, -13);
    scene.add(this.sun);

    // ── Moon ───────────────────────────────────────────
    this.moon = new THREE.Group();
    const moonBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 20, 16),
      new THREE.MeshStandardMaterial({
        color: 0xddddee,
        emissive: 0x445588,
        emissiveIntensity: 0.5,
        roughness: 0.8,
      })
    );
    this.moon.add(moonBody);
    // Craters
    const craterMat = new THREE.MeshStandardMaterial({ color: 0xbbbbcc, roughness: 0.9 });
    for (const pos of [
      [0.3, 0.4, 0.7],
      [-0.2, -0.3, 0.8],
      [0.5, -0.1, 0.65],
    ]) {
      const crater = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), craterMat);
      crater.position.set(pos[0], pos[1], pos[2]);
      this.moon.add(crater);
    }
    const moonGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x667799, transparent: true, opacity: 0.08 })
    );
    this.moon.add(moonGlow);
    this.moon.position.set(10, 7, -10);
    this.moon.visible = false;
    scene.add(this.moon);

    // ── Stars ──────────────────────────────────────────
    const starCount = 400;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 55;
      starPositions[i * 3 + 1] = 1 + Math.random() * 14;
      starPositions[i * 3 + 2] = -6 - Math.random() * 12;
      starSizes[i] = 0.5 + Math.random() * 2.0;
    }
    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeom.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    });
    this.stars = new THREE.Points(starGeom, starMat);
    scene.add(this.stars);

    // ── Neon grid ──────────────────────────────────────
    this.neonGrid = new THREE.GridHelper(30, 50, 0x00e5ff, 0x4a148c);
    this.neonGrid.position.y = GROUND_Y + 0.26;
    (this.neonGrid.material as THREE.Material).transparent = true;
    (this.neonGrid.material as THREE.Material).opacity = 0;
    scene.add(this.neonGrid);

    // ── Lighting ───────────────────────────────────────
    this.hemiLight = new THREE.HemisphereLight(theme0.hemiSky, theme0.hemiGround, theme0.hemiIntensity);
    scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(theme0.dirColor, theme0.dirIntensity);
    this.dirLight.position.set(5, 10, 7);
    scene.add(this.dirLight);

    this.fillLight = new THREE.DirectionalLight(theme0.fillColor, theme0.fillIntensity);
    this.fillLight.position.set(-5, 3, 5);
    scene.add(this.fillLight);
  }

  // ── Theme transitions ──────────────────────────────
  get themeIndex() {
    return this.currentThemeIdx;
  }

  setTheme(idx: number, animate = true) {
    if (idx === this.currentThemeIdx && animate) return;
    const theme = THEMES[idx] ?? THEMES[THEMES.length - 1];
    this.currentThemeIdx = idx;
    const dur = animate ? 2.0 : 0;

    // Sky
    tweenColor(this.skyMat.uniforms.topColor.value as THREE.Color, theme.skyTop, dur);
    tweenColor(this.skyMat.uniforms.bottomColor.value as THREE.Color, theme.skyBottom, dur);

    // Fog
    tweenColor((this.scene.fog as THREE.Fog).color, theme.fogColor, dur);

    // Ground & dirt
    tweenColor(this.groundMat.color, theme.groundColor, dur);
    tweenColor(this.dirtMat.color, theme.dirtColor, dur);

    // Hills
    tweenColor(this.hillMat1.color, theme.hillColor1, dur);
    tweenColor(this.hillMat2.color, theme.hillColor2, dur);

    // Clouds
    gsap.to(this.cloudMat, { opacity: theme.cloudOpacity, duration: dur, ease: "power2.inOut" });

    // Lights
    tweenColor(this.hemiLight.color, theme.hemiSky, dur);
    tweenColor(this.hemiLight.groundColor, theme.hemiGround, dur);
    gsap.to(this.hemiLight, { intensity: theme.hemiIntensity, duration: dur });
    tweenColor(this.dirLight.color, theme.dirColor, dur);
    gsap.to(this.dirLight, { intensity: theme.dirIntensity, duration: dur });
    tweenColor(this.fillLight.color, theme.fillColor, dur);
    gsap.to(this.fillLight, { intensity: theme.fillIntensity, duration: dur });

    // Decorations
    this.transitionDecorations(theme, dur);
  }

  private transitionDecorations(theme: SceneTheme, dur: number) {
    // Sun
    if (theme.showSun) {
      this.sun.visible = true;
      // Move sun position based on theme (lower for sunset)
      const sunY = theme.name === "Sunset" ? 3.5 : 7;
      gsap.to(this.sun.position, { y: sunY, duration: dur });
      this.sun.traverse((c) => {
        if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial && c.material.transparent) {
          gsap.to(c.material, { opacity: c.material.opacity || 0.12, duration: dur });
        }
      });
    } else {
      gsap.to(this.sun.position, {
        y: -5,
        duration: dur,
        onComplete: () => { this.sun.visible = false; },
      });
    }

    // Moon
    if (theme.showMoon) {
      this.moon.visible = true;
      gsap.fromTo(this.moon.position, { y: 2 }, { y: 7, duration: dur, ease: "power2.out" });
    } else {
      gsap.to(this.moon.position, {
        y: -5,
        duration: dur * 0.5,
        onComplete: () => { this.moon.visible = false; },
      });
    }

    // Stars
    const starMat = this.stars.material as THREE.PointsMaterial;
    gsap.to(starMat, {
      opacity: theme.showStars ? 0.9 : 0,
      duration: dur,
      ease: "power2.inOut",
    });

    // Neon grid
    const gridMat = this.neonGrid.material as THREE.Material;
    gsap.to(gridMat, {
      opacity: theme.showGrid ? 0.35 : 0,
      duration: dur,
      ease: "power2.inOut",
    });
  }

  // ── Cloud factory ──────────────────────────────────
  private createCloud(): THREE.Group {
    const cloud = new THREE.Group();
    const puffs = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < puffs; i++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 8, 6),
        this.cloudMat
      );
      puff.position.set((i - puffs / 2) * 0.4, Math.random() * 0.2, Math.random() * 0.2);
      cloud.add(puff);
    }
    return cloud;
  }

  // ── Per-frame update ───────────────────────────────
  update(dt: number, isPlaying: boolean, scrollSpeed: number) {
    // Ground scroll
    if (isPlaying) {
      this.ground1.position.x -= scrollSpeed * dt;
      this.ground2.position.x -= scrollSpeed * dt;
      if (this.ground1.position.x <= -this.groundWidth) {
        this.ground1.position.x = this.ground2.position.x + this.groundWidth;
      }
      if (this.ground2.position.x <= -this.groundWidth) {
        this.ground2.position.x = this.ground1.position.x + this.groundWidth;
      }
    }

    // Cloud drift
    for (const cloud of this.clouds) {
      cloud.position.x -= 0.3 * dt;
      if (cloud.position.x < -16) {
        cloud.position.x = 20;
        cloud.position.y = 2 + Math.random() * 4;
      }
    }

    // Star twinkle
    const starMat = this.stars.material as THREE.PointsMaterial;
    if (starMat.opacity > 0.05) {
      starMat.size = 0.07 + Math.sin(Date.now() * 0.003) * 0.015;
    }
  }

  reset() {
    this.ground1.position.x = 0;
    this.ground2.position.x = this.groundWidth;
    this.setTheme(0, false);
  }
}
