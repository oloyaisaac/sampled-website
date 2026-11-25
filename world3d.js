import * as THREE from 'three';

/* The hand-drawn canvas remains as a no-WebGL fallback. The primary scene is
   deliberately built from shared low-poly geometry and instanced details. */
const canvas = document.querySelector('#world3d');
const mobile = matchMedia('(max-width: 600px)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'low-power' });
} catch (error) {
  console.warn('WebGL unavailable; using the illustrated fallback.', error);
  canvas.hidden = true;
}
if (renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 240);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const palette = [
    { zenith: '#20263f', horizon: '#755f70', fog: '#554c60', sun: '#e1a87c', stone: '#b79678', shadow: '#403b4b' },
    { zenith: '#4c526b', horizon: '#d49875', fog: '#a47a70', sun: '#f0c18a', stone: '#d1ad86', shadow: '#564951' },
    { zenith: '#667084', horizon: '#ecb17a', fog: '#b68671', sun: '#ffe0a2', stone: '#d8b58c', shadow: '#615048' },
    { zenith: '#78627a', horizon: '#d79270', fog: '#a97972', sun: '#f0b477', stone: '#c5a080', shadow: '#58464b' },
    { zenith: '#34384d', horizon: '#a46f6c', fog: '#745961', sun: '#e8a96f', stone: '#aa8a71', shadow: '#3b3745' }
  ];
  const color = (hex) => new THREE.Color(hex);
  const skyUniforms = { top: { value: color(palette[0].zenith) }, horizon: { value: color(palette[0].horizon) } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 18), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: skyUniforms,
    vertexShader: 'varying vec3 vWorld; void main(){ vec4 p=modelMatrix*vec4(position,1.0); vWorld=p.xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `
      uniform vec3 top;
      uniform vec3 horizon;
      varying vec3 vWorld;
      void main(){
        float h=normalize(vWorld-cameraPosition).y;
        float t=smoothstep(-0.24,0.72,h);
        gl_FragColor=vec4(mix(horizon,top,t),1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  }));
  sky.renderOrder = -20;
  scene.add(sky);
  scene.fog = new THREE.Fog(color(palette[0].fog), 46, 155);

  const hemi = new THREE.HemisphereLight('#f4d8b5', '#303142', 1.55);
  scene.add(hemi);
  const sunLight = new THREE.DirectionalLight('#ffe1b5', 3.1);
  scene.add(sunLight);
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 16), new THREE.MeshBasicMaterial({ color: palette[0].sun }));
  scene.add(sunMesh);

  const mat = (hex, roughness = .92) => new THREE.MeshStandardMaterial({ color: hex, roughness, metalness: .02 });
  const limestone = mat('#ba9575'), sunlitStone = mat('#d0ae87'), shadowStone = mat('#765c55'), terracotta = mat('#985f50'), roofMat = mat('#9d6251'), darkStone = mat('#41404a'), marble = mat('#d5b995'), arenaMat = mat('#786052'), roadMat = mat('#71635d');
  const box = new THREE.BoxGeometry(1, 1, 1);
  const columnGeo = new THREE.CylinderGeometry(.28, .38, 1, 9, 1);
  const archGeo = new THREE.TorusGeometry(.86, .19, 7, 14, Math.PI);
  const unitCone = new THREE.ConeGeometry(1, 1, 4);
  const temp = new THREE.Object3D();

  function instanced(geometry, material, transforms) {
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    transforms.forEach((t, i) => {
      temp.position.set(t.x, t.y, t.z);
      temp.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0);
      temp.scale.set(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1);
      temp.updateMatrix(); mesh.setMatrixAt(i, temp.matrix);
    });
    mesh.computeBoundingSphere(); scene.add(mesh); return mesh;
  }
  function addBox(x, y, z, sx, sy, sz, material, parent = scene) {
    const mesh = new THREE.Mesh(box, material);
    mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = false; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }

  // Ground, the road stones, and the monumental gate.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 190), mat('#625249'));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.16, -38); scene.add(ground);
  const paving = [];
  for (let z = 40; z > -120; z -= 2.25) for (let x = -4.5; x <= 4.5; x += 1.5) {
    paving.push({ x: x + (Math.random() - .5) * .16, y: -.05, z, sx: 1.38, sy: .09, sz: 2.12, ry: (Math.random() - .5) * .05 });
  }
  instanced(box, roadMat, paving);
  const gateZ = 3.4;
  addBox(-8.15, 4.3, gateZ, 8, 8.8, 2.4, limestone);
  addBox(8.15, 4.3, gateZ, 8, 8.8, 2.4, limestone);
  addBox(0, 8.75, gateZ, 24.3, 1.15, 2.55, sunlitStone);
  addBox(-4.08, 2.55, gateZ, .88, 5.15, 2.65, sunlitStone);
  addBox(4.08, 2.55, gateZ, .88, 5.15, 2.65, sunlitStone);
  const gateArch = new THREE.Mesh(new THREE.TorusGeometry(4.08, .46, 9, 32, Math.PI), sunlitStone);
  gateArch.position.set(0, 5.0, gateZ); scene.add(gateArch);
  const crenels = [];
  for (let x = -12; x <= 12; x += 2.15) crenels.push({ x, y: 9.55, z: gateZ, sx: .8, sy: 1.05, sz: 2.8 });
  instanced(box, limestone, crenels);
  // Long, receding side walls carry the eye toward the city.
  addBox(-13.1, 3.2, -5.5, 1.2, 6.5, 25, shadowStone);
  addBox(13.1, 3.2, -5.5, 1.2, 6.5, 25, shadowStone);

  // Insulae and terracotta roofs: shared geometry, instanced across the hills.
  let seed = 87;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const houses = [], roofs = [];
  for (let side of [-1, 1]) for (let i = 0; i < 22; i++) {
    const z = -7 - i * 1.18 + rand() * .45;
    const x = side * (8.7 + rand() * 10.4);
    const w = 3.1 + rand() * 3.2, d = 3.7 + rand() * 3.6, h = 4.2 + rand() * 8.8;
    houses.push({ x, y: h / 2, z, sx: w, sy: h, sz: d });
    roofs.push({ x, y: h + .45, z, sx: w * .73, sy: .9, sz: d * .76, ry: Math.PI / 4 });
  }
  instanced(box, limestone, houses);
  instanced(unitCone, roofMat, roofs);
  // Small blocks, alleys, and chimney silhouettes add depth without extra draw calls.
  const chimneys = [];
  for (const h of houses) if (rand() > .46) chimneys.push({ x: h.x + (rand() - .5) * h.sx, y: h.sy + .9, z: h.z, sx: .38, sy: .9, sz: .42 });
  instanced(box, terracotta, chimneys);

  // The Colosseum: elliptical tiers, repetitive arcades, and an open arena.
  const colosseum = new THREE.Group(); colosseum.position.set(0, 0, -58); colosseum.scale.set(1.2, 1, 1); scene.add(colosseum);
  const ringGeo = new THREE.CylinderGeometry(8.15, 8.15, .34, 64, 1, true);
  for (let level = 0; level < 4; level++) {
    const ring = new THREE.Mesh(ringGeo, level % 2 ? sunlitStone : limestone);
    ring.position.y = 2.45 + level * 2.85; colosseum.add(ring);
    const columns = [], arches = [];
    const bays = 40, yBase = .4 + level * 2.85;
    for (let i = 0; i < bays; i++) {
      const a = i * Math.PI * 2 / bays;
      const x = 7.9 * Math.sin(a), z = 7.9 * Math.cos(a), mid = a + Math.PI / bays;
      columns.push({ x, y: yBase + 1.16, z, sx: 1, sy: 2.45, sz: 1, ry: a });
      const ax = 7.9 * Math.sin(mid), az = 7.9 * Math.cos(mid);
      arches.push({ x: ax, y: yBase + 2.1, z: az, sx: 1, sy: 1, sz: 1, ry: mid });
    }
    const columnsMesh = new THREE.InstancedMesh(columnGeo, level === 3 ? shadowStone : sunlitStone, columns.length);
    columns.forEach((t, i) => { temp.position.set(t.x,t.y,t.z);temp.rotation.set(0,t.ry,0);temp.scale.set(.72,2.45,.72);temp.updateMatrix();columnsMesh.setMatrixAt(i,temp.matrix) });
    colosseum.add(columnsMesh);
    const archesMesh = new THREE.InstancedMesh(archGeo, level === 3 ? limestone : sunlitStone, arches.length);
    arches.forEach((t,i)=>{temp.position.set(t.x,t.y,t.z);temp.rotation.set(0,t.ry,0);temp.updateMatrix();archesMesh.setMatrixAt(i,temp.matrix)});
    colosseum.add(archesMesh);
  }
  const arenaFloor = new THREE.Mesh(new THREE.CircleGeometry(6.7, 48), arenaMat);
  arenaFloor.rotation.x = -Math.PI / 2; arenaFloor.position.set(0, .12, -58); scene.add(arenaFloor);
  for (let row = 0; row < 5; row++) {
    const seating = new THREE.Mesh(new THREE.CylinderGeometry(4.2 + row * .42, 4.2 + row * .42, .42, 48, 1, true), row % 2 ? terracotta : shadowStone);
    seating.position.set(0, .42 + row * .58, -58); seating.scale.x = 1.25; scene.add(seating);
  }
  // Broken columns on the road between the arena and the Forum.
  const ruins = [];
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1, z = -57 - Math.floor(i / 2) * 1.7, h = 1.1 + rand() * 3.4;
    ruins.push({ x: side * (6.7 + rand() * 4), y: h / 2, z, sx: .55, sy: h, sz: .55 });
  }
  instanced(columnGeo, sunlitStone, ruins);

  // A compact Forum temple with a freestanding colonnade.
  const forumZ = -124;
  addBox(0, .55, forumZ, 17, 1.1, 10, shadowStone);
  addBox(0, 1.18, forumZ, 15.5, .2, 9, sunlitStone);
  const templeColumns = [];
  for (let i = 0; i < 9; i++) templeColumns.push({ x: -6.6 + i * 1.65, y: 3.0, z: forumZ + 3.2, sx: 1, sy: 3.4, sz: 1 });
  for (let i = 0; i < 5; i++) for (const side of [-1,1]) templeColumns.push({ x: side * 6.6, y: 3.0, z: forumZ + 1.5 - i * 1.45, sx: 1, sy: 3.4, sz: 1 });
  const templeMesh = new THREE.InstancedMesh(columnGeo, sunlitStone, templeColumns.length);
  templeColumns.forEach((t,i)=>{temp.position.set(t.x,t.y,t.z);temp.scale.set(.82,3.4,.82);temp.updateMatrix();templeMesh.setMatrixAt(i,temp.matrix)});
  scene.add(templeMesh);
  addBox(0, 4.82, forumZ + 2.4, 15.5, .5, 1.0, limestone);
  const pedimentGeo = new THREE.BufferGeometry();
  pedimentGeo.setAttribute('position', new THREE.Float32BufferAttribute([-7.75,5.05,forumZ+2.9,7.75,5.05,forumZ+2.9,0,8.1,forumZ+2.9],3));
  pedimentGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(pedimentGeo, new THREE.MeshStandardMaterial({ color:'#c7a17a', side:THREE.DoubleSide, roughness:1 })));
  const forumRuins = [];
  for (let i = 0; i < 9; i++) forumRuins.push({ x: -12 + i * 3, y: 2.4 + rand() * .8, z: -115 - rand() * 8, sx: .65, sy: 4.8 + rand() * 1.6, sz: .65 });
  instanced(columnGeo, limestone, forumRuins);

  // A small, fixed point cloud suggests drifting dust; on narrow screens we halve it.
  const dustCount = mobile ? 100 : 230, dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (rand() - .5) * 35;
    dustPositions[i * 3 + 1] = 1 + rand() * 16;
    dustPositions[i * 3 + 2] = 12 - rand() * 95;
  }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color:'#f4d5a8', size:.075, transparent:true, opacity:.42, sizeAttenuation:true, depthWrite:false })));

  const cameraPoints = [
    [0,3.5,42],[0,4.5,0],[0,8,-13],[1,11,-23],[-1,8,-24],[0,7,-38],[0,6,-98],[0,6,-99],[0,6,-100],[0,6,-100]
  ].map(p => new THREE.Vector3(...p));
  const lookPoints = [
    [-3,13.5,3],[0,5,-5],[0,4,-19],[0,4,-29],[0,5,-35],[0,5,-47],[0,4,-108],[0,5,-114],[0,4,-120],[0,3,-130]
  ].map(p => new THREE.Vector3(...p));
  if (mobile) { lookPoints[0].y = 11.5; lookPoints[1].y = 6.5; }
  else { lookPoints[0].y = 17; }
  const cameraPath = new THREE.CatmullRomCurve3(cameraPoints, false, 'centripetal', .5);
  const lookPath = new THREE.CatmullRomCurve3(lookPoints, false, 'centripetal', .5);
  const v3 = new THREE.Vector3();
  let targetProgress = 0, currentProgress = 0, frame = 0;
  let width = innerWidth, height = innerHeight;

  const mixHex = (a,b,t) => color(a).lerp(color(b),t);
  function colorAt(p,key) {
    const scaled = Math.max(0, Math.min(p, .9999)) * (palette.length - 1);
    const i = Math.floor(scaled), t = scaled - i;
    return mixHex(palette[i][key], palette[i + 1][key], t);
  }
  function draw() {
    camera.position.copy(cameraPath.getPoint(currentProgress));
    camera.lookAt(lookPath.getPoint(currentProgress));
    sky.position.copy(camera.position);
    const zenith = colorAt(currentProgress,'zenith'), horizon = colorAt(currentProgress,'horizon'), fog = colorAt(currentProgress,'fog');
    skyUniforms.top.value.copy(zenith); skyUniforms.horizon.value.copy(horizon);
    scene.fog.color.copy(fog);
    const hour = currentProgress * Math.PI;
    sunMesh.position.set(20 - 40 * currentProgress, 12 + 10 * Math.sin(hour), -35 - 20 * currentProgress);
    sunMesh.material.color.copy(colorAt(currentProgress,'sun'));
    sunLight.position.copy(sunMesh.position); sunLight.color.copy(colorAt(currentProgress,'sun'));
    renderer.render(scene,camera);
  }
  function animate() {
    frame = 0;
    const delta = targetProgress - currentProgress;
    currentProgress += reducedMotion ? delta : delta * .16;
    if (reducedMotion || Math.abs(delta) < .0005) currentProgress = targetProgress;
    draw();
    if (currentProgress !== targetProgress) frame = requestAnimationFrame(animate);
  }
  function readScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    targetProgress = THREE.MathUtils.clamp(scrollY / max, 0, 1);
    if (!frame) frame = requestAnimationFrame(animate);
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 600 ? 1.25 : 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix(); draw();
  }
  addEventListener('scroll', readScroll, { passive:true });
  addEventListener('resize', resize, { passive:true });
  readScroll(); draw();
  document.body.classList.add('webgl-ready');
}
