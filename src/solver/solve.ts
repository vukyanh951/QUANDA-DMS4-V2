import resourcesData from '@/knowledge/resources.json';
import type { ProjectAnalysisOutcome } from '@/src/project-analysis/schema';
import type { AgentDelegationGuide, CandidatePath, ExecutionMethod, Language, PipelineTask, ProjectInput, ScoreBreakdown, Solution } from './types';

const APPS:Record<string,string>={blender:'Blender',touchdesigner:'TouchDesigner','davinci-resolve':'DaVinci Resolve','python-opencv':'Python + OpenCV',p5js:'p5.js',threejs:'Three.js','after-effects':'After Effects',houdini:'Houdini',maya:'Maya',illustrator:'Illustrator',vercel:'Vercel'};
const WEIGHTS:Record<keyof ScoreBreakdown,number>={requirements:.24,familiarity:.16,learningCost:.14,executionCost:.11,switchingCost:.1,resourceQuality:.08,deadlineFit:.1,risk:.07};
const official=Object.fromEntries(resourcesData.resources.filter((r)=>r.reliability==='official').flatMap((r)=>r.softwareIds.map((id)=>[id,r.id])));
const tr=(lang:Language,en:string,vi:string)=>lang==='vi'?vi:en;
const has=(text:string,words:string[])=>words.some((word)=>text.includes(word));
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));

type Seed={id:string;apps:string[];human:number;learning:number;agent:number;risk:number};
const seeds=(kind:string):Seed[]=>kind==='installation'?[{id:'td-native',apps:['blender','touchdesigner','davinci-resolve'],human:315,learning:45,agent:0,risk:16},{id:'td-python',apps:['blender','python-opencv','touchdesigner','davinci-resolve'],human:275,learning:105,agent:50,risk:26},{id:'td-lean',apps:['touchdesigner','davinci-resolve'],human:350,learning:70,agent:0,risk:19},{id:'unity-route',apps:['blender','davinci-resolve'],human:390,learning:150,agent:25,risk:34}]
:kind==='creative-web'?[{id:'p5-illustrator-site',apps:['illustrator','p5js','vercel'],human:260,learning:70,agent:60,risk:16},{id:'p5-site',apps:['p5js','vercel'],human:300,learning:90,agent:75,risk:20},{id:'three-creative-site',apps:['threejs','vercel'],human:285,learning:85,agent:95,risk:25}]
:kind==='threejs'?[{id:'three-agent',apps:['threejs','vercel'],human:260,learning:40,agent:95,risk:18},{id:'three-learn',apps:['threejs','vercel'],human:380,learning:150,agent:0,risk:22},{id:'p5-site',apps:['p5js','vercel'],human:300,learning:75,agent:45,risk:28}]
:kind==='poster'?[{id:'p5-poster',apps:['illustrator','p5js'],human:205,learning:55,agent:40,risk:16},{id:'td-poster',apps:['illustrator','touchdesigner'],human:250,learning:100,agent:0,risk:20},{id:'ae-poster',apps:['illustrator','after-effects'],human:235,learning:115,agent:0,risk:18}]
:kind==='geometry'?[{id:'blender-geo',apps:['blender'],human:290,learning:70,agent:0,risk:14},{id:'blender-manual',apps:['blender'],human:390,learning:15,agent:0,risk:19},{id:'houdini-geo',apps:['houdini'],human:285,learning:210,agent:0,risk:30}]
:kind==='animation'?[{id:'blender-only',apps:['blender'],human:330,learning:35,agent:0,risk:13},{id:'blender-resolve',apps:['blender','davinci-resolve'],human:310,learning:55,agent:0,risk:15},{id:'maya-ae',apps:['maya','after-effects'],human:345,learning:190,agent:0,risk:29}]
:[{id:'clarify-project',apps:[],human:25,learning:0,agent:0,risk:45}];

function kindOf(text:string){if(has(text,['touchdesigner','projection','installation','hand tracking','projected','trình chiếu']))return'installation';if(has(text,['three.js','threejs','portfolio','webgl','web-and-creative-coding.library.three-js']))return'threejs';if(has(text,['creative coding','p5.js','p5js','web-and-creative-coding.library.p5-js','web publishing','generative typography','interactive web graphics'])||(has(text,['website','web page','webpage','browser','web experience'])&&has(text,['lyrics','typography','interactive','creative','generative'])))return'creative-web';if(has(text,['bauhaus','poster','react to music','audio-react','âm nhạc','audio-and-music.audio-reactive-technique.frequency-bands']))return'poster';if(has(text,['geometry nodes','procedural vegetation','solarpunk','3d-production.geometry-nodes-technique.vegetation-scatter']))return'geometry';if(has(text,['animation','3d video','3d social','cel-shad','toon shad','3d-production.npr-technique.cel-shading']))return'animation';return'unresolved'}
function appMentions(text:string){return Object.entries(APPS).filter(([,label])=>text.includes(label.toLowerCase())||(label==='Three.js'&&text.includes('three.js'))).map(([id])=>id)}
function mandatory(text:string){return[...new Set(text.split(/[.!?;\n]+/).filter((clause)=>has(clause,['must','mandatory','required','bắt buộc','phải dùng'])).flatMap(appMentions))]}
function methodLabel(lang:Language,m:ExecutionMethod){const labels:Record<ExecutionMethod,[string,string]>={do_yourself:['Do yourself','Tự thực hiện'],delegate_to_agent:['Delegate to agent','Giao cho AI agent'],read_documentation:['Read documentation','Đọc tài liệu'],follow_tutorial:['Focused learning','Học có trọng tâm'],use_example:['Adapt example','Chỉnh sửa ví dụ'],human_review:['Human review','Người dùng duyệt']};return labels[m][lang==='vi'?1:0]}

type TaskSeed={id:string;title:[string,string];objective:[string,string];app:string|null;method:ExecutionMethod;human:number;learn:number;agent:number;tech:string[];why:[string,string]};
function taskSeeds(kind:string,seed:Seed,known:string[]):TaskSeed[]{
 const familiar=(app:string)=>known.includes(app);
 if(kind==='unresolved')return[
  {id:'clarify',title:['Clarify the project requirements','Làm rõ yêu cầu dự án'],objective:['Confirm the medium, deliverable, and required behavior before selecting software.','Xác nhận phương tiện, đầu ra và hành vi bắt buộc trước khi chọn phần mềm.'],app:null,method:'human_review',human:25,learn:0,agent:0,tech:[],why:['The brief does not yet support a defensible software recommendation.','Brief hiện chưa đủ để đề xuất phần mềm có căn cứ.']}
 ];
 if(kind==='installation')return[
  ...(seed.apps.includes('blender')?[{id:'asset',title:['Prepare the flower system','Chuẩn bị hệ thống hoa'] as [string,string],objective:['Create a lightweight asset with growth controls.','Tạo asset nhẹ với điều khiển tăng trưởng.'] as [string,string],app:'blender',method:(familiar('blender')?'do_yourself':'follow_tutorial') as ExecutionMethod,human:70,learn:familiar('blender')?0:30,agent:0,tech:['3d-production.geometry-nodes-technique.vegetation-scatter'],why:['The live scene needs a controllable visual asset.','Cảnh trực tiếp cần asset có thể điều khiển.'] as [string,string]}]:[]),
  ...(seed.apps.includes('python-opencv')?[{id:'bridge',title:['Build the tracking bridge','Tạo cầu nối tracking'] as [string,string],objective:['Send normalized hand landmarks into TouchDesigner.','Gửi landmark tay đã chuẩn hoá vào TouchDesigner.'] as [string,string],app:'python-opencv',method:'delegate_to_agent' as ExecutionMethod,human:35,learn:25,agent:50,tech:['motion-and-animation.interaction-reactive-motion.hand-tracking'],why:['This path separates vision logic from the visual patch.','Lộ trình này tách logic thị giác khỏi patch hình ảnh.'] as [string,string]}]:[]),
  {id:'tracking',title:['Calibrate hand tracking','Hiệu chỉnh tracking bàn tay'],objective:['Turn webcam landmarks into stable control signals.','Biến landmark webcam thành tín hiệu ổn định.'],app:'touchdesigner',method:'read_documentation',human:55,learn:25,agent:0,tech:['motion-and-animation.interaction-reactive-motion.hand-tracking'],why:['Tracking is the required installation input.','Tracking là đầu vào bắt buộc của installation.']},
  {id:'mapping',title:['Map gesture to growth','Ánh xạ cử chỉ vào tăng trưởng'],objective:['Connect movement to the flower growth parameter.','Kết nối chuyển động vào tham số tăng trưởng hoa.'],app:'touchdesigner',method:familiar('touchdesigner')?'do_yourself':'use_example',human:70,learn:familiar('touchdesigner')?0:20,agent:0,tech:['motion-and-animation.interaction-reactive-motion.hand-tracking'],why:['This creates the core cause-and-effect experience.','Đây là tương tác nhân-quả cốt lõi.']},
  {id:'projection',title:['Calibrate the projection scene','Hiệu chỉnh cảnh chiếu'],objective:['Set output, crop, and venue fallback behavior.','Thiết lập đầu ra, crop và dự phòng tại địa điểm.'],app:'touchdesigner',method:'do_yourself',human:75,learn:0,agent:0,tech:['traditional-and-physical-media.installation-technique.projection-mapping'],why:['Venue calibration is required, not optional polish.','Hiệu chỉnh địa điểm là bắt buộc.']},
  ...(seed.apps.includes('davinci-resolve')?[{id:'capture',title:['Capture proof of the final work','Ghi lại bằng chứng tác phẩm'] as [string,string],objective:['Record and trim a short documentation clip.','Ghi và cắt một clip tài liệu ngắn.'] as [string,string],app:'davinci-resolve',method:(familiar('davinci-resolve')?'do_yourself':'read_documentation') as ExecutionMethod,human:45,learn:familiar('davinci-resolve')?0:15,agent:0,tech:[],why:['A concise capture proves the deliverable works.','Bản ghi ngắn chứng minh sản phẩm hoạt động.'] as [string,string]}]:[])
 ];
 if(kind==='creative-web'){
  const creativeApp=seed.apps.includes('p5js')?'p5js':'threejs';
  const creativeTechnique=creativeApp==='p5js'?'web-and-creative-coding.library.p5-js':'web-and-creative-coding.library.three-js';
  return[
   {id:'direction',title:['Design the lyric visual system','Thiết kế hệ hình ảnh cho lời bài hát'],objective:['Define typography, color, motion rules, and reusable visual assets.','Xác định chữ, màu, quy tắc chuyển động và asset hình ảnh tái sử dụng.'],app:seed.apps.includes('illustrator')?'illustrator':null,method:seed.apps.includes('illustrator')&&familiar('illustrator')?'do_yourself':'human_review',human:55,learn:0,agent:0,tech:[],why:['The user already has strong visual-design skills and should own the art direction.','Người dùng có kỹ năng thiết kế mạnh và nên giữ vai trò art direction.']},
   {id:'scaffold',title:['Build the browser experience','Dựng trải nghiệm trên trình duyệt'],objective:['Create the page structure, lyric data, responsive canvas, and playback controls.','Tạo cấu trúc trang, dữ liệu lời bài hát, canvas responsive và điều khiển phát.'],app:creativeApp,method:familiar(creativeApp)?'do_yourself':'delegate_to_agent',human:70,learn:familiar(creativeApp)?0:15,agent:familiar(creativeApp)?0:45,tech:[creativeTechnique],why:['A small working scaffold makes the creative behavior testable early.','Khung hoạt động nhỏ giúp kiểm thử hành vi sáng tạo sớm.']},
   {id:'typography',title:['Create the generative lyric behavior','Tạo hành vi chữ sinh động'],objective:['Map lyric timing and interaction to position, scale, color, and motion.','Ánh xạ thời gian lời bài hát và tương tác vào vị trí, tỉ lệ, màu và chuyển động.'],app:creativeApp,method:familiar(creativeApp)?'do_yourself':'delegate_to_agent',human:95,learn:familiar(creativeApp)?0:25,agent:familiar(creativeApp)?0:35,tech:[creativeTechnique],why:['Generative typography is the requested creative-coding core.','Typography sinh động là cốt lõi creative coding được yêu cầu.']},
   {id:'review',title:['Review lyrics and accessibility','Duyệt lời bài hát và khả năng tiếp cận'],objective:['Verify lyric text, readability, reduced-motion behavior, and mobile controls.','Kiểm tra lời bài hát, độ dễ đọc, chế độ giảm chuyển động và điều khiển di động.'],app:null,method:'human_review',human:35,learn:0,agent:0,tech:[],why:['Only the user can approve the final text and visual pacing.','Chỉ người dùng có thể duyệt nội dung và nhịp hình ảnh cuối.']},
   {id:'deploy',title:['Publish the website','Xuất bản website'],objective:['Run the production build and deploy a shareable Vercel URL.','Chạy production build và deploy URL Vercel có thể chia sẻ.'],app:'vercel',method:'do_yourself',human:20,learn:0,agent:0,tech:[],why:['A working public URL is the required web deliverable.','URL công khai hoạt động là đầu ra web bắt buộc.']}
  ];
 }
 if(kind==='threejs')return[
  {id:'direction',title:['Lock the visual system','Chốt hệ hình ảnh'],objective:['Choose type, color, motion, and one signature interaction.','Chọn chữ, màu, chuyển động và một tương tác đặc trưng.'],app:null,method:'human_review',human:40,learn:0,agent:0,tech:[],why:['Human art direction prevents a generic portfolio.','Art direction của bạn tránh kết quả đại trà.']},
  {id:'scaffold',title:['Scaffold the web experience','Dựng khung trải nghiệm web'],objective:['Create the scene, renderer, and content structure.','Tạo scene, renderer và cấu trúc nội dung.'],app:seed.apps[0],method:seed.id==='three-learn'?'follow_tutorial':'delegate_to_agent',human:70,learn:seed.id==='three-learn'?80:10,agent:seed.id==='three-learn'?0:60,tech:[seed.apps[0]==='p5js'?'web-and-creative-coding.library.p5-js':'web-and-creative-coding.library.three-js'],why:['The foundation is repetitive and easy to validate.','Phần nền có tính lặp và dễ kiểm tra.']},
  {id:'interaction',title:['Build the signature interaction','Xây tương tác đặc trưng'],objective:['Connect pointer, scroll, and motion to scene behavior.','Kết nối con trỏ, cuộn và chuyển động với scene.'],app:seed.apps[0],method:seed.id==='three-learn'?'do_yourself':'delegate_to_agent',human:95,learn:seed.id==='three-learn'?40:10,agent:seed.id==='three-learn'?0:35,tech:[],why:['One strong interaction beats many weak effects.','Một tương tác mạnh hơn nhiều hiệu ứng yếu.']},
  {id:'review',title:['Review content and accessibility','Duyệt nội dung và khả năng truy cập'],objective:['Replace placeholders and verify every link and label.','Thay placeholder và kiểm tra mọi link, nhãn.'],app:null,method:'human_review',human:35,learn:0,agent:0,tech:[],why:['Only you can validate the portfolio story.','Chỉ bạn có thể duyệt câu chuyện portfolio.']},
  {id:'deploy',title:['Ship a Vercel preview','Đưa bản xem trước lên Vercel'],objective:['Run the production build and deploy the repository.','Build production và deploy repository.'],app:'vercel',method:'do_yourself',human:20,learn:0,agent:0,tech:[],why:['A shareable URL is the finish line.','URL chia sẻ được là đích đến.']}
 ];
 if(kind==='poster')return[
  {id:'design',title:['Design the Bauhaus composition','Thiết kế bố cục Bauhaus'],objective:['Set hierarchy, geometry, and a limited color system.','Thiết lập phân cấp, hình học và hệ màu giới hạn.'],app:'illustrator',method:familiar('illustrator')?'do_yourself':'follow_tutorial',human:55,learn:familiar('illustrator')?0:25,agent:0,tech:[],why:['Human composition remains the creative core.','Bố cục của bạn vẫn là cốt lõi sáng tạo.']},
  {id:'audio',title:['Map sound to shape behavior','Ánh xạ âm thanh vào hành vi hình'],objective:['Use frequency bands for scale, color, and rotation.','Dùng dải tần điều khiển kích thước, màu và xoay.'],app:seed.apps[1],method:seed.apps[1]==='p5js'?'delegate_to_agent':'follow_tutorial',human:80,learn:35,agent:seed.apps[1]==='p5js'?40:0,tech:['audio-and-music.audio-reactive-technique.frequency-bands'],why:['Frequency mapping creates testable behavior.','Ánh xạ dải tần tạo hành vi kiểm thử được.']},
  {id:'tune',title:['Tune and export','Tinh chỉnh và xuất bản'],objective:['Reduce noise, test the full track, and export.','Giảm nhiễu, thử toàn bộ track và xuất bản.'],app:seed.apps[1],method:'human_review',human:70,learn:0,agent:0,tech:[],why:['Final tuning is an aesthetic judgment.','Tinh chỉnh cuối là quyết định thẩm mỹ.']}
 ];
 return[
  {id:'block',title:['Lock composition and output','Chốt bố cục và đầu ra'],objective:['Set camera, scale, and the required deliverable.','Đặt camera, tỉ lệ và đầu ra bắt buộc.'],app:seed.apps[0],method:familiar(seed.apps[0])?'do_yourself':'follow_tutorial',human:80,learn:familiar(seed.apps[0])?0:35,agent:0,tech:[],why:['A precise finish line prevents unnecessary work.','Đích đến rõ giúp tránh việc thừa.']},
  {id:'build',title:[kind==='geometry'?'Build procedural vegetation':'Build the core animation',kind==='geometry'?'Tạo thực vật procedural':'Tạo animation cốt lõi'],objective:['Create the required technique inside the production file.','Tạo kỹ thuật cần thiết ngay trong file sản xuất.'],app:seed.apps[0],method:seed.id.includes('manual')?'do_yourself':'follow_tutorial',human:150,learn:seed.id.includes('manual')?0:55,agent:0,tech:[kind==='geometry'?'3d-production.geometry-nodes-technique.vegetation-scatter':'3d-production.npr-technique.cel-shading'],why:['Learning is limited to the one required capability.','Chỉ học năng lực thực sự cần.']},
  {id:'finish',title:['Review and export','Duyệt và xuất bản'],objective:['Run the final checklist and export the required format.','Chạy checklist cuối và xuất đúng định dạng.'],app:seed.apps.at(-1)!,method:'human_review',human:70,learn:0,agent:0,tech:[],why:['The project ends with a verifiable deliverable.','Dự án kết thúc bằng sản phẩm kiểm chứng được.']}
 ];
}

function delegationGuide(task:PipelineTask,input:ProjectInput):AgentDelegationGuide{
 const techniques=task.techniqueIds.length?task.techniqueIds.map((id)=>id.split('.').at(-1)).join(', '):tr(input.language,'None specified','Không chỉ định');
 const deadline=input.deadline||tr(input.language,'Not specified','Không chỉ định');
 const contextChecklist=input.language==='vi'?
  ['Brief dự án và người xem mục tiêu','File, asset hiện có và quyền truy cập repository','Phần mềm, runtime và phiên bản mục tiêu','Deadline, ràng buộc và phần việc đã hoàn thành']:
  ['Project brief and intended audience','Existing files, assets, and repository access','Target software, runtime, and version','Deadline, constraints, and work already completed'];
 const expectedOutputs=input.language==='vi'?
  [`Kết quả ${task.softwareLabel} hoạt động đúng phạm vi`,'Nhật ký thay đổi ngắn gọn kèm file hoặc asset đã sửa','Lệnh, test hoặc kiểm tra trực quan chứng minh kết quả','Giả định, rủi ro và quyết định còn cần con người']:
  [`A working ${task.softwareLabel} result within scope`,'A concise change log naming files or assets changed','Commands, tests, or visual checks that prove the result','Remaining assumptions, risks, and human decisions'];
 const reviewChecklist=input.language==='vi'?
  ['Kết quả đúng mục tiêu, không tự ý redesign rộng','Mỗi điều kiện hoàn thành đều có bằng chứng','Không làm yếu đi ràng buộc đã nêu','Người dùng có thể hiểu, chỉnh sửa và tiếp tục công việc']:
  ['The result matches the objective without a broad redesign','Every definition-of-done item has evidence','No stated constraint was weakened','The user can understand, edit, and continue the work'];
 const prompt=input.language==='vi'?`Bạn là một implementation agent phụ trách đúng một bước có phạm vi rõ ràng. Có thể dùng Claude, Codex hoặc Kimi, nhưng phải tuân thủ cùng hợp đồng công việc này.

BỐI CẢNH DỰ ÁN
Mục tiêu tổng thể: ${input.brief.trim()}
Hạn chót: ${deadline}
Thời gian khả dụng: ${input.hoursPerDay} giờ/ngày
Kỹ năng hiện có: ${input.skills.trim()||'Không nêu'}
Ràng buộc: ${input.constraints.trim()||'Không nêu'}

NHIỆM VỤ CỦA BẠN
Tên bước: ${task.title}
Mục tiêu: ${task.objective}
Công cụ chính: ${task.softwareLabel}
Kỹ thuật liên quan: ${techniques}

QUY ƯỚC LÀM VIỆC
1. Chỉ xử lý nhiệm vụ này; không redesign hoặc refactor phần không liên quan.
2. Đọc file, repository, asset và hướng dẫn được cung cấp trước khi thay đổi.
3. Chỉ hỏi khi thực sự bị chặn; nếu không, nêu rõ giả định hợp lý và tiếp tục.
4. Thay đổi theo từng phần nhỏ, giữ nguyên công việc hiện có và mọi ràng buộc.
5. Kiểm tra kết quả bằng test, lệnh build/chạy hoặc kiểm tra trực quan phù hợp.
6. Không tuyên bố hoàn thành nếu chưa đưa ra bằng chứng; kết quả cuối vẫn cần con người duyệt.

ĐẦU RA BẮT BUỘC
${expectedOutputs.map((item,index)=>`${index+1}. ${item}`).join('\n')}

ĐIỀU KIỆN CHẤP NHẬN
${task.definitionOfDone.map((item,index)=>`${index+1}. ${item}`).join('\n')}

Bắt đầu bằng kế hoạch ngắn, các đầu vào bạn đã có và blocker thật sự nếu có. Sau đó hoàn thành nhiệm vụ, kiểm tra kết quả và kết thúc bằng change log, bằng chứng kiểm tra, giả định và rủi ro còn lại.`:`You are an implementation agent responsible for one bounded project step. You may be Claude, Codex, or Kimi, but you must follow the same working contract.

PROJECT CONTEXT
Overall goal: ${input.brief.trim()}
Deadline: ${deadline}
Available time: ${input.hoursPerDay} hours/day
Existing skills: ${input.skills.trim()||'Not stated'}
Constraints: ${input.constraints.trim()||'None stated'}

YOUR ASSIGNMENT
Step: ${task.title}
Objective: ${task.objective}
Primary tool: ${task.softwareLabel}
Relevant techniques: ${techniques}

WORKING AGREEMENT
1. Keep scope limited to this assignment; do not redesign or refactor unrelated work.
2. Inspect supplied files, repository, assets, and instructions before changing anything.
3. Ask only when genuinely blocked; otherwise state reasonable assumptions and proceed.
4. Work incrementally while preserving existing work and every stated constraint.
5. Validate the result with appropriate tests, build/run commands, or visual checks.
6. Do not claim completion without evidence; the final result still requires human review.

REQUIRED DELIVERABLES
${expectedOutputs.map((item,index)=>`${index+1}. ${item}`).join('\n')}

ACCEPTANCE CRITERIA
${task.definitionOfDone.map((item,index)=>`${index+1}. ${item}`).join('\n')}

Start with a short plan, the inputs you have, and any genuine blockers. Then complete the assignment, validate it, and finish with a change log, validation evidence, assumptions, and remaining risks.`;
 return{compatibleAgents:['Claude','Codex','Kimi'],prompt,contextChecklist,expectedOutputs,reviewChecklist};
}

function tasks(kind:string,seed:Seed,lang:Language,known:string[],input:ProjectInput):PipelineTask[]{
 return taskSeeds(kind,seed,known).map((t)=>{
  const task:PipelineTask={id:t.id,title:tr(lang,...t.title),objective:tr(lang,...t.objective),techniqueIds:t.tech,recommendedSoftwareId:t.app,softwareLabel:t.app?APPS[t.app]:tr(lang,'Software-agnostic','Không phụ thuộc phần mềm'),softwareAgnostic:t.app===null,method:t.method,methodLabel:methodLabel(lang,t.method),resourceIds:(t.method==='read_documentation'||t.method==='follow_tutorial')&&t.app&&official[t.app]?[official[t.app]]:[],estimatedHumanMinutes:t.human,estimatedLearningMinutes:t.learn,estimatedAgentMinutes:t.agent,whyIncluded:tr(lang,...t.why),definitionOfDone:[tr(lang,'The required behavior works.','Hành vi bắt buộc hoạt động.'),tr(lang,'The output can be reviewed or exported.','Đầu ra có thể duyệt hoặc xuất.')],agentDelegation:null};
  return{...task,agentDelegation:t.method==='delegate_to_agent'?delegationGuide(task,input):null};
 });
}
function score(seed:Seed,input:ProjectInput,known:string[],required:string[],capacity:number,kind:string):CandidatePath{
 const missing=required.filter((id)=>!seed.apps.includes(id)),viable=!missing.length,knownCount=seed.apps.filter((id)=>known.includes(id)).length,newApps=seed.apps.length-knownCount,learn=Math.max(0,seed.learning-knownCount*20),work=seed.human+learn,resourceMatches=seed.apps.filter((id)=>official[id]).length;
 const b:ScoreBreakdown={requirements:viable?100:15,familiarity:clamp(44+knownCount/Math.max(1,seed.apps.length)*56),learningCost:clamp(100-learn/2.8),executionCost:clamp(100-seed.human/7.5),switchingCost:clamp(100-newApps*18),resourceQuality:clamp(58+resourceMatches*12),deadlineFit:clamp(capacity/Math.max(1,work)*100),risk:clamp(100-seed.risk*1.7)};
 const pathTasks=tasks(kind,seed,input.language,known,input),pathScore=viable?Math.round(Object.entries(WEIGHTS).reduce((sum,[key,w])=>sum+b[key as keyof ScoreBreakdown]*w,0)):0;
 const strengths=[...(viable?[tr(input.language,'Satisfies every explicit software requirement','Đáp ứng mọi yêu cầu phần mềm')]:[]),...(knownCount?[tr(input.language,`Reuses ${knownCount} familiar tool${knownCount>1?'s':''}`,`Tái sử dụng ${knownCount} công cụ quen thuộc`)]:[]),...(b.deadlineFit>=100?[tr(input.language,'Fits the stated time capacity','Phù hợp quỹ thời gian')]:[])];
 const weaknesses=[...(newApps?[tr(input.language,`Introduces ${newApps} new tool${newApps>1?'s':''}`,`Giới thiệu ${newApps} công cụ mới`)]:[]),...(b.deadlineFit<100?[tr(input.language,'Exceeds the current time capacity','Vượt quỹ thời gian')]:[]),...(resourceMatches===0?[tr(input.language,'No matching verified local resource','Chưa có tài nguyên local phù hợp')]:[])];
 return{id:seed.id,title:seed.apps.length?seed.apps.map((id)=>APPS[id]).join(' → '):tr(input.language,'Clarify project requirements','Làm rõ yêu cầu dự án'),softwareIds:seed.apps,softwareLabels:seed.apps.map((id)=>APPS[id]),tasks:pathTasks,estimatedHumanMinutes:pathTasks.reduce((s,t)=>s+t.estimatedHumanMinutes,0),estimatedLearningMinutes:pathTasks.reduce((s,t)=>s+t.estimatedLearningMinutes,0),estimatedAgentMinutes:pathTasks.reduce((s,t)=>s+t.estimatedAgentMinutes,0),score:pathScore,scoreBreakdown:b,strengths,weaknesses,viable,rejectionReasons:missing.map((id)=>tr(input.language,`Missing required ${APPS[id]}`,`Thiếu ${APPS[id]} bắt buộc`))};
}
export function solveProject(input:ProjectInput,understanding?:ProjectAnalysisOutcome):Solution{
 const explicitText=`${input.brief} ${input.skills} ${input.constraints}`.toLowerCase();
 const enrichment=understanding?Object.values(understanding.analysis).flat().join(' ').toLowerCase():'';
 const text=`${explicitText} ${enrichment} ${understanding?.resolution.techniqueIds.join(' ')??''}`;
 const kind=kindOf(text),explicitRequired=mandatory(`${input.brief}. ${input.constraints}`.toLowerCase()),constraintSoftware=appMentions(input.constraints.toLowerCase()),analyzedRequired=(understanding?.resolution.mandatorySoftwareIds??[]).filter((id)=>constraintSoftware.includes(id)),required=[...new Set([...explicitRequired,...analyzedRequired])],known=[...new Set([...appMentions(input.skills.toLowerCase()),...(understanding?.resolution.softwareIds??[])])];
 const deadline=input.deadline?new Date(`${input.deadline}T23:59:59`):new Date(Date.now()+7*86400000),days=Math.max(1,Math.ceil((deadline.getTime()-Date.now())/86400000)),capacity=Math.round(days*Math.max(.5,input.hoursPerDay)*60);
 const all=seeds(kind).map((seed)=>score(seed,input,known,required,capacity,kind)),viable=all.filter((p)=>p.viable).sort((a,b)=>b.score-a.score),recommended=viable[0]??all.sort((a,b)=>b.score-a.score)[0];
 return{destination:understanding?.analysis.destination??input.brief.trim(),detectedKind:kind,capacityMinutes:capacity,daysAvailable:days,requirements:required.map((id)=>APPS[id]),knownSoftware:known.map((id)=>APPS[id]),recommended,alternatives:viable.slice(1),rejected:all.filter((p)=>!p.viable),skipped:['Maya','Houdini','Generic beginner courses'].filter((label)=>!recommended.softwareLabels.includes(label)).map((label)=>tr(input.language,`${label} — no required advantage for this route`,`${label} — không có lợi thế bắt buộc cho lộ trình này`)),solverVersion:'mvp-rules-1.3.0',scoringVersion:'deterministic-1.0.0'};
}
