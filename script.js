/* ═══════════════════════════════════════════════════════════════
   REPORT CARD CHECKER — script.js

   OUTPUT FORMAT: mirrors the Y5JK human proofreader style
   · Table 1 — Things to review (grammar, consistency, names)
       cols: Student / Area | Issue type | Current issue | Suggested fix
       "Whole document" rows at top when 3+ students share a pattern
   · Table 2 — Tone and wording to soften
       cols: Student / Area | Issue type | Current wording | Suggested fix
   · Table 3 — Comment and level alignment
       cols: Student / Area | Visible level | Why to check | Possible action

   ACCURACY RULES
   · PDF table: extract by column, never by Y-row
   · Every issue quotes the exact sentence from the report
   · Every suggested fix is the exact corrected sentence
   · Only flag high-confidence issues
   · Student / Area format: "Name - Area" (hyphen)
   · 3+ students with the same issue → one "Whole document" row
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─── WORDS THAT CANNOT BE STUDENT NAMES ─────────────────── */
const NOT_NAMES = new Set([
  'Term','Report','Reports','Card','Cards','Year','Unit','Inquiry','Inquirer',
  'UOI','EAL','ATL','IB','PYP','STEM','PE','Art','Science','Music','Drama',
  'Geography','History','Physical','Education','Technology','Computing','ICT',
  'Mathematics','Maths','Math','English','Language','Reading','Writing',
  'Literacy','Numeracy','Specialist','Grade','Level','Levels',
  'Student','Learner','Learning','Teacher','Primary','Secondary',
  'Profile','Attribute','Attributes','Skills','Skill','Comment','Comments',
  'Emerging','Developing','Achieving','Extending','Secure','Beginning',
  'Approaching','Meeting','Exceeding','High','Support',
  'Progress','Assessment','Feedback','Overview','Summary','Area','Areas',
  'Strengths','Steps','Overall','Curriculum','Class','School','Section',
  'Reflection','Presentation','Exhibition','Central','Idea','Action',
  'Sources','Research','Grammar','Spelling','Punctuation','Communication',
  'Additionally','Furthermore','However','Therefore','Moreover','Although',
  'Because','Since','Whilst','While','When','During','This','Their','These',
  'They','There','That','Which','Who','What','Where','How','With','Through',
  'After','Before','Also','Both','Each','Such','His','Her','Its','Our',
  'She','He','Spring','Autumn','Summer','Winter','Semester','Quarter',
  'Social','Self','Management','Thinking','Arts','General','Moving','Next',
  'Ascot','Google','Doc','Statistics','Probability','Forces','Friction',
  'Gravity','Ancient','Rome','Roman','Story','Mountain','Position','Number',
  'Shape','Space','Data','Handling','Operations','Fractions','Measurement',
  'Geometry','Algebra','The','And','But','For','Not','Beginning','End',
  'First','Last','New','Good','Well','Just','Only','How','Why',
  'Every','All','Whole','Each','Some','Many',
]);

const KNOWN_SUBJECTS = new Set([
  'Math','Maths','Mathematics','Language','English','Literacy',
  'Reading','Writing','UOI','Unit','Inquiry','Learner','Learning',
  'Science','Specialist','Art','Music','Drama','PE','PSPE','Social',
]);

/* ─── AREA NORMALISATION ──────────────────────────────────── */
function normaliseSubject(t){
  t = t.trim();
  if(/math|numer/i.test(t))       return 'Math';
  if(/language|english|literac|reading|writing/i.test(t)) return 'Language';
  if(/uoi|unit\s+of|inquiry|central\s+idea/i.test(t)) return 'UOI';
  if(/learner|personal\s+social|sal\b/i.test(t)) return 'Learner';
  if(/science/i.test(t))          return 'Science';
  if(/specialist|music\b|drama\b|art\b|pe\b|pspe|physical\s+ed|computing|library/i.test(t)) return 'Specialist';
  return t;
}

function detectAreaFromText(text){
  if(/\bmath/i.test(text)||/\bstatistics\b|\bprobability\b|\bfraction|\bgeometry|\bmeasurement/i.test(text)) return 'Math';
  if(/\blanguage\b|\bwriting\b|\breading\b|\bliteracy|\bhistorical\s+fiction|\bpersuasive/i.test(text)) return 'Language';
  if(/\binquiry\b|\buoi\b|\bunit\s+of|\blandform|\bcentral\s+idea/i.test(text)) return 'UOI';
  return 'General';
}

/* ─── UK/US PAIRS ─────────────────────────────────────────── */
const UK_US = [
  { us:/\borganiz(e|es|ed|ing|ation|ational)\b/gi, uk:/\borganis(e|es|ed|ing|ation|ational)\b/gi, usW:'organize', ukW:'organise' },
  { us:/\banalyz(e|es|ed|ing)\b/gi,   uk:/\banalys(e|es|ed|ing)\b/gi,   usW:'analyze',  ukW:'analyse'  },
  { us:/\brecogniz(e|es|ed|ing)\b/gi, uk:/\brecognis(e|es|ed|ing)\b/gi, usW:'recognize',ukW:'recognise'},
  { us:/\bsummariz(e|es|ed|ing)\b/gi, uk:/\bsummaris(e|es|ed|ing)\b/gi, usW:'summarize',ukW:'summarise'},
  { us:/\butiliz(e|es|ed|ing)\b/gi,   uk:/\butilis(e|es|ed|ing)\b/gi,   usW:'utilize',  ukW:'utilise'  },
  { us:/\bbehavior(s|al)?\b/gi,       uk:/\bbehaviour(s|al)?\b/gi,      usW:'behavior', ukW:'behaviour'},
  { us:/\bcenter(s|ed)?\b/gi,         uk:/\bcentre(s|d)?\b/gi,          usW:'center',   ukW:'centre'   },
  { us:/\bcolor(s|ed|ful)?\b/gi,      uk:/\bcolour(s|ed|ful)?\b/gi,     usW:'color',    ukW:'colour'   },
  { us:/\bfavorite(s)?\b/gi,          uk:/\bfavourite(s)?\b/gi,         usW:'favorite', ukW:'favourite'},
  { us:/\blabor(s|ed)?\b/gi,          uk:/\blabour(s|ed)?\b/gi,         usW:'labor',    ukW:'labour'   },
  { us:/\bpracticing\b/gi,            uk:/\bpractising\b/gi,            usW:'practicing',ukW:'practising'},
  { us:/\bprogram(s|med|ming)?\b/gi,  uk:/\bprogramme(s|d|ming)?\b/gi,  usW:'program',  ukW:'programme'},
  { us:/\bmodeling\b/gi,              uk:/\bmodelling\b/gi,             usW:'modeling', ukW:'modelling'},
];

/* ─── KNOWN SPELLING ERRORS ───────────────────────────────── */
const TYPOS = [
  ['recieve','receive'],['recieved','received'],['acheive','achieve'],
  ['acheivement','achievement'],['occured','occurred'],['seperate','separate'],
  ['accomodate','accommodate'],['beleive','believe'],['definately','definitely'],
  ['enviroment','environment'],['grammer','grammar'],['independant','independent'],
  ['knowlege','knowledge'],['neccessary','necessary'],['perseverence','perseverance'],
  ['reccommend','recommend'],['resiliance','resilience'],
  ['communcation','communication'],['collaberation','collaboration'],
  ['succesful','successful'],['untill','until'],['writting','writing'],
  ['develope','develop'],['managment','management'],['relfection','reflection'],
  ['experiance','experience'],['thier','their'],['truely','truly'],
  ['leanring','learning'],['apporach','approach'],['colaborate','collaborate'],
];

/* ─── HELPERS ─────────────────────────────────────────────── */
function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function wc(t)   { return (t.match(/\b[a-zA-Z]+\b/g)||[]).length; }
function cap(s)  { return s.charAt(0).toUpperCase() + s.slice(1); }

/* Returns true only if t looks like a real student name (1–4 title-case words,
   no punctuation, first word not a known non-name keyword). Used to validate
   PDF col0 text before treating it as a student name. */
function isLikelyStudentName(t){
  if(!t || t.length < 2 || t.length > 45) return false;
  if(/[.!?,;:–—()\[\]{}0-9]/.test(t)) return false;
  const words = t.trim().split(/\s+/);
  if(words.length < 1 || words.length > 4) return false;
  if(!words.every(w => /^[A-Z][a-zA-Z''-]{0,20}$/.test(w))) return false;
  if(NOT_NAMES.has(words[0])) return false;
  if(words[0].length < 2) return false;
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   PDF READING — COLUMN-AWARE TABLE EXTRACTION
═══════════════════════════════════════════════════════════════ */
async function readPdfRaw(file){
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data:buf}).promise;
  const allItems = [];
  for(let p=1; p<=pdf.numPages; p++){
    const page    = await pdf.getPage(p);
    const vp      = page.getViewport({scale:1});
    const content = await page.getTextContent();
    content.items.forEach(item=>{
      const t = item.str;
      if(!t||!t.trim()) return;
      allItems.push({
        x:    item.transform[4],
        y:    Math.round(vp.height - item.transform[5]),
        text: t,
        page: p,
      });
    });
  }
  return allItems;
}

function detectTableColumns(allItems){
  const page1 = allItems.filter(i=>i.page===1);
  const yGroups = [];
  page1.forEach(item=>{
    const existing = yGroups.find(g=>Math.abs(g.y - item.y)<=4);
    if(existing) existing.items.push(item);
    else         yGroups.push({y:item.y, items:[item]});
  });
  yGroups.forEach(g=>g.items.sort((a,b)=>a.x-b.x));

  let headerGroup = null;
  for(const g of yGroups){
    const hits = g.items.filter(i=>KNOWN_SUBJECTS.has(i.text.trim()));
    if(hits.length >= 2){ headerGroup = g; break; }
  }
  if(!headerGroup || headerGroup.items.length < 3) return null;

  const hdrItems = headerGroup.items;
  const boundaries = [0];
  for(let i=1; i<hdrItems.length; i++){
    boundaries.push((hdrItems[i-1].x + hdrItems[i].x) / 2);
  }
  const subjects = hdrItems.map(h=>normaliseSubject(h.text.trim()));
  return { boundaries, subjects };
}

function assignCol(x, boundaries){
  let c = 0;
  for(let i=1; i<boundaries.length; i++){
    if(x >= boundaries[i]) c=i;
  }
  return c;
}

function mergeColItems(items){
  const sorted = [...items].sort((a,b)=>
    a.page!==b.page ? a.page-b.page : a.y!==b.y ? a.y-b.y : a.x-b.x);
  const lines = [];
  let cur = null;
  sorted.forEach(item=>{
    if(!cur || item.page!==cur.page || Math.abs(item.y-cur.y)>5){
      if(cur) lines.push(cur);
      cur = {y:item.y, page:item.page, text:item.text};
    } else {
      cur.text += (cur.text.endsWith(' ')||item.text.startsWith(' ') ? '' : ' ') + item.text;
    }
  });
  if(cur) lines.push(cur);
  return lines;
}

function extractPdfTableSegments(allItems, colInfo, manualRoster){
  const { boundaries, subjects } = colInfo;
  const numSubjCols = subjects.length - 1;

  const col0Raw  = [];
  const subjRaw  = Array.from({length:numSubjCols}, ()=>[]);

  allItems.forEach(item=>{
    const c = assignCol(item.x, boundaries);
    if(c === 0)               col0Raw.push(item);
    else if(c <= numSubjCols) subjRaw[c-1].push(item);
  });

  const col0Lines = mergeColItems(col0Raw);
  const subjLines = subjRaw.map(mergeColItems);

  const roster = new Set(manualRoster||[]);
  const LEVEL_RE = /^level$/i;
  const SKIP_RE  = /^(student|name)$/i;

  const studentEntries = [];
  const levelEntries   = [];

  col0Lines.forEach(line=>{
    const t = line.text.trim();
    if(!t || SKIP_RE.test(t)) return;
    if(LEVEL_RE.test(t)){
      levelEntries.push({page:line.page, y:line.y});
    } else if(isLikelyStudentName(t)){
      studentEntries.push({name:t, page:line.page, y:line.y});
      roster.add(t);
    }
  });

  const segments = [];

  for(let si=0; si<studentEntries.length; si++){
    const stu     = studentEntries[si];
    const nextStu = studentEntries[si+1];

    const levelEntry = levelEntries.find(lev=>{
      if(lev.page < stu.page) return false;
      if(lev.page === stu.page && lev.y <= stu.y) return false;
      if(nextStu){
        if(lev.page > nextStu.page) return false;
        if(lev.page === nextStu.page && lev.y >= nextStu.y) return false;
      }
      return true;
    });

    for(let ci=0; ci<numSubjCols; ci++){
      const commentLines = subjLines[ci].filter(line=>{
        if(line.page < stu.page) return false;
        if(line.page === stu.page && line.y < stu.y - 3) return false;
        if(nextStu){
          if(line.page > nextStu.page) return false;
          if(line.page === nextStu.page && line.y >= nextStu.y - 3) return false;
        }
        if(levelEntry && line.page===levelEntry.page && Math.abs(line.y-levelEntry.y)<=6) return false;
        return true;
      });

      const text = commentLines.map(l=>l.text).join(' ').replace(/\s+/g,' ').trim();
      if(!text || text.length<20) continue;

      let level = null;
      if(levelEntry){
        const lvlItem = subjRaw[ci].find(item=>
          item.page===levelEntry.page && Math.abs(item.y-levelEntry.y)<=6
        );
        if(lvlItem) level = lvlItem.text.trim();
      }

      const area = subjects[ci+1] || 'General';
      segments.push({student:stu.name, area, text, level});
    }
  }

  return { segments, roster };
}

function reconstructLinearText(allItems){
  const lineMap = new Map();
  allItems.forEach(item=>{
    const key = `${item.page}-${item.y}`;
    if(!lineMap.has(key)) lineMap.set(key,{page:item.page,y:item.y,parts:[]});
    lineMap.get(key).parts.push(item);
  });
  return [...lineMap.values()]
    .sort((a,b)=>a.page!==b.page?a.page-b.page:a.y-b.y)
    .map(l=>l.parts.sort((a,b)=>a.x-b.x).map(p=>p.text).join(' ').trim())
    .filter(l=>l.length>0)
    .join('\n');
}

function checkPdfQuality(text){
  if(!text||text.trim().length<60) return 'empty';
  const lines = text.split('\n').filter(l=>l.trim().length>5);
  if(lines.length<3) return 'too_short';
  const real = lines.filter(l=>{
    const ws = l.trim().split(/\s+/);
    if(ws.length<3) return false;
    const avg = ws.reduce((s,w)=>s+w.replace(/[^a-z]/gi,'').length,0)/ws.length;
    return avg<=13 && !/[A-Z]{6,}/.test(l);
  });
  return real.length/lines.length < 0.25 ? 'garbled' : 'ok';
}

/* ═══════════════════════════════════════════════════════════════
   DOCX READING
═══════════════════════════════════════════════════════════════ */
async function readDocxHtml(file){
  return new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload = e => mammoth.convertToHtml({arrayBuffer:e.target.result}).then(v=>res(v.value)).catch(rej);
    r.onerror = rej;
    r.readAsArrayBuffer(file);
  });
}

function looksLikeName(t, roster){
  t = t.trim();
  if(t.length<2||t.length>45) return null;
  if(/[.!?,;:–—()\[\]{}]/.test(t)) return null;
  if(/\b(is|are|was|has|have|can|will|does|did|the|and|but|for|in|on|at|to|of|a|an|with|from|that|this|his|her|their|which|who)\b/i.test(t)) return null;
  if(roster && roster.size>0){
    for(const name of roster){
      const first = name.split(/\s+/)[0];
      if(name.toLowerCase()===t.toLowerCase()) return name;
      if(first.length>=3 && first.toLowerCase()===t.toLowerCase()) return name;
    }
  }
  if(/^[A-Z][a-z]{1,20}(\s[A-Z][a-z]{1,20})?$/.test(t)){
    const first = t.split(' ')[0];
    if(!NOT_NAMES.has(first) && first.length>=3) return t;
  }
  if(/^[A-Z][a-zA-Z]{0,10}-[A-Z][a-zA-Z]{1,15}$/.test(t)) return t;
  return null;
}

function looksLikeAreaHeading(t){
  t = t.trim();
  if(t.length<2||t.length>60) return null;
  if(t.split(/\s+/).length>7) return null;
  const n = normaliseSubject(t);
  if(n !== t) return n;
  return null;
}

function parseHtml(html, manualRoster){
  const roster = new Set(manualRoster||[]);
  const parser = new DOMParser();
  const doc    = parser.parseFromString(html,'text/html');
  const elems  = Array.from(doc.body.children);
  const builtRoster = new Set(roster);

  elems.forEach(el=>{
    const tag = el.tagName.toLowerCase();
    const txt = el.textContent.trim();
    if(['h1','h2','h3','h4'].includes(tag)){
      const n = looksLikeName(txt, roster);
      if(n) builtRoster.add(n);
    } else if(tag==='p'){
      const bolds   = el.querySelectorAll('strong, b');
      const boldTxt = Array.from(bolds).map(b=>b.textContent).join('').trim();
      if(boldTxt===txt && txt.length<50){
        const n = looksLikeName(txt, roster);
        if(n) builtRoster.add(n);
      }
    }
  });

  const LEVEL_RE2 = /\b(Emerging|Developing|Achieving|Extending|Beginning|Approaching|Meeting|Exceeding|Secure)\b/;
  const segments = [];
  let curStudent=null, curArea=null, buf=[];

  function flush(){
    const text=buf.join('\n').trim(); buf=[];
    if(!text||text.length<15||!curStudent) return;
    const level=(text.match(LEVEL_RE2)||[])[1]||null;
    const area = curArea || detectAreaFromText(text);
    segments.push({student:curStudent, area, text, level});
  }

  elems.forEach(el=>{
    const tag=el.tagName.toLowerCase();
    const txt=el.textContent.trim();
    if(!txt) return;
    const isHeading  = ['h1','h2','h3','h4'].includes(tag);
    const isBoldOnly = tag==='p' && (()=>{
      const bolds   = el.querySelectorAll('strong, b');
      const boldTxt = Array.from(bolds).map(b=>b.textContent).join('').trim();
      return boldTxt===txt && txt.length<50;
    })();
    if(isHeading||isBoldOnly){
      const name = looksLikeName(txt, builtRoster);
      const area = name ? null : looksLikeAreaHeading(txt);
      if(name){   flush(); curStudent=name; curArea=null; return; }
      if(area){   flush(); curArea=area;    return; }
    }
    buf.push(txt);
  });
  flush();
  return { segments, roster:builtRoster };
}

function parsePlainText(fullText, manualRoster){
  const roster = new Set(manualRoster||[]);
  const lines  = fullText.split('\n');
  const builtRoster = new Set(roster);
  lines.forEach(line=>{ const n=looksLikeName(line.trim(),roster); if(n) builtRoster.add(n); });

  const LEVEL_RE2 = /\b(Emerging|Developing|Achieving|Extending|Beginning|Approaching|Meeting|Exceeding|Secure)\b/;
  const segments = [];
  let curStudent=null, curArea=null, buf=[];

  function flush(){
    const text=buf.join('\n').trim(); buf=[];
    if(!text||text.length<15||!curStudent) return;
    const level=(text.match(LEVEL_RE2)||[])[1]||null;
    const area = curArea||detectAreaFromText(text);
    segments.push({student:curStudent, area, text, level});
  }

  for(const line of lines){
    const t=line.trim(); if(!t) continue;
    const name=looksLikeName(t,builtRoster);
    const area=name?null:looksLikeAreaHeading(t);
    if(name){    flush(); curStudent=name; curArea=null; }
    else if(area){ flush(); curArea=area; }
    else { buf.push(t); }
  }
  flush();
  return { segments, roster:builtRoster };
}

/* ═══════════════════════════════════════════════════════════════
   SPELLING STYLE
═══════════════════════════════════════════════════════════════ */
function detectSpelling(fullText, pref){
  if(pref==='uk') return 'uk';
  if(pref==='us') return 'us';
  let uk=0,us=0;
  for(const p of UK_US){
    us += (fullText.match(p.us)||[]).length;
    uk += (fullText.match(p.uk)||[]).length;
  }
  if(uk===0&&us===0) return 'either';
  if(us>uk*2) return 'us';
  if(uk>us*2) return 'uk';
  return 'mixed';
}

/* ═══════════════════════════════════════════════════════════════
   SENTENCE UTILITIES
═══════════════════════════════════════════════════════════════ */
function splitSentences(text){
  const parts = text.match(/[^.!?]+(?:[.!?]+(?=\s+[A-Z]|\s*$)|[.!?]+)/g)||[text];
  return parts.map(s=>s.trim()).filter(s=>s.length>8 && wc(s)>=4);
}

function isUsableSentence(s){
  if(!s||wc(s)<4) return false;
  if(/[A-Z]{5,}/.test(s)) return false;
  if(/\w{18,}/.test(s))   return false;
  const ws  = s.split(/\s+/);
  const avg = ws.reduce((x,w)=>x+w.replace(/[^a-zA-Z]/g,'').length,0)/ws.length;
  return avg>=2 && avg<=12;
}

/* ═══════════════════════════════════════════════════════════════
   CHECKS
═══════════════════════════════════════════════════════════════ */

/* ─── A. WRONG NAME ─────────────────────────────────────────── */
function checkWrongName(seg, roster){
  const { student, area, text } = seg;
  const firstName = student.split(/[\s\-]+/)[0];
  const issues    = [];

  for(const other of roster){
    if(issues.length >= 3) break; // safety cap: max 3 wrong-name issues per segment
    if(other===student) continue;
    const otherFirst = other.split(/[\s\-]+/)[0];
    const otherFirstCap = otherFirst.charAt(0).toUpperCase()+otherFirst.slice(1);
    if(otherFirst.length<3 || NOT_NAMES.has(otherFirst) || NOT_NAMES.has(otherFirstCap)) continue;

    const re = new RegExp(`\\b${escRe(otherFirst)}\\b`,'g');
    const sents = splitSentences(text);
    for(const sent of sents){
      if(!isUsableSentence(sent)) continue;
      const mAll = [...sent.matchAll(re)];
      if(!mAll.length) continue;
      const ownRe = new RegExp(`\\b${escRe(firstName)}\\b`,'i');
      if(ownRe.test(sent)) continue;
      const firstSent = sents[0];
      if(sent === firstSent){
        const firstWord = sent.trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g,'');
        if(firstWord.toLowerCase() === firstName.toLowerCase()) continue;
      }
      const correctedSent = sent.replace(re, firstName);
      issues.push({
        section:'names', type:'Wrong name',
        student:`${student} - ${area}`,
        exactSent: sent,
        issue:`"${otherFirst}" appears in ${firstName}'s ${area} comment — possible copy-paste error from another student's report.`,
        fix:`If so, change to: "${correctedSent}"`,
      });
      break;
    }
  }
  return issues;
}

/* ─── B. PRONOUN INCONSISTENCY ──────────────────────────────── */
function checkPronouns(seg){
  const { student, area, text } = seg;
  const sents    = splitSentences(text).filter(isUsableSentence);
  const heSents  = sents.filter(s=>/\b(he|him|his)\b/i.test(s));
  const sheSents = sents.filter(s=>/\b(she|her|hers)\b/i.test(s));

  if(heSents.length>0 && sheSents.length>0){
    return [{
      section:'names', type:'Pronoun inconsistency',
      student:`${student} - ${area}`,
      exactSent:`"${heSents[0].trim()}" / "${sheSents[0].trim()}"`,
      issue:`This ${area} comment uses both he/him/his and she/her pronouns.`,
      fix:`Choose one set of pronouns and use it consistently throughout the ${area} comment.`,
    }];
  }
  return [];
}

/* ─── C. LEVEL LABEL ("an achieving student") ──────────────── */
const LEVEL_LABEL_RE = /\b(an?\s+)(achieving|developing|emerging|extending|beginning|approaching|exceeding)\s+(student|learner|child|language\s+student)\b/gi;

function checkLevelLabel(seg){
  const { student, area, text } = seg;
  const issues = [];
  for(const sent of splitSentences(text)){
    if(!isUsableSentence(sent)) continue;
    const re = new RegExp(LEVEL_LABEL_RE.source,'gi');
    const m  = re.exec(sent);
    if(m){
      issues.push({
        section:'biggest', type:'Level label as description',
        student:`${student} - ${area}`,
        exactSent: sent,
        issue:`"${m[0].trim()}" — do not use the student's level as a description.`,
        fix:`Describe what the student does instead — e.g. "demonstrates strong ability in..." or name the specific skill or behaviour.`,
      });
    }
  }
  return issues;
}

/* ─── D. SPELLING TYPOS ─────────────────────────────────────── */
function checkTypos(seg){
  const { student, area, text } = seg;
  const issues = [];
  const seen   = new Set();
  for(const sent of splitSentences(text)){
    if(!isUsableSentence(sent)) continue;
    for(const [wrong, right] of TYPOS){
      if(seen.has(wrong)) continue;
      const re = new RegExp(`\\b${escRe(wrong)}\\b`,'i');
      const m  = sent.match(re);
      if(m){
        seen.add(wrong);
        const corrected = sent.replace(re, right);
        issues.push({
          section:'spelling', type:'Spelling error',
          student:`${student} - ${area}`,
          exactSent: sent,
          issue:`"${m[0]}" — should be "${right}".`,
          fix:`"${corrected}"`,
        });
      }
    }
  }
  return issues;
}

/* ─── E. UK/US CONSISTENCY ──────────────────────────────────── */
function checkSpellingConsistency(fullText, domStyle, allSegments){
  if(domStyle==='either') return [];
  const issues = [];
  const seen   = new Set();

  for(const seg of allSegments){
    for(const sent of splitSentences(seg.text)){
      if(!isUsableSentence(sent)) continue;
      for(const pair of UK_US){
        const key = pair.usW+'/'+pair.ukW;
        if(seen.has(key)) continue;
        let m, concern, rec;

        if(domStyle==='uk'||domStyle==='mixed'){
          m = sent.match(pair.us);
          if(m){
            concern = domStyle==='mixed'
              ? `Both "${pair.ukW}" and "${pair.usW}" appear in the document.`
              : `"${m[0]}" (US spelling) — document mostly uses UK spelling.`;
            rec = `Use "${pair.ukW}" consistently throughout.`;
            seen.add(key);
          }
        } else {
          m = sent.match(pair.uk);
          if(m){
            concern = `"${m[0]}" (UK spelling) — document mostly uses US spelling.`;
            rec = `Use "${pair.usW}" consistently throughout.`;
            seen.add(key);
          }
        }
        if(m) issues.push({
          section:'spelling', type:'Spelling consistency',
          student:'Whole document',
          issue: concern,
          fix: rec,
        });
      }
    }
  }
  return issues;
}

/* ─── F. GRAMMAR ─────────────────────────────────────────────── */
const AAN_TO_AN = [
  /\ba\s+(understanding)\b/i, /\ba\s+(inquiry)\b/i,
  /\ba\s+(excellent)\b/i,     /\ba\s+(important)\b/i,
  /\ba\s+(interesting)\b/i,   /\ba\s+(effective)\b/i,
  /\ba\s+(engaging)\b/i,      /\ba\s+(authentic)\b/i,
  /\ba\s+(accurate)\b/i,      /\ba\s+(IB)\b/i,
  /\ba\s+(honest)\b/i,        /\ba\s+(enthusiastic)\b/i,
  /\ba\s+(exceptional)\b/i,   /\ba\s+(impressive)\b/i,
  /\ba\s+(outstanding)\b/i,   /\ba\s+(organised)\b/i,
  /\ba\s+(organized)\b/i,     /\ba\s+(open[- ]minded)\b/i,
  /\ba\s+(increasing)\b/i,    /\ba\s+(enjoyable)\b/i,
  /\ba\s+(encouraging)\b/i,
];
const AAN_TO_A = [
  /\ban\s+(strong)\b/i,    /\ban\s+(great)\b/i,
  /\ban\s+(good)\b/i,      /\ban\s+(significant)\b/i,
  /\ban\s+(steady)\b/i,    /\ban\s+(successful)\b/i,
  /\ban\s+(key)\b/i,       /\ban\s+(growing)\b/i,
  /\ban\s+(positive)\b/i,  /\ban\s+(creative)\b/i,
  /\ban\s+(curious)\b/i,   /\ban\s+(confident)\b/i,
  /\ban\s+(dedicated)\b/i, /\ban\s+(motivated)\b/i,
  /\ban\s+(talented)\b/i,
];
const MISSING_A_PATTERNS = [
  { re:/\b(is|was|remains?|became?)\s+(very|highly|quite|remarkably|incredibly|extremely)\s+(independent|keen|motivated|dedicated|focused|resilient|enthusiastic|thoughtful|engaged)\s+(learner|thinker|communicator|reader|writer|contributor|member)\b/i,
    fn:(sent,m)=>sent.replace(m[0],`${m[1]} a ${m[2]} ${m[3]} ${m[4]}`) },
];
const HYPHEN_PATTERNS = [
  { re:/\b(two|three|four|five|six|seven|eight)\s+(paragraph)\s+(persuasive|informative|narrative|recount|argument|essay|letter|text|piece)\b/i,
    fn:(sent,m)=>sent.replace(m[0],`${m[1]}-${m[2]} ${m[3]}`) },
  { re:/\bself\s+(management|directed|motivated|paced|regulation|regulated|confidence|sufficient)\b/i,
    fn:(sent,m)=>sent.replace(m[0],`self-${m[1]}`) },
  { re:/\bwell\s+(written|structured|organised|organized|developed|supported|presented|researched|rounded)\b(?=\s+\w)/i,
    fn:(sent,m)=>sent.replace(m[0],`well-${m[1]}`) },
];

function checkGrammar(seg){
  const { student, area, text } = seg;
  const issues = [];

  for(const sent of splitSentences(text)){
    if(!isUsableSentence(sent)) continue;

    for(const re of AAN_TO_AN){
      const m = sent.match(re);
      if(m){
        const word      = m[1];
        const corrected = sent.replace(re,`an ${word}`);
        if(/\ban\s+a[n]?\b/i.test(corrected)) continue;
        issues.push({section:'grammar',type:'Grammar (a/an)',student:`${student} - ${area}`,
          exactSent:sent,issue:`"a ${word}" — needs "an" before a vowel sound.`,fix:`"${corrected}"`});
        break;
      }
    }
    for(const re of AAN_TO_A){
      const m = sent.match(re);
      if(m){
        const word      = m[1];
        const corrected = sent.replace(re,`a ${word}`);
        issues.push({section:'grammar',type:'Grammar (a/an)',student:`${student} - ${area}`,
          exactSent:sent,issue:`"an ${word}" — "${word}" starts with a consonant sound; use "a".`,fix:`"${corrected}"`});
        break;
      }
    }
    for(const {re,fn} of MISSING_A_PATTERNS){
      const m = sent.match(re);
      if(m){
        const corrected = fn(sent,m);
        if(corrected&&corrected!==sent){
          issues.push({section:'grammar',type:'Missing word',student:`${student} - ${area}`,
            exactSent:sent,issue:`"${m[0]}" — missing the article "a".`,fix:`"${corrected}"`});
          break;
        }
      }
    }
    for(const {re,fn} of HYPHEN_PATTERNS){
      const m = sent.match(re);
      if(m){
        const corrected = fn(sent,m);
        if(corrected&&corrected!==sent){
          issues.push({section:'grammar',type:'Hyphenation',student:`${student} - ${area}`,
            exactSent:sent,issue:`"${m[0]}" — compound adjective needs a hyphen.`,fix:`"${corrected}"`});
          break;
        }
      }
    }
  }
  return issues;
}

/* ─── G. PUNCTUATION / SPACING ──────────────────────────────── */
function checkPunctuation(seg){
  const { student, area, text } = seg;
  const issues = [];

  const spaceRe = /([a-z]{3,})\.(Additionally|Furthermore|However|Throughout|This|The|In|During|As|By|After|Before|He|She|They|It|His|Her|Their|One|Another|Over|Both|While|Since|Although|When|Through)/g;
  const spaceMatches = [];
  let sm;
  while((sm=spaceRe.exec(text))!==null){ spaceMatches.push(sm); if(spaceMatches.length>=2) break; }
  for(const sm of spaceMatches){
    issues.push({section:'grammar',type:'Missing space',student:`${student} - ${area}`,
      exactSent:`"…${sm[0]}…"`,
      issue:`Missing space after full stop: "${sm[0]}"`,
      fix:`Change "${sm[0]}" to "${sm[1]}. ${sm[2]}"`});
  }

  const dotRe = /([a-z]{2,})\.\s+\.|([a-z]{2,})\.\./g;
  const dm    = dotRe.exec(text);
  if(dm){
    issues.push({section:'grammar',type:'Punctuation',student:`${student} - ${area}`,
      exactSent:`"${dm[0]}"`,issue:`Extra full stop: "${dm[0]}"`,fix:`Remove the extra full stop.`});
  }
  return issues;
}

/* ─── H. FIRST-PERSON WORDING ──────────────────────────────── */
// Matches "our" followed by 0-3 optional words then a unit-type keyword.
// Also matches "our [unit-keyword]" directly (no words before keyword).
// Examples caught: "our Units of Inquiry", "our inquiry into forces",
//   "our Statistics inquiry", "our learning community", "our recent units"
const OUR_RE = /\bour\s+((?:(?!units?\s+of\s+inquiry)[\w]+\s+){0,3}(?:units?\s+of\s+inquiry|units?|inquiry|inquiries|study|project|exploration|learning\s+community|Statistics\s+(?:and\s+Probability\s+)?(?:inquiry|unit)|advertising\s+unit))\b/gi;

function checkFirstPerson(seg){
  const { student, area, text } = seg;
  const issues = [];
  for(const sent of splitSentences(text)){
    if(!isUsableSentence(sent)) continue;

    const weRe = /\bAs\s+we\s+(moved?\s+into|explored?|looked?\s+at|began?|studied?|continued?|delved?|turned?\s+to|worked?\s+on)\b/i;
    const we1  = sent.match(weRe);
    if(we1){
      const verbMap = {
        'moved into':'During','move into':'During','explored':'During','explore':'During',
        'looked at':'In','look at':'In','began':'During','begin':'During',
        'studied':'During','study':'During','continued':'Continuing to',
        'delved':'In','turned to':'Moving to','worked on':'Working on',
      };
      const mapped = verbMap[(we1[1]||'').toLowerCase()] || 'During';
      const corrected = sent.replace(weRe, mapped);
      if(corrected!==sent){
        issues.push({section:'firstperson',type:'First-person wording',student:`${student} - ${area}`,
          exactSent:sent,issue:`"${we1[0]}" — first-person "we" in a report card.`,fix:`Consider: "${corrected}"`});
        continue;
      }
    }

    // Reset lastIndex before testing
    OUR_RE.lastIndex = 0;
    const ourMatch = OUR_RE.exec(sent);
    if(ourMatch){
      const phrase    = ourMatch[1].trim();
      const corrected = sent.replace(ourMatch[0], `the ${phrase}`);
      issues.push({section:'firstperson',type:'First-person wording',student:`${student} - ${area}`,
        exactSent:sent,issue:`"${ourMatch[0].trim()}" — "our" in a report card is first-person.`,fix:`"${corrected}"`});
    }
  }
  return issues;
}

/* ─── I. TONE ─────────────────────────────────────────────────── */
const TONE_RULES = [
  { re:/\bbig\s+feelings?\b/gi, type:'Informal wording',
    fn:(sent)=>({corrected:sent.replace(/\bbig\s+feelings?\b/gi,'strong emotions'),label:'"big feelings"'}) },
  { re:/\b(becomes?|is|was|felt?|gets?)\s+dysregulated\b/gi, type:'Sensitive wording',
    fn:(sent,m)=>({corrected:sent.replace(m[0],`${m[1]} continuing to develop strategies to manage focus and emotions`),label:'"dysregulated"'}) },
  { re:/\bdysregulated\b/gi, type:'Sensitive wording',
    fn:(sent)=>({corrected:sent.replace(/\bdysregulated\b/gi,'continuing to develop strategies to manage focus and emotions'),label:'"dysregulated"'}) },
  { re:/\b(displays?|shows?|has)\s+a\s+high\s+level\s+of\s+intelligence\b/gi, type:'Fixed-trait wording',
    fn:(sent,m)=>({corrected:sent.replace(m[0],`${m[1]} strong reasoning skills and intellectual curiosity`),label:'"high level of intelligence"'}) },
  { re:/\b(showcase|show|display|demonstrate)\s+(his|her|their)\s+intelligence\b/gi, type:'Fixed-trait wording',
    fn:(sent,m)=>({corrected:sent.replace(m[0],`${m[1]} ${m[2]} reasoning skills and curiosity`),label:'"intelligence"'}) },
  { re:/\b(improving|improve)\s+(his|her|their)\s+attendance\b/gi, type:'Sensitive wording',
    fn:(sent,m)=>({corrected:sent.replace(m[0],`consistent attendance will support ${m[2]} continued learning`),label:'"improving attendance"'}) },
  { re:/\bdistracts?\s+others?\b/gi, type:'Sensitive wording',
    fn:(sent)=>({corrected:sent.replace(/\bdistracts?\s+others?\b/gi,'can impact the learning environment'),label:'"distracts others"'}) },
  { re:/\bpersonal\s+boundaries\b/gi, type:'Sensitive wording',
    fn:(sent)=>({corrected:sent.replace(/\bpersonal\s+boundaries\b/gi,'awareness of personal space and respectful interactions'),label:'"personal boundaries"'}) },
  { re:/\b(is|can\s+be|was)\s+lazy\b/gi, type:'Sensitive wording',
    fn:(sent,m)=>({corrected:sent.replace(m[0],`${m[1]} developing greater independence and effort`),label:'"lazy"'}) },
  { re:/\broman\s+toilet\s+cleaner\b/gi, type:'Inappropriate wording',
    fn:(sent)=>({corrected:sent.replace(/\broman\s+toilet\s+cleaner\b/gi,'Roman sanitation worker'),label:'"Roman toilet cleaner"'}) },
];

function checkTone(seg){
  const { student, area, text } = seg;
  const issues = [];
  for(const sent of splitSentences(text)){
    if(!isUsableSentence(sent)) continue;
    for(const rule of TONE_RULES){
      const m = sent.match(rule.re);
      if(!m) continue;
      const result = rule.fn(sent,m);
      if(!result||!result.corrected||result.corrected===sent) continue;
      issues.push({section:'tone',type:rule.type,student:`${student} - ${area}`,
        exactSent:sent,issue:`${result.label} — may not be suitable for a parent-facing report.`,fix:`"${result.corrected}"`});
      break;
    }
  }
  return issues;
}

/* ─── J. WORDINESS ────────────────────────────────────────────── */
const WORDY_RULES = [
  { re:/\bnomenclature\b/gi, type:'Word choice',
    fn:(sent)=>({corrected:sent.replace(/\bnomenclature\b/gi,'mathematical vocabulary')}) },
  { re:/\bis\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/gi, type:'Wordy phrasing',
    fn:(sent)=>({corrected:sent.replace(/\bis\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/gi,'understands')}) },
  { re:/\bhas\s+been\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/gi, type:'Wordy phrasing',
    fn:(sent)=>({corrected:sent.replace(/\bhas\s+been\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/gi,'understands')}) },
  { re:/\bhas\s+been\s+able\s+to\s+demonstrate\b/gi, type:'Wordy phrasing',
    fn:(sent)=>({corrected:sent.replace(/\bhas\s+been\s+able\s+to\s+demonstrate\b/gi,'has demonstrated')}) },
  { re:/\bis\s+able\s+to\s+demonstrate\b/gi, type:'Wordy phrasing',
    fn:(sent)=>({corrected:sent.replace(/\bis\s+able\s+to\s+demonstrate\b/gi,'demonstrates')}) },
  { re:/\bmake\s+a\s+historical\s+fiction\b/gi, type:'Word choice',
    fn:(sent)=>({corrected:sent.replace(/\bmake\s+a\s+historical\s+fiction\b/gi,'write historical fiction')}) },
];

function checkWordiness(seg){
  const { student, area, text } = seg;
  const issues = [];
  for(const sent of splitSentences(text)){
    if(!isUsableSentence(sent)) continue;
    for(const rule of WORDY_RULES){
      const m = sent.match(rule.re);
      if(!m) continue;
      const result = rule.fn(sent,m);
      if(!result||!result.corrected||result.corrected===sent) continue;
      issues.push({section:'wordy',type:rule.type,student:`${student} - ${area}`,
        exactSent:sent,issue:`"${m[0]}" — wordy phrasing.`,fix:`"${result.corrected}"`});
      break;
    }
  }
  return issues;
}

/* ─── K. DUPLICATION ─────────────────────────────────────────── */
function checkDuplication(seg){
  const { student, area, text } = seg;
  const issues = [];
  for(const sent of splitSentences(text)){
    if(!isUsableSentence(sent)) continue;
    if(/\b(furthermore|moreover)\b[^.]{0,90}\balso\b/i.test(sent)){
      const corrected = sent.replace(/\balso\b/,'').replace(/\s{2,}/g,' ').trim();
      issues.push({section:'duplication',type:'Redundant wording',student:`${student} - ${area}`,
        exactSent:sent,
        issue:`"furthermore"/"moreover" and "also" in the same sentence.`,
        fix:`Remove "also": "${corrected}"`});
    }
  }
  return issues;
}

/* ─── L. LEVEL ALIGNMENT ─────────────────────────────────────── */
const STRONG_RE = /\b(exemplary|remarkable|outstanding|exceptional|surpasses?|beyond\s+the\s+(curriculum|requirements?|expectations?)|extends?\s+(her|his|their)?\s+learning\s+beyond)\b/i;
const WEAK_RE   = /\b(is\s+beginning\s+to|still\s+developing|finding\s+(this\s+)?quite\s+difficult|needs?\s+a\s+great\s+deal\s+of\s+support|with\s+significant\s+support|not\s+yet\s+able)\b/i;

function checkLevelAlignment(seg){
  const { student, area, text, level } = seg;
  if(!level) return [];
  const isHigh = /(Extending|Exceeding)/i.test(level);
  const isLow  = /(Emerging|Beginning|Approaching)/i.test(level);
  const issues = [];

  if(!isHigh && STRONG_RE.test(text)){
    const m = text.match(STRONG_RE);
    issues.push({section:'level',type:'Comment / level mismatch',student:`${student} - ${area}`,level,
      concern:`The comment uses strong language ("${m[0]}") but the visible level is ${level}.`,
      action:`Either raise the level or soften the comment to match ${level}.`});
  }
  if(!isLow && WEAK_RE.test(text)){
    const m = text.match(WEAK_RE);
    issues.push({section:'level',type:'Comment / level mismatch',student:`${student} - ${area}`,level,
      concern:`The comment uses language ("${m[0]}") that suggests a lower level than ${level}.`,
      action:`Either lower the level or revise the comment to match ${level}.`});
  }
  return issues;
}

/* ═══════════════════════════════════════════════════════════════
   RUN ALL CHECKS
═══════════════════════════════════════════════════════════════ */
function runAllChecks(segments, roster, fullText, settings){
  const { spellingPref, checkFirstPersonFlag, checkLevelFlag, hasManualRoster } = settings;
  const domStyle  = detectSpelling(fullText, spellingPref);
  const allIssues = [];

  checkSpellingConsistency(fullText, domStyle, segments).forEach(i=>allIssues.push(i));

  for(const seg of segments){
    // Wrong-name check only runs when user has pasted a class list — auto-detected
    // names are too unreliable and create false positives
    if(hasManualRoster) checkWrongName(seg, roster).forEach(i=>allIssues.push(i));
    checkPronouns(seg).forEach(i=>allIssues.push(i));
    checkLevelLabel(seg).forEach(i=>allIssues.push(i));
    checkTypos(seg).forEach(i=>allIssues.push(i));
    checkGrammar(seg).forEach(i=>allIssues.push(i));
    checkPunctuation(seg).forEach(i=>allIssues.push(i));
    checkTone(seg).forEach(i=>allIssues.push(i));
    if(checkFirstPersonFlag) checkFirstPerson(seg).forEach(i=>allIssues.push(i));
    checkWordiness(seg).forEach(i=>allIssues.push(i));
    checkDuplication(seg).forEach(i=>allIssues.push(i));
    if(checkLevelFlag) checkLevelAlignment(seg).forEach(i=>allIssues.push(i));
  }

  return { allIssues, domStyle };
}

/* ═══════════════════════════════════════════════════════════════
   CONSOLIDATION
   When 3+ students share the same issue category, produce one
   "Whole document" row instead of individual student rows.
═══════════════════════════════════════════════════════════════ */
function consolidateIssues(allIssues){
  const skipIdx = new Set();
  const docWide = [];

  /* ── First-person "our [unit/inquiry]" ── */
  const fpOurIdx = allIssues.reduce((acc,i,idx)=>{
    if(i.section==='firstperson' && /\bour\s+/i.test(i.exactSent||'')) acc.push(idx);
    return acc;
  },[]);

  if(fpOurIdx.length >= 3){
    const fpIssues = fpOurIdx.map(idx=>allIssues[idx]);
    // Collect up to 3 unique example phrases
    const examples = [...new Set(fpIssues.map(i=>{
      const m = (i.exactSent||'').match(/\bour\s+(?:[\w]+\s+){0,3}(?:units?\s+of\s+inquiry|inquiry|units?|study|project|exploration|learning\s+community)\b/i);
      return m ? m[0].trim() : null;
    }).filter(Boolean))].slice(0,3);

    docWide.push({
      section:'firstperson', type:'First-person "our" wording',
      student:'Whole document',
      issue:`${fpOurIdx.length} comments use first-person "our" — ${examples.map(e=>`"${e}"`).join(', ')}${fpOurIdx.length>examples.length?' and others':''}.`,
      fix:`Change "our" to "the" in each case — e.g. "our Units of Inquiry" → "the Units of Inquiry", "our inquiry" → "the inquiry".`,
    });
    fpOurIdx.forEach(idx=>skipIdx.add(idx));
  }

  /* ── "an achieving/developing student" label ── */
  const labelIdx = allIssues.reduce((acc,i,idx)=>{
    if(i.type==='Level label as description') acc.push(idx);
    return acc;
  },[]);

  if(labelIdx.length >= 1){
    const labelIssues = labelIdx.map(idx=>allIssues[idx]);
    const examples = [...new Set(labelIssues.map(i=>{
      LEVEL_LABEL_RE.lastIndex=0;
      const m = LEVEL_LABEL_RE.exec(i.exactSent||'');
      return m ? m[0].trim() : null;
    }).filter(Boolean))].slice(0,3);

    docWide.push({
      section:'biggest', type:'Level label as description',
      student:'Whole document',
      issue:`${labelIdx.length} comment${labelIdx.length>1?'s':''} use the student's level as a description (${examples.map(e=>`"${e}"`).join(', ')}${labelIdx.length>examples.length?'…':''}). IB PYP reports should not label students by their level.`,
      fix:`Remove the label and describe what the student does instead — e.g. "an achieving student" → "demonstrates strong understanding of..." or simply describe their specific skill or behaviour.`,
    });
    labelIdx.forEach(idx=>skipIdx.add(idx));
  }

  const remaining = allIssues.filter((_,idx)=>!skipIdx.has(idx));
  return { docWide, remaining };
}

/* ═══════════════════════════════════════════════════════════════
   RENDER
═══════════════════════════════════════════════════════════════ */
function h(s){ return escH(s); }

/* Table 1 — Things to check (grammar, consistency, names, "our" pattern, etc.) */
function renderMainTable(issues){
  const rows = issues.map(i=>{
    const isDoc = i.student === 'Whole document';

    // "Current issue" cell
    let current;
    if(isDoc){
      current = `<span class="issue-note">${h(i.issue||i.usage||'')}</span>`;
    } else if(i.exactSent){
      current  = `<em class="exact-quote">${h(i.exactSent)}</em>`;
      if(i.issue && i.issue !== i.exactSent){
        current += `<div class="issue-note">${h(i.issue)}</div>`;
      }
    } else {
      current = h(i.issue||i.usage||'');
    }

    const fix   = h(i.fix||i.rec||'');
    const badge = `<span class="type-badge${isDoc?' type-badge--doc':''}">${h(i.type||'')}</span>`;

    return `<tr${isDoc?' class="whole-doc-row"':''}>
      <td class="td-student">${h(i.student)}</td>
      <td>${badge}</td>
      <td class="td-issue">${current}</td>
      <td class="td-fix">${fix}</td>
    </tr>`;
  }).join('');

  return `<div class="feedback-section">
    <div class="section-heading">Things to check before final submission <span class="section-count">${issues.length}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Student / Area</th><th>Issue type</th><th>Current issue</th><th>Suggested fix</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`;
}

/* Table 2 — Tone and wording to soften */
function renderToneTable(issues){
  const rows = issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td><span class="type-badge">${h(i.type||'')}</span></td>
    <td class="td-issue"><em class="exact-quote">${h(i.exactSent||'')}</em></td>
    <td class="td-fix">${h(i.fix||'')}</td>
  </tr>`).join('');

  return `<div class="feedback-section">
    <div class="section-heading">Tone and wording to soften <span class="section-count">${issues.length}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Student / Area</th><th>Issue type</th><th>Current wording</th><th>Suggested wording</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`;
}

/* Table 3 — Comment and level alignment */
function renderLevelTable(issues){
  const rows = issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td><span class="type-badge">${h(i.level||'')}</span></td>
    <td class="td-concern">${h(i.concern||'')}</td>
    <td class="td-fix">${h(i.action||'')}</td>
  </tr>`).join('');

  return `<div class="feedback-section">
    <div class="section-heading">Comment and level alignment <span class="section-count">${issues.length}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Student / Area</th><th>Visible level</th><th>Why to check</th><th>Possible action</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`;
}

function buildPriority(allIssues){
  const items = [];
  const wrongNames = allIssues.filter(i=>i.type==='Wrong name');
  if(wrongNames.length) items.push(`Check ${wrongNames.length} possible wrong-name issue${wrongNames.length>1?'s':''} — see student rows above.`);
  const pronouns = allIssues.filter(i=>i.type==='Pronoun inconsistency');
  if(pronouns.length) items.push(`Fix pronoun inconsistency in: ${pronouns.map(i=>i.student).join(', ')}.`);
  const typos = allIssues.filter(i=>i.section==='spelling'&&i.type==='Spelling error');
  if(typos.length) items.push(`Correct ${typos.length} spelling error${typos.length>1?'s':''}.`);
  const fp = allIssues.filter(i=>i.section==='firstperson');
  if(fp.length) items.push(`Remove first-person "our"/"we" wording — found in ${fp.length} comment${fp.length>1?'s':''}.`);
  const tone = allIssues.filter(i=>i.section==='tone');
  if(tone.length) items.push(`Soften wording in ${tone.length} tone item${tone.length>1?'s':''}. See tone table.`);
  const gram = allIssues.filter(i=>i.section==='grammar');
  if(gram.length) items.push(`Fix ${gram.length} grammar/punctuation issue${gram.length>1?'s':''}.`);
  const lev = allIssues.filter(i=>i.section==='level');
  if(lev.length) items.push(`Review comment/level alignment for ${lev.map(i=>i.student).join(', ')}.`);
  return items;
}

function renderPriority(items){
  const box = document.getElementById('priorityBox');
  const tbl = document.getElementById('priorityTable');
  if(!items.length){ box.hidden=true; return; }
  tbl.innerHTML = items.map((it,i)=>
    `<tr><td class="priority-num">Action ${i+1}</td><td class="priority-action">${h(it)}</td></tr>`).join('');
  box.hidden = false;
}

function renderResults(allIssues, warnings, fileName, className){
  const title = className
    ? `${className} — Report Card Feedback`
    : (fileName ? `${fileName.replace(/\.[^.]+$/,'')} — Report Card Feedback` : 'Report Card Feedback');
  document.getElementById('resultsTitle').textContent = title;

  const warnBox  = document.getElementById('extractionWarning');
  const warnList = document.getElementById('warningList');
  if(warnings.length){
    warnList.innerHTML = warnings.map(w=>`<li>${h(w)}</li>`).join('');
    warnBox.hidden = false;
  } else { warnBox.hidden = true; }

  // Consolidate repeated patterns into "Whole document" rows
  const { docWide, remaining } = consolidateIssues(allIssues);

  // Table 1: main issues (doc-wide first, then student-specific)
  const mainIssues = [
    ...docWide,
    ...remaining.filter(i=>['biggest','names','grammar','spelling','firstperson','wordy','duplication'].includes(i.section)),
  ];

  // Table 2: tone
  const toneIssues = remaining.filter(i=>i.section==='tone');

  // Table 3: level alignment
  const levelIssues = remaining.filter(i=>i.section==='level');

  const total = mainIssues.length + toneIssues.length + levelIssues.length;

  document.getElementById('summaryBar').innerHTML = `
    <div class="summary-pill ${total>10?'red':total>3?'amber':'green'}">
      <span class="pill-count">${total}</span> items to review
    </div>
    ${mainIssues.length?`<div class="summary-pill amber"><span class="pill-count">${mainIssues.length}</span> grammar &amp; consistency</div>`:''}
    ${toneIssues.length?`<div class="summary-pill amber"><span class="pill-count">${toneIssues.length}</span> tone items</div>`:''}
    ${levelIssues.length?`<div class="summary-pill amber"><span class="pill-count">${levelIssues.length}</span> level alignment</div>`:''}
    ${total===0?`<div class="summary-pill green"><span class="pill-count">&#10003;</span> No issues found</div>`:''}
  `;

  const body = document.getElementById('feedbackBody');
  body.innerHTML = '';
  if(mainIssues.length)  body.innerHTML += renderMainTable(mainIssues);
  if(toneIssues.length)  body.innerHTML += renderToneTable(toneIssues);
  if(levelIssues.length) body.innerHTML += renderLevelTable(levelIssues);

  renderPriority(buildPriority(allIssues));
  document.getElementById('resultsSection').hidden = false;
  document.getElementById('resultsSection').scrollIntoView({behavior:'smooth'});
}

/* ═══════════════════════════════════════════════════════════════
   DOWNLOADS
═══════════════════════════════════════════════════════════════ */
function dlBlob(blob,name){
  const url=URL.createObjectURL(blob);
  Object.assign(document.createElement('a'),{href:url,download:name}).click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}

function flatForExport(allIssues){
  const { docWide, remaining } = consolidateIssues(allIssues);
  const all = [
    ...docWide,
    ...remaining.filter(i=>['biggest','names','grammar','spelling','firstperson','wordy','duplication'].includes(i.section)),
    ...remaining.filter(i=>i.section==='tone'),
    ...remaining.filter(i=>i.section==='level'),
  ];
  return all.map(i=>({
    student: i.student||'Whole document',
    type:    i.type||'',
    current: i.exactSent||i.issue||i.usage||i.concern||'',
    fix:     i.fix||i.rec||i.action||'',
    section: i.section||'',
  }));
}

function downloadCsv(allIssues,titleStr){
  const flat = flatForExport(allIssues);
  const csv  = [['Student / Area','Issue type','Current issue','Suggested fix'],
    ...flat.map(r=>[r.student,r.type,r.current,r.fix])]
    .map(row=>row.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  dlBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),titleStr.replace(/\s+/g,'_')+'_feedback.csv');
}

function downloadHtml(allIssues,titleStr,subtitle){
  const { docWide, remaining } = consolidateIssues(allIssues);
  const mainIssues  = [...docWide,...remaining.filter(i=>['biggest','names','grammar','spelling','firstperson','wordy','duplication'].includes(i.section))];
  const toneIssues  = remaining.filter(i=>i.section==='tone');
  const levelIssues = remaining.filter(i=>i.section==='level');

  function tableHtml(title,headers,rows){
    if(!rows.length) return '';
    const head = headers.map(c=>`<th>${c}</th>`).join('');
    const body = rows.join('');
    return `<h2 style="color:#1a3a5c;font-size:14px;margin:20px 0 6px">${title}</h2>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  const mainRows = mainIssues.map(i=>{
    const isDoc = i.student==='Whole document';
    const current = i.exactSent ? `<em>${h(i.exactSent)}</em>${i.issue&&i.issue!==i.exactSent?`<br><small>${h(i.issue)}</small>`:''}` : h(i.issue||i.usage||'');
    return `<tr${isDoc?' style="background:#eff6ff"':''}>
      <td><strong>${h(i.student)}</strong></td><td>${h(i.type||'')}</td>
      <td>${current}</td><td style="color:#166534">${h(i.fix||i.rec||'')}</td></tr>`;
  });
  const toneRows = toneIssues.map(i=>`<tr>
    <td><strong>${h(i.student)}</strong></td><td>${h(i.type||'')}</td>
    <td><em>${h(i.exactSent||'')}</em></td><td style="color:#166534">${h(i.fix||'')}</td></tr>`);
  const levelRows = levelIssues.map(i=>`<tr>
    <td><strong>${h(i.student)}</strong></td><td>${h(i.level||'')}</td>
    <td>${h(i.concern||'')}</td><td style="color:#166534">${h(i.action||'')}</td></tr>`);

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${h(titleStr)}</title>
<style>
body{font-family:Arial,sans-serif;margin:40px;font-size:13px;color:#1a2332}
h1{color:#1a3a5c;font-size:18px;margin-bottom:4px}
p.sub{color:#6b7280;font-size:12px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;margin-bottom:8px}
thead th{background:#1a3a5c;color:#fff;padding:7px 10px;text-align:left;font-size:11px}
tbody td{padding:7px 10px;border-bottom:1px solid #f0f4f8;vertical-align:top;line-height:1.5}
em{font-style:italic;color:#374151}
small{font-size:11px;color:#6b7280}
</style></head><body>
<h1>${h(titleStr)}</h1><p class="sub">${h(subtitle)}</p>
${tableHtml('Things to check before final submission',['Student / Area','Issue type','Current issue','Suggested fix'],mainRows)}
${tableHtml('Tone and wording to soften',['Student / Area','Issue type','Current wording','Suggested wording'],toneRows)}
${tableHtml('Comment and level alignment',['Student / Area','Visible level','Why to check','Possible action'],levelRows)}
<p style="color:#6b7280;font-style:italic;font-size:12px;margin-top:20px">The reports are mostly polished and professional. The items above are mainly consistency, tone, and editing checks before final submission.</p>
</body></html>`;
  dlBlob(new Blob([html],{type:'text/html;charset=utf-8'}),titleStr.replace(/\s+/g,'_')+'_feedback.html');
}

function downloadPdf(allIssues,titleStr,subtitle){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const { docWide, remaining } = consolidateIssues(allIssues);
  const mainIssues  = [...docWide,...remaining.filter(i=>['biggest','names','grammar','spelling','firstperson','wordy','duplication'].includes(i.section))];
  const toneIssues  = remaining.filter(i=>i.section==='tone');
  const levelIssues = remaining.filter(i=>i.section==='level');

  doc.setFontSize(16); doc.setTextColor(26,58,92);
  doc.text(titleStr,14,15);
  doc.setFontSize(8); doc.setTextColor(80,80,80);
  const sub=doc.splitTextToSize(subtitle,260);
  doc.text(sub,14,22);
  doc.setFontSize(7); doc.setTextColor(130,130,130);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`,14,22+sub.length*4+2);

  let startY = 22+sub.length*4+8;

  if(mainIssues.length){
    doc.setFontSize(8); doc.setTextColor(26,58,92); doc.setFont(undefined,'bold');
    doc.text('Things to check before final submission',14,startY-2);
    doc.setFont(undefined,'normal');
    doc.autoTable({
      startY,
      head:[['Student / Area','Issue type','Current issue','Suggested fix']],
      body:mainIssues.map(i=>[
        i.student||'',
        i.type||'',
        i.exactSent ? `"${i.exactSent}"${i.issue&&i.issue!==i.exactSent?' — '+i.issue:''}` : (i.issue||i.usage||''),
        i.fix||i.rec||'',
      ]),
      theme:'striped',
      headStyles:{fillColor:[26,58,92],fontSize:7,fontStyle:'bold',cellPadding:3},
      bodyStyles:{fontSize:6.5,cellPadding:3,valign:'top'},
      columnStyles:{0:{cellWidth:38},1:{cellWidth:30},2:{cellWidth:100},3:{cellWidth:90,textColor:[22,101,52]}},
      alternateRowStyles:{fillColor:[248,250,255]},
      didParseCell:(data)=>{
        if(data.section==='body' && data.row.raw[0]==='Whole document'){
          data.cell.styles.fillColor=[239,246,255];
        }
      },
    });
    startY = doc.lastAutoTable.finalY + 8;
  }

  if(toneIssues.length){
    if(startY > 170){ doc.addPage(); startY = 14; }
    doc.setFontSize(8); doc.setTextColor(26,58,92); doc.setFont(undefined,'bold');
    doc.text('Tone and wording to soften',14,startY-2);
    doc.setFont(undefined,'normal');
    doc.autoTable({
      startY,
      head:[['Student / Area','Issue type','Current wording','Suggested wording']],
      body:toneIssues.map(i=>[i.student||'',i.type||'',i.exactSent||'',i.fix||'']),
      theme:'striped',
      headStyles:{fillColor:[26,58,92],fontSize:7,fontStyle:'bold',cellPadding:3},
      bodyStyles:{fontSize:6.5,cellPadding:3,valign:'top'},
      columnStyles:{0:{cellWidth:38},1:{cellWidth:30},2:{cellWidth:100},3:{cellWidth:90,textColor:[22,101,52]}},
      alternateRowStyles:{fillColor:[248,250,255]},
    });
    startY = doc.lastAutoTable.finalY + 8;
  }

  if(levelIssues.length){
    if(startY > 170){ doc.addPage(); startY = 14; }
    doc.setFontSize(8); doc.setTextColor(26,58,92); doc.setFont(undefined,'bold');
    doc.text('Comment and level alignment',14,startY-2);
    doc.setFont(undefined,'normal');
    doc.autoTable({
      startY,
      head:[['Student / Area','Visible level','Why to check','Possible action']],
      body:levelIssues.map(i=>[i.student||'',i.level||'',i.concern||'',i.action||'']),
      theme:'striped',
      headStyles:{fillColor:[26,58,92],fontSize:7,fontStyle:'bold',cellPadding:3},
      bodyStyles:{fontSize:6.5,cellPadding:3,valign:'top'},
      columnStyles:{0:{cellWidth:38},1:{cellWidth:22},2:{cellWidth:108},3:{cellWidth:90,textColor:[22,101,52]}},
      alternateRowStyles:{fillColor:[248,250,255]},
    });
    startY = doc.lastAutoTable.finalY + 6;
  }

  if(startY < 175){
    doc.setFontSize(7); doc.setTextColor(100,100,100);
    doc.text('The reports are mostly polished and professional. The items above are mainly consistency, tone, and editing checks before final submission.',14,startY);
  }
  doc.save(titleStr.replace(/[\s—]+/g,'_')+'_feedback.pdf');
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
async function processFile(file){
  const ext = file.name.split('.').pop().toLowerCase();
  if(ext==='doc'){
    alert('Please convert this file to .docx first.\n\nOpen in Microsoft Word or Google Docs → File → Save as .docx, then upload again.');
    return;
  }
  if(ext!=='docx'&&ext!=='pdf'){
    alert('Please upload a .pdf or .docx file.');
    return;
  }

  const className    = document.getElementById('classNameInput').value.trim();
  const classListRaw = document.getElementById('classListInput').value.trim();
  const manualRoster = classListRaw
    ? new Set(classListRaw.split('\n').map(s=>s.trim()).filter(s=>s.length>=2))
    : new Set();

  let segments, roster, fullText;
  const warnings = [];

  try{
    if(ext==='docx'){
      const html   = await readDocxHtml(file);
      const result = parseHtml(html, manualRoster);
      segments = result.segments;
      roster   = result.roster;
      fullText = segments.map(s=>s.text).join('\n\n');
    } else {
      const rawItems = await readPdfRaw(file);
      const colInfo  = detectTableColumns(rawItems);

      if(colInfo && colInfo.subjects.length >= 3){
        const result = extractPdfTableSegments(rawItems, colInfo, manualRoster);
        segments = result.segments;
        roster   = result.roster;
      }

      // If column extraction found no students, fall back to linear text parsing
      if(!segments || segments.length < 2){
        fullText = reconstructLinearText(rawItems);
        const q  = checkPdfQuality(fullText);
        if(q==='empty'){
          alert('No text could be extracted from this PDF.\n\nThis may be a scanned (image-only) PDF. Please use the .docx version for best results.');
          return;
        }
        if(q==='garbled'){
          alert('This PDF could not be read clearly — complex table layouts can cause extraction issues.\n\nPlease upload the .docx version for accurate results.');
          return;
        }
        const fallback = parsePlainText(fullText, manualRoster);
        segments = fallback.segments;
        roster   = fallback.roster;
      }

      fullText = segments.map(s=>s.text).join('\n\n');
    }
  } catch(err){
    alert('Could not read this file. Make sure it is not password-protected.\n\nError: '+err.message);
    return;
  }

  if(!segments||segments.length===0){
    warnings.push('The app could not identify any student sections in this file. For best results, paste a class list in Settings above, or use the .docx version.');
  }

  const spellingPref         = document.querySelector('input[name="spelling"]:checked')?.value||'auto';
  const checkFirstPersonFlag = document.getElementById('chkFirstPerson').checked;
  const checkLevelFlag       = document.getElementById('chkLevel').checked;

  const hasManualRoster = manualRoster.size > 0;
  const { allIssues } = runAllChecks(segments||[], roster||new Set(), fullText||'', {
    spellingPref, checkFirstPersonFlag, checkLevelFlag, hasManualRoster,
  });

  const subtitle = 'Table of items to review before final submission.';
  const titleStr = className ? `${className} Report Card Feedback` : 'Report Card Feedback';

  renderResults(allIssues, warnings, file.name, className);

  const pdfFn  = ()=>downloadPdf(allIssues,titleStr,subtitle);
  const htmlFn = ()=>downloadHtml(allIssues,titleStr,subtitle);
  const csvFn  = ()=>downloadCsv(allIssues,titleStr);
  ['dlPdf','dlPdf2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.onclick=pdfFn; });
  ['dlHtml','dlHtml2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.onclick=htmlFn; });
  ['dlCsv','dlCsv2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.onclick=csvFn; });
}

/* ─── EVENT LISTENERS ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  const fileInput = document.getElementById('fileInput');
  const dropZone  = document.getElementById('dropZone');
  const fileNameEl= document.getElementById('fileName');
  const checkBtn  = document.getElementById('checkBtn');
  const spinner   = document.getElementById('spinner');
  const toggle    = document.getElementById('settingsToggle');
  const panel     = document.getElementById('settingsPanel');
  const arrow     = document.getElementById('settingsArrow');
  let chosenFile  = null;

  function setFile(f){
    chosenFile=f;
    fileNameEl.textContent=f?`Selected: ${f.name}`:'Accepts .pdf and .docx · For .doc files, save as .docx first';
    checkBtn.disabled=!f;
  }

  toggle.addEventListener('click',()=>{
    const open=!panel.hidden;
    panel.hidden=open;
    toggle.setAttribute('aria-expanded',String(!open));
    arrow.classList.toggle('open',!open);
  });

  fileInput.addEventListener('change',()=>setFile(fileInput.files[0]||null));
  dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('drag-over');});
  dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop',e=>{
    e.preventDefault();dropZone.classList.remove('drag-over');
    const f=e.dataTransfer.files[0]; if(f) setFile(f);
  });

  checkBtn.addEventListener('click',async()=>{
    if(!chosenFile) return;
    checkBtn.disabled=true; spinner.hidden=false;
    document.getElementById('resultsSection').hidden=true;
    try{ await processFile(chosenFile); }
    finally{ spinner.hidden=true; checkBtn.disabled=false; }
  });
});
