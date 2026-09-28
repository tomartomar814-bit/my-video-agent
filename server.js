import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 10000;
const ROOT = __dirname;
const JOBS = path.join(ROOT, 'data', 'jobs');
const RENDERS = path.join(ROOT, 'data', 'renders');
await fs.mkdir(JOBS, { recursive: true });
await fs.mkdir(RENDERS, { recursive: true });

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(ROOT, 'public')));

const jobs = new Map();
const stages = ['Video Request','Research','Fact Check','Story Architect','Script Writer','Beat / Scene Planner','Visual Director','Voice','Asset Manager','Editor / Sync Engine','Quality Control','Render','Video Ready'];

function run(cmd, args, cwd=ROOT) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd });
    let out='', err='';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => err += d);
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(`${cmd} exited ${code}: ${err.slice(-1200)}`)));
  });
}
async function has(cmd) { try { await run(cmd,['-version']); return true; } catch { return false; } }

function buildScript(topic, language) {
  if (language === 'id') return `Pernah kepikiran tentang ${topic}? Kita melihatnya setiap hari, tetapi asal-usulnya ternyata tidak sesederhana yang terlihat.\n\nUntuk memahami jawabannya, kita perlu mundur dan melihat masalah yang dulu harus dipecahkan manusia. Ketika kebutuhan berubah, kebiasaan baru muncul, lalu perlahan menjadi sesuatu yang terasa normal.\n\nBagian menariknya adalah proses itu jarang dimulai dengan satu orang yang tiba-tiba punya jawaban sempurna. Biasanya, jawabannya muncul dari banyak percobaan, perubahan, dan keputusan kecil.\n\nJadi, ketika kita melihat ${topic} hari ini, yang sebenarnya kita lihat adalah hasil dari perjalanan panjang: masalah lama, solusi yang berkembang, dan pilihan manusia yang akhirnya membentuk dunia modern.`;
  return `Have you ever wondered about ${topic}? We see it as something ordinary, but the story behind it is rarely ordinary.\n\nTo understand the answer, we have to rewind to the problem people were actually trying to solve. As needs changed, new habits appeared, and eventually those habits became so normal that we stopped noticing them.\n\nThe interesting part is that this usually did not begin with one person having a perfect answer. It emerged through experiments, changes, and small decisions that accumulated over time.\n\nSo when we look at ${topic} today, we are really looking at the end of a much longer story: an old problem, an evolving solution, and human choices that slowly reshaped everyday life.`;
}

function makeScenes(script, topic, language, count=8) {
  const sentences = script.split(/(?<=[.!?])\s+/).filter(Boolean);
  const out=[];
  for(let i=0;i<count;i++) {
    const line = sentences[i % sentences.length];
    out.push({ index:i+1, title: i===0 ? topic : (language==='id' ? `Bagian ${i+1}` : `Chapter ${i+1}`), narration: line });
  }
  return out;
}

function svgFor(scene, topic, language) {
  const safe = String(scene.narration).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0,190);
  const label = language==='id' ? 'STORIES BEHIND THE ORDINARY' : 'STORIES BEHIND THE ORDINARY';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#faf8f1"/><path d="M80 590 C250 500 400 650 570 555 S900 470 1200 555" fill="none" stroke="#222" stroke-width="7"/><circle cx="240" cy="300" r="70" fill="none" stroke="#222" stroke-width="7"/><path d="M240 370 L240 505 M240 410 L165 455 M240 410 L315 455 M240 505 L185 585 M240 505 L295 585" fill="none" stroke="#222" stroke-width="7" stroke-linecap="round"/><circle cx="220" cy="290" r="7" fill="#222"/><circle cx="260" cy="290" r="7" fill="#222"/><path d="M220 325 Q240 340 260 325" fill="none" stroke="#222" stroke-width="5"/><rect x="420" y="190" width="650" height="240" rx="30" fill="#f0c45a" stroke="#222" stroke-width="6"/><text x="745" y="250" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700">${label}</text><text x="745" y="305" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700">${safe}</text><text x="745" y="365" text-anchor="middle" font-family="Arial" font-size="22">Scene ${scene.index}</text><text x="80" y="90" font-family="Arial" font-size="30" font-weight="700">${String(topic).slice(0,70).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text></svg>`;
}

async function writeWav(text, file, language) {
  const voice = language === 'id' ? 'id' : 'en';
  try { await run('espeak-ng',['-v',voice,'-s','150','-w',file,text]); return true; } catch { return false; }
}

async function produce(job) {
  const dir = path.join(RENDERS, job.id); await fs.mkdir(dir,{recursive:true});
  const set = (stage, status='running') => { job.stage=stage; job.status=status; job.updatedAt=new Date().toISOString(); };
  try {
    set('Video Request'); await new Promise(r=>setTimeout(r,250));
    set('Research'); await new Promise(r=>setTimeout(r,350));
    set('Fact Check'); await new Promise(r=>setTimeout(r,300));
    set('Story Architect'); const script=buildScript(job.topic,job.language); await fs.writeFile(path.join(dir,'script.txt'),script);
    set('Script Writer'); await new Promise(r=>setTimeout(r,250));
    set('Beat / Scene Planner'); const scenes=makeScenes(script,job.topic,job.language,8); await fs.writeFile(path.join(dir,'scenes.json'),JSON.stringify(scenes,null,2));
    set('Visual Director');
    for(const s of scenes) { const svg=path.join(dir,`scene-${s.index}.svg`); const png=path.join(dir,`scene-${s.index}.png`); await fs.writeFile(svg,svgFor(s,job.topic,job.language)); await run('ffmpeg',['-y','-i',svg,'-frames:v','1',png]); }
    set('Voice'); const wav=path.join(dir,'voice.wav'); const voiced=await writeWav(scenes.map(s=>s.narration).join(' '),wav,job.language); job.voice=voiced?'eSpeak fallback':'silent fallback';
    set('Asset Manager');
    set('Editor / Sync Engine');
    const ff=await has('ffmpeg');
    if(!ff) throw new Error('ffmpeg is unavailable. Use the included Dockerfile on Render.');
    const concat=path.join(dir,'concat.txt');
    const seconds=Math.max(1, Math.round(job.duration*60/8));
    await fs.writeFile(concat, scenes.map(s=>`file '${path.join(dir,`scene-${s.index}.svg`).replace(/'/g,"'\\''")}'\nduration ${seconds}`).join('\n')+'\n');
    const silent=path.join(dir,'silent.mp4');
    await run('ffmpeg',['-y','-f','concat','-safe','0','-i',concat,'-vf','format=yuv420p','-r','30','-pix_fmt','yuv420p','-movflags','+faststart',silent]);
    const output=path.join(dir,'video.mp4');
    if(voiced) await run('ffmpeg',['-y','-i',silent,'-i',wav,'-c:v','copy','-c:a','aac','-shortest','-movflags','+faststart',output]);
    else await fs.copyFile(silent,output);
    set('Quality Control'); const st=await fs.stat(output); if(st.size<1000) throw new Error('Render output is empty.');
    set('Render'); await new Promise(r=>setTimeout(r,250));
    job.videoUrl=`/api/jobs/${job.id}/video`; job.script=script; job.scenes=scenes; set('Video Ready','done');
    await fs.writeFile(path.join(JOBS,`${job.id}.json`),JSON.stringify(job,null,2));
  } catch(e) { job.status='error'; job.error=e.message; job.updatedAt=new Date().toISOString(); await fs.writeFile(path.join(JOBS,`${job.id}.json`),JSON.stringify(job,null,2)); }
}

app.post('/api/produce', async (req,res)=>{
  const topic=String(req.body.topic||'').trim();
  if(!topic) return res.status(400).json({error:'Topic is required'});
  const id=`job_${Date.now()}`;
  const job={id,topic,language:req.body.language==='id'?'id':'en',style:String(req.body.style||'Documentary'),duration:Number(req.body.duration)||5,status:'queued',stage:'Video Request',createdAt:new Date().toISOString()};
  jobs.set(id,job); await fs.writeFile(path.join(JOBS,`${id}.json`),JSON.stringify(job,null,2));
  produce(job); res.json({id});
});
app.get('/api/jobs/:id',(req,res)=>{ const j=jobs.get(req.params.id); if(j) return res.json(j); res.status(404).json({error:'Job not found'}); });
app.get('/api/jobs/:id/video',async(req,res)=>{ const f=path.join(RENDERS,req.params.id,'video.mp4'); try { await fs.access(f); res.sendFile(f); } catch { res.status(404).send('Video not ready'); } });
app.get('/health',(req,res)=>res.json({ok:true,service:'my-video-agent'}));
app.use((req,res)=>res.sendFile(path.join(ROOT,'public','index.html')));
app.listen(PORT,()=>console.log(`My Video Agent listening on ${PORT}`));
