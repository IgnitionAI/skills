import * as THREE from 'three/webgpu';
import { Fn, uniform, float, vec3, uv, instanceIndex, instancedArray } from 'three/tsl';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const forced = new URLSearchParams(location.search).has('webgl');
const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL: forced });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
stage.append(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b1526');
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
camera.position.set(0, 1, 7);
camera.lookAt(0, 0, 0);
const elapsed = uniform(0);
const amplitude = uniform(0.6);
const material = new THREE.SpriteNodeMaterial({ transparent:true, depthWrite:false });
const angle = instanceIndex.toFloat().mul(Math.PI * 2 / 257);
material.positionNode = vec3(
  angle.cos().mul(2),
  angle.sin().mul(1.2).add(angle.mul(5).add(elapsed).sin().mul(amplitude)),
  angle.mul(3).add(elapsed.mul(0.4)).cos().mul(0.5)
);
material.scaleNode = float(0.065);
material.colorNode = vec3(0.3, angle.sin().mul(0.15).add(0.75), 1);
material.opacityNode = uv().sub(0.5).length().smoothstep(0.24, 0.5).oneMinus();
const sprites = new THREE.Sprite(material);
sprites.count = 257;
sprites.frustumCulled = false; // Shader-driven positions; tiny bounded validation scene.
scene.add(sprites);
const resize = new ResizeObserver(() => {
  const w = stage.clientWidth, h = stage.clientHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
});
resize.observe(stage);
let paused = false, testing = false, prev = 0, frames = 0, backend = '';
let errors = [];
renderer.onError = (error) => { errors.push(String(error?.message ?? error)); $('results').textContent = 'Erreur GPU : '+errors.at(-1); };
$('amplitude').addEventListener('input', e => {
  amplitude.value = Number(e.target.value); $('amplitudeValue').value = amplitude.value.toFixed(1);
});
$('pause').onclick = () => { paused=!paused; $('pause').textContent=paused?'Reprendre':'Pause'; };
$('reset').onclick = () => { elapsed.value=0; amplitude.value=0.6; $('amplitude').value='0.6'; $('amplitudeValue').value='0.6'; };

const count = 257; // Deliberately not aligned to a typical workgroup.
const ages = instancedArray(count, 'float');
const step = uniform(0.25);
const decay = uniform(0.4);
const init = Fn(() => { ages.element(instanceIndex).assign(0); })().compute(count);
const advance = Fn(() => {
  const age = ages.element(instanceIndex);
  age.assign(age.add(decay.mul(step)).min(1));
})().compute(count);
const erroneous = Fn(() => {
  ages.element(instanceIndex).assign(decay.mul(step).min(1));
})().compute(count);

$('tests').onclick = async () => {
  if (testing) return;
  if (!renderer.backend.isWebGPUBackend) {
    $('results').textContent='Rendu WebGL2 actif. Ce laboratoire réserve le test de storage/readback au backend WebGPU ; compute WebGL2 non testé.';
    return;
  }
  testing=true; $('tests').disabled=true;
  const rows=[];
  const check = (label, ok, detail) => { rows.push(`${ok?'PASS':'FAIL'} — ${label} : ${detail}`); if(!ok) throw Error(rows.at(-1)); };
  const read = async () => new Float32Array(await renderer.getArrayBufferAsync(ages.value));
  const close = (values, x) => values.length>=count && values.slice(0,count).every(v=>Number.isFinite(v)&&Math.abs(v-x)<1e-5);
  try {
    await renderer.compileComputeAsync([init, advance, erroneous]);
    renderer.compute(init);
    for(let i=0;i<3;i++) renderer.compute(advance);
    let data=await read();
    check('Accumulation après 3 pas',close(data,0.3),`${data[0].toFixed(6)} attendu 0.300000 ; ${count} éléments`);
    for(let i=0;i<20;i++) renderer.compute(advance);
    data=await read(); check('Saturation',close(data,1),`${data[0].toFixed(6)} attendu 1.000000`);
    renderer.compute(init); data=await read(); check('Reset 1',close(data,0),'tous les éléments à zéro');
    for(let i=0;i<3;i++) renderer.compute(erroneous);
    data=await read(); check('Contrôle négatif détecté',close(data,0.1)&&!close(data,0.3),`${data[0].toFixed(6)} : incrément écrasant, accumulation absente`);
    renderer.compute(init); data=await read(); check('Reset 2',close(data,0),'réinitialisation répétable');
    check('Erreurs backend',errors.length===0,errors.length+' erreur');
    $('results').textContent=rows.join('\n');
  } catch(e) { $('results').textContent=rows.join('\n')+'\n'+e.message; console.error(e); }
  finally { testing=false; $('tests').disabled=false; }
};

try {
  await renderer.init();
  backend=renderer.backend.isWebGPUBackend?'WebGPU':'WebGL2';
  renderer.setAnimationLoop((now) => {
    const dt=prev?Math.min((now-prev)/1000,0.05):0; prev=now;
    if(!paused&&!testing) elapsed.value+=dt;
    renderer.render(scene,camera); frames++;
    if(frames%30===0||frames===1) $('status').textContent=`${backend} · Three r${THREE.REVISION} · 257 sprites · amplitude ${amplitude.value.toFixed(1)} · temps ${elapsed.value.toFixed(2)} s · ${paused?'en pause':'animation active'}`;
  });
} catch(e) { $('status').textContent='Échec initialisation : '+e.message; console.error(e); }
window.addEventListener('pagehide', () => {
  renderer.setAnimationLoop(null); resize.disconnect(); material.dispose();
  init.dispose(); advance.dispose(); erroneous.dispose(); renderer.dispose();
},{once:true});
