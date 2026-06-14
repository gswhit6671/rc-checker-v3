'use strict';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */

const WNS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

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
  'Statistics','Probability','Forces','Friction','Gravity','Ancient','Rome',
  'Roman','Story','Mountain','Position','Number','Shape','Space','Data',
  'Handling','Operations','Fractions','Measurement','Geometry','Algebra',
  'The','And','But','For','Not','First','Last','New','Good','Well',
  'Just','Only','Every','All','Whole','Some','Many','Name','Student',
  'Ascot','Google','Doc','Google','Term','Third','Second','First',
]);

const UK_US_PAIRS = [
  { uk:/\borganis(e|es|ed|ing|ation|ational)\b/gi, us:/\borganiz(e|es|ed|ing|ation|ational)\b/gi, ukW:'organise', usW:'organize' },
  { uk:/\banalys(e|es|ed|ing)\b/gi, us:/\banalyz(e|es|ed|ing)\b/gi, ukW:'analyse', usW:'analyze' },
  { uk:/\bcolour(s|ed|ful)?\b/gi,   us:/\bcolor(s|ed|ful)?\b/gi,   ukW:'colour',  usW:'color'   },
  { uk:/\bbehaviour(s|al)?\b/gi,    us:/\bbehavior(s|al)?\b/gi,    ukW:'behaviour',usW:'behavior'},
  { uk:/\bcentre(s|d)?\b/gi,        us:/\bcenter(s|ed)?\b/gi,      ukW:'centre',  usW:'center'  },
  { uk:/\brecognis(e|es|ed|ing)\b/gi,us:/\brecogniz(e|es|ed|ing)\b/gi,ukW:'recognise',usW:'recognize'},
  { uk:/\bsummaris(e|es|ed|ing)\b/gi,us:/\bsummariz(e|es|ed|ing)\b/gi,ukW:'summarise',usW:'summarize'},
  { uk:/\butilis(e|es|ed|ing)\b/gi, us:/\butiliz(e|es|ed|ing)\b/gi,ukW:'utilise', usW:'utilize' },
  { uk:/\blabour(s|ed)?\b/gi,       us:/\blabor(s|ed)?\b/gi,       ukW:'labour',  usW:'labor'   },
  { uk:/\bfavourite(s)?\b/gi,       us:/\bfavorite(s)?\b/gi,       ukW:'favourite',usW:'favorite'},
  { uk:/\bpractising\b/gi,          us:/\bpracticing\b/gi,         ukW:'practising',usW:'practicing'},
  { uk:/\bprogramme(s)?\b/gi,       us:/\bprogram(s)?\b/gi,        ukW:'programme',usW:'program' },
  { uk:/\bmodelling\b/gi,           us:/\bmodeling\b/gi,           ukW:'modelling',usW:'modeling'},
  { uk:/\bmaths\b/gi,               us:/\bmath\b/gi,               ukW:'maths',   usW:'math'    },
];

const TYPOS = [
  ['recieve','receive'],['recieved','received'],['acheive','achieve'],
  ['acheivement','achievement'],['occured','occurred'],['seperate','separate'],
  ['beleive','believe'],['definately','definitely'],['enviroment','environment'],
  ['grammer','grammar'],['independant','independent'],['neccessary','necessary'],
  ['perseverence','perseverance'],['resiliance','resilience'],
  ['communcation','communication'],['collaberation','collaboration'],
  ['succesful','successful'],['untill','until'],['writting','writing'],
  ['develope','develop'],['managment','management'],['relfection','reflection'],
  ['experiance','experience'],['thier','their'],['leanring','learning'],
  ['apporach','approach'],['colaborate','collaborate'],['truely','truly'],
];

const TONE_FLAGS = [
  { re:/\bstruggling\b/gi,         sug:'needs support with / is continuing to develop' },
  { re:/\bchallenging\b/gi,        sug:'initially needed support with' },
  { re:/\bweak\b/gi,               sug:'continuing to develop' },
  { re:/\bpoor\b/gi,               sug:'developing' },
  { re:/\blacks?\b/gi,             sug:'is developing / would benefit from' },
  { re:/\bdifficult\b/gi,          sug:'has found it helpful to practise' },
  { re:/\bdysregulat\w+/gi,        sug:'continuing to develop strategies to manage focus and emotions' },
  { re:/\bdistracts? others?\b/gi, sug:'is developing awareness of classroom focus' },
  { re:/\bbig feelings?\b/gi,      sug:'strong emotions / emotional responses' },
  { re:/\bintelligence\b/gi,       sug:'reasoning skills / curiosity / insight' },
  { re:/\btrue role model\b/gi,    sug:'a positive example to peers' },
  { re:/\battendance and punctuality\b/gi, sug:'punctuality and consistency' },
  { re:/\bpersonal boundaries?\b/gi, sug:'awareness of personal space and social cues' },
  { re:/\brequires teacher assistance\b/gi, sug:'works with teacher support' },
];

const LEVEL_LABEL_RE = /\b(an?\s+)(achieving|developing|emerging|extending|beginning|approaching|exceeding)\s+(student|learner|child|language\s+student|reader|writer|mathematician)\b/gi;

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */

function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function h(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function wc(t){ return (t.match(/\b[a-zA-Z]+\b/g)||[]).length; }
function cap(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }

function isLikelyStudentName(t){
  if(!t || t.length < 2 || t.length > 45) return false;
  if(/[.!?,;:–—()\[\]{}0-9]/.test(t)) return false;
  const words = t.trim().split(/\s+/);
  if(words.length < 1 || words.length > 4) return false;
  if(!words.every(w => /^[A-Z][a-zA-Z'''\-]{0,25}$/.test(w))) return false;
  if(NOT_NAMES.has(words[0])) return false;
  if(isKnownArea(words[0])) return false;
  if(words[0].length < 2) return false;
  return true;
}

function normaliseArea(raw){
  const t = (raw||'').trim();
  if(/math|numer/i.test(t))                          return 'Math';
  if(/language|english|literac|reading|writing/i.test(t)) return 'Language';
  if(/uoi|unit\s+of|inquiry|central\s+idea/i.test(t)) return 'UOI';
  if(/learner|personal\s+social|student\s+as\s+a?\s*learner/i.test(t)) return 'Learner';
  if(/science/i.test(t))                              return 'Science';
  if(/specialist|music\b|drama\b|art\b|pe\b|pspe|physical\s+ed|computing|library/i.test(t)) return 'Specialist';
  return t;
}

function isKnownArea(t){
  const n = normaliseArea(t);
  return ['Math','Language','UOI','Learner','Science','Specialist'].includes(n);
}

function extractLevel(text){
  const m = (text||'').match(/\b(Emerging|Developing|Achieving|Extending|Secure|Beginning|Approaching|Meeting|Exceeding)\b/);
  return m ? m[1] : null;
}

function splitSentences(text){
  const parts = text.match(/[^.!?]+(?:[.!?]+(?=\s+[A-Z]|\s*$)|[.!?]+)/g)||[text];
  return parts.map(s=>s.trim()).filter(s=>s.length>10 && wc(s)>=4);
}

function isUsableSentence(s){
  if(!s || wc(s)<4) return false;
  if(/[A-Z]{5,}/.test(s)) return false;
  if(/\w{20,}/.test(s)) return false;
  const ws = s.split(/\s+/);
  const avg = ws.reduce((x,w)=>x+w.replace(/[^a-zA-Z]/g,'').length,0)/ws.length;
  return avg >= 2 && avg <= 12;
}

/* ═══════════════════════════════════════════════════════════
   GARBLED TEXT DETECTION
   Skip rather than check messy extracted text.
═══════════════════════════════════════════════════════════ */

function isGarbled(text){
  if(!text || text.length < 10) return true;

  // Repeated level labels: "Developing Developing"
  if(/(Developing|Achieving|Emerging|Extending|Secure)\s+\1/i.test(text)) return true;

  // Contains document headings inside supposed comment
  if(/Term\s+\d+\s+Report/i.test(text)) return true;
  if(/\bStudent\s+Name\b|\bReport\s+Area\b|\bClass\s+List\b/i.test(text)) return true;

  // 3+ different subjects mentioned — likely merged columns
  const subjectHits = ['\\bMath\\b','\\bLanguage\\b','\\bUOI\\b','\\bLearner\\b','\\bScience\\b']
    .filter(p => new RegExp(p,'i').test(text)).length;
  if(subjectHits >= 3) return true;

  // Many roster names before first sentence (copy-paste row merge)
  const words = text.split(/\s+/);
  const leadingCaps = words.slice(0,8).filter(w => /^[A-Z][a-z]+$/.test(w) && !NOT_NAMES.has(w)).length;
  if(leadingCaps >= 4) return true;

  // No normal sentence structure (very high caps-word ratio)
  const capsRatio = words.filter(w=>/^[A-Z]{2,}$/.test(w)).length / words.length;
  if(capsRatio > 0.35 && words.length > 6) return true;

  // Too many level words in short text
  const levelCount = (text.match(/\b(Developing|Achieving|Emerging|Extending|Secure)\b/gi)||[]).length;
  if(levelCount >= 3 && text.length < 250) return true;

  return false;
}

/* ═══════════════════════════════════════════════════════════
   DOCX PARSING  (JSZip + DOMParser, table-aware)
═══════════════════════════════════════════════════════════ */

function getW(el, tag){ return Array.from(el.getElementsByTagNameNS(WNS, tag)); }

function cellText(tc){
  return getW(tc,'p')
    .map(p => getW(p,'r').map(r => getW(r,'t').map(t=>t.textContent).join('')).join(''))
    .join(' ')
    .replace(/\s+/g,' ')
    .trim();
}

async function parseDocxRows(file, manualRoster){
  let xmlStr;
  try {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entry = zip.file('word/document.xml');
    if(!entry) throw new Error('No document.xml in .docx');
    xmlStr = await entry.async('string');
  } catch(e){
    throw new Error('Could not open .docx file. Make sure it is a valid Word document.');
  }

  const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');
  const tables = getW(doc.documentElement, 'tbl');

  for(const tbl of tables){
    const rows = getW(tbl, 'tr');
    if(rows.length < 3) continue;

    const allCells = rows.map(r => getW(r,'tc').map(cellText));
    const header   = allCells[0];
    if(header.length < 3) continue;

    const normH = header.map(normaliseArea);

    // ── Landscape format: headers include known subjects ──
    const subjectCols = normH
      .map((a,i) => ({a,i}))
      .filter(({a}) => /^(Math|Language|UOI|Learner|Science|Specialist)$/.test(a));

    if(subjectCols.length >= 2){
      const studentCol = subjectCols[0].i > 0 ? subjectCols[0].i - 1 : 0;
      // check if there is a level column between student and first subject
      // (some tables have: Name | Level | Math | Language | ...)
      const levelCol = (subjectCols[0].i - studentCol > 1) ? studentCol + 1 : -1;

      const segments = [];
      const roster   = new Set(manualRoster||[]);

      for(let ri = 1; ri < allCells.length; ri++){
        const cells = allCells[ri];
        const rawName = (cells[studentCol]||'').trim();

        // Skip rows that are pure level labels (some tables have a level sub-row)
        if(/^(Emerging|Developing|Achieving|Extending|Secure)\s*$/i.test(rawName)) continue;
        if(!isLikelyStudentName(rawName)) continue;

        roster.add(rawName);

        for(const {a: area, i} of subjectCols){
          const comment = (cells[i]||'').replace(/\s+/g,' ').trim();
          if(!comment || comment.length < 20) continue;
          if(isGarbled(comment)) continue;

          const tableLevel = levelCol >= 0 ? (cells[levelCol]||'').trim() : null;
          const level = (tableLevel && /^(Emerging|Developing|Achieving|Extending|Secure)$/i.test(tableLevel))
            ? tableLevel : extractLevel(comment);

          segments.push({ studentName: rawName, reportArea: area, level, comment, sourceRef:`Row ${ri+1}`, confidence:'high' });
        }
      }

      if(segments.length > 0) return { segments, roster };
    }

    // ── Portrait format: separate Student | Area | Level | Comment columns ──
    const stuIdx  = header.findIndex(c => /^(student|name)\b/i.test(c));
    const areaIdx = header.findIndex((c,i) => i !== stuIdx && /\b(area|subject|report)\b/i.test(c));
    const lvlIdx  = header.findIndex(c => /^level\b/i.test(c));
    const cmtIdx  = header.findIndex(c => /\b(comment|text)\b/i.test(c));

    if(stuIdx >= 0 && cmtIdx >= 0){
      const segments = [];
      const roster   = new Set(manualRoster||[]);

      for(let ri = 1; ri < allCells.length; ri++){
        const cells = allCells[ri];
        const rawName = (cells[stuIdx]||'').trim();
        if(!isLikelyStudentName(rawName)) continue;
        roster.add(rawName);

        const rawArea   = areaIdx >= 0 ? cells[areaIdx] : '';
        const area      = normaliseArea(rawArea) || 'General';
        const rawLevel  = lvlIdx >= 0 ? (cells[lvlIdx]||'').trim() : null;
        const level     = (rawLevel && /^(Emerging|Developing|Achieving|Extending|Secure)$/i.test(rawLevel))
          ? rawLevel : null;
        const comment   = (cells[cmtIdx]||'').replace(/\s+/g,' ').trim();

        if(!comment || comment.length < 20) continue;
        if(isGarbled(comment)) continue;

        segments.push({ studentName: rawName, reportArea: area, level: level||extractLevel(comment), comment, sourceRef:`Row ${ri+1}`, confidence:'high' });
      }

      if(segments.length > 0) return { segments, roster };
    }
  }

  // ── Fallback: mammoth HTML extraction ──
  return await parseDocxFallback(file, manualRoster);
}

async function parseDocxFallback(file, manualRoster){
  const ab = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: ab });
  const html = result.value;
  return parseHtmlFallback(html, manualRoster);
}

function parseHtmlFallback(html, manualRoster){
  const roster = new Set(manualRoster||[]);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Try to find tables in the HTML
  const tables = Array.from(doc.querySelectorAll('table'));
  for(const tbl of tables){
    const rows = Array.from(tbl.querySelectorAll('tr'));
    if(rows.length < 3) continue;
    const header = Array.from(rows[0].querySelectorAll('td,th')).map(c=>c.textContent.trim());
    const normH = header.map(normaliseArea);
    const subjectCols = normH.map((a,i)=>({a,i})).filter(({a})=>/^(Math|Language|UOI|Learner|Science|Specialist)$/.test(a));

    if(subjectCols.length >= 2){
      const studentCol = subjectCols[0].i > 0 ? subjectCols[0].i - 1 : 0;
      const segments = [];
      for(let ri = 1; ri < rows.length; ri++){
        const cells = Array.from(rows[ri].querySelectorAll('td,th')).map(c=>c.textContent.replace(/\s+/g,' ').trim());
        const rawName = cells[studentCol]||'';
        if(!isLikelyStudentName(rawName)) continue;
        roster.add(rawName);
        for(const {a:area, i} of subjectCols){
          const comment = cells[i]||'';
          if(!comment || comment.length < 20 || isGarbled(comment)) continue;
          segments.push({ studentName:rawName, reportArea:area, level:extractLevel(comment), comment, sourceRef:`Row ${ri+1}`, confidence:'high' });
        }
      }
      if(segments.length > 0) return { segments, roster };
    }
  }

  // Last resort: try to parse as paragraphs
  const segments = [];
  const builtRoster = new Set(roster);
  const LEVEL_RE = /\b(Emerging|Developing|Achieving|Extending|Secure)\b/;
  let curStudent = null, curArea = null, buf = [];

  function flush(){
    const text = buf.join(' ').replace(/\s+/g,' ').trim(); buf = [];
    if(!text || text.length < 20 || !curStudent) return;
    if(isGarbled(text)) return;
    const level = (text.match(LEVEL_RE)||[])[1]||null;
    const area  = curArea || 'General';
    segments.push({ studentName:curStudent, reportArea:area, level, comment:text, sourceRef:'—', confidence:'low' });
  }

  for(const el of Array.from(doc.body.children)){
    const txt = el.textContent.trim();
    if(!txt) continue;
    const tag = el.tagName.toLowerCase();
    if(['h1','h2','h3','h4'].includes(tag)){
      if(isLikelyStudentName(txt)){ flush(); curStudent=txt; curArea=null; builtRoster.add(txt); }
    } else {
      const bold = el.querySelector('strong,b');
      if(bold && bold.textContent.trim()===txt && isLikelyStudentName(txt)){
        flush(); curStudent=txt; curArea=null; builtRoster.add(txt);
      } else if(isKnownArea(txt)){ flush(); curArea=normaliseArea(txt); }
      else { buf.push(txt); }
    }
  }
  flush();
  return { segments, roster:builtRoster };
}

/* ═══════════════════════════════════════════════════════════
   PDF PARSING  (PDF.js, position-based)
═══════════════════════════════════════════════════════════ */

async function readPdfItems(file){
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data:buf}).promise;
  const items = [];
  for(let p = 1; p <= pdf.numPages; p++){
    const page    = await pdf.getPage(p);
    const vp      = page.getViewport({scale:1});
    const content = await page.getTextContent();
    content.items.forEach(item=>{
      const t = item.str;
      if(!t || !t.trim()) return;
      items.push({ x: item.transform[4], y: Math.round(vp.height - item.transform[5]), text: t.trim(), page: p });
    });
  }
  return items;
}

function groupIntoRows(items, yTol=5){
  const sorted = [...items].sort((a,b)=> a.page!==b.page ? a.page-b.page : a.y-b.y);
  const rows = [];
  let cur = null;
  sorted.forEach(item=>{
    if(!cur || item.page!==cur.page || Math.abs(item.y-cur.y)>yTol){
      if(cur) rows.push(cur);
      cur = { y:item.y, page:item.page, items:[item] };
    } else {
      cur.items.push(item);
    }
  });
  if(cur) rows.push(cur);
  rows.forEach(r => r.items.sort((a,b)=>a.x-b.x));
  return rows;
}

function detectPdfColumns(rows){
  // Find row with 2+ known subject headings
  for(const row of rows){
    const texts = row.items.map(i=>i.text.trim());
    const hits  = texts.filter(t => /^(Math|Maths|Mathematics|Language|English|UOI|Unit\s+of|Learner|Science|Specialist|Learning)$/i.test(t));
    if(hits.length >= 2){
      const xs = row.items.map(i=>i.x).sort((a,b)=>a-b);
      const boundaries = [0];
      for(let i=1; i<xs.length; i++) boundaries.push((xs[i-1]+xs[i])/2);
      const subjects = row.items.map(i=>normaliseArea(i.text));
      return { boundaries, subjects };
    }
  }
  return null;
}

function assignColumn(x, boundaries){
  let c = 0;
  for(let i=1; i<boundaries.length; i++) if(x >= boundaries[i]) c = i;
  return c;
}

async function parsePdfRows(file, manualRoster){
  const items   = await readPdfItems(file);
  const rows    = groupIntoRows(items);
  const colInfo = detectPdfColumns(rows);

  if(!colInfo || colInfo.subjects.length < 3){
    // No clear table structure — ask for .docx
    return { segments: [], roster: new Set(manualRoster||[]), noTable: true };
  }

  const { boundaries, subjects } = colInfo;

  // Assign each PDF text item to its column
  const colBuckets = subjects.map(()=>[]);
  items.forEach(item=>{
    const c = assignColumn(item.x, boundaries);
    if(c < colBuckets.length) colBuckets[c].push(item);
  });

  // Merge col0 items into lines
  function mergeItems(bucket){
    const sorted = [...bucket].sort((a,b)=> a.page!==b.page ? a.page-b.page : a.y!==b.y ? a.y-b.y : a.x-b.x);
    const lines = [];
    let cur = null;
    sorted.forEach(item=>{
      if(!cur || item.page!==cur.page || Math.abs(item.y-cur.y)>5){
        if(cur) lines.push(cur);
        cur = { y:item.y, page:item.page, text:item.text };
      } else {
        cur.text += (cur.text.endsWith(' ')||item.text.startsWith(' ') ? '' : ' ') + item.text;
      }
    });
    if(cur) lines.push(cur);
    return lines;
  }

  const nameLines    = mergeItems(colBuckets[0]);
  const subjectLines = colBuckets.slice(1).map(mergeItems);

  // Build student list from col0 — only proper names
  const roster = new Set(manualRoster||[]);
  const studentEntries = [];

  nameLines.forEach(line=>{
    const t = line.text.trim();
    if(/^(Student|Name|Level|Emerging|Developing|Achieving|Extending|Secure)$/i.test(t)) return;
    if(isLikelyStudentName(t)){
      studentEntries.push({ name:t, y:line.y, page:line.page });
      roster.add(t);
    }
  });

  if(studentEntries.length < 2){
    return { segments:[], roster, noTable: true };
  }

  // Build segments
  const segments = [];

  for(let si = 0; si < studentEntries.length; si++){
    const stu     = studentEntries[si];
    const nextStu = studentEntries[si+1];

    for(let ci = 0; ci < subjectLines.length; ci++){
      const area = subjects[ci+1] || 'General';
      const commentLines = subjectLines[ci].filter(line=>{
        if(line.page < stu.page) return false;
        if(line.page === stu.page && line.y < stu.y - 3) return false;
        if(nextStu){
          if(line.page > nextStu.page) return false;
          if(line.page === nextStu.page && line.y >= nextStu.y - 3) return false;
        }
        return true;
      });

      const comment = commentLines.map(l=>l.text).join(' ').replace(/\s+/g,' ').trim();
      if(!comment || comment.length < 20) continue;
      if(isGarbled(comment)) continue;

      const level = extractLevel(comment);
      segments.push({ studentName:stu.name, reportArea:area, level, comment, sourceRef:`Page ${stu.page}`, confidence:'high' });
    }
  }

  return { segments, roster };
}

/* ═══════════════════════════════════════════════════════════
   CHECKS
═══════════════════════════════════════════════════════════ */

/* A. Wrong name ──────────────────────────────────────────── */
function checkWrongName(seg, roster){
  const { studentName, reportArea, comment } = seg;
  const firstName = studentName.split(/[\s\-]+/)[0];
  const issues    = [];

  for(const other of roster){
    if(issues.length >= 2) break;
    if(other === studentName) continue;
    const otherFirst = other.split(/[\s\-]+/)[0];
    const otherFirstCap = cap(otherFirst);
    // Only check real roster names — must be in roster and not a keyword
    if(otherFirst.length < 3) continue;
    if(NOT_NAMES.has(otherFirst) || NOT_NAMES.has(otherFirstCap)) continue;

    const re = new RegExp(`\\b${escRe(otherFirst)}\\b`,'g');
    for(const sent of splitSentences(comment)){
      if(!isUsableSentence(sent)) continue;
      if(!re.test(sent)) continue;
      re.lastIndex = 0;
      // If the student's own name is also in the sentence, skip (might be a comparison)
      if(new RegExp(`\\b${escRe(firstName)}\\b`,'i').test(sent)) continue;
      const corrected = sent.replace(new RegExp(`\\b${escRe(otherFirst)}\\b`,'g'), firstName);
      issues.push({
        section:'names', type:'Wrong name',
        studentArea:`${studentName} — ${reportArea}`,
        whatToCheck: sent,
        suggestedFix:`Check if this should say "${firstName}" instead of "${otherFirst}": "${corrected}"`,
      });
      break;
    }
  }
  return issues;
}

/* B. Pronoun inconsistency ───────────────────────────────── */
function checkPronouns(seg){
  const { studentName, reportArea, comment } = seg;
  const sents   = splitSentences(comment).filter(isUsableSentence);
  const heSents = sents.filter(s=>/\b(he|him|his)\b/i.test(s));
  const sheSents= sents.filter(s=>/\b(she|her|hers)\b/i.test(s));
  if(heSents.length > 0 && sheSents.length > 0){
    return [{
      section:'names', type:'Pronoun inconsistency',
      studentArea:`${studentName} — ${reportArea}`,
      whatToCheck:`"${heSents[0].trim()}" / "${sheSents[0].trim()}"`,
      suggestedFix:`Choose one pronoun set (he/him/his or she/her) and use it consistently throughout the ${reportArea} comment.`,
    }];
  }
  return [];
}

/* C. Spelling typos ──────────────────────────────────────── */
function checkTypos(seg){
  const { studentName, reportArea, comment } = seg;
  const issues = [];
  const seen   = new Set();
  for(const [wrong, right] of TYPOS){
    const re = new RegExp(`\\b${escRe(wrong)}\\b`,'gi');
    const m  = re.exec(comment);
    if(m && !seen.has(wrong)){
      seen.add(wrong);
      issues.push({
        section:'spelling', type:'Spelling error',
        studentArea:`${studentName} — ${reportArea}`,
        whatToCheck:`"${m[0]}"`,
        suggestedFix:`Change to "${right}"`,
      });
    }
  }
  return issues;
}

/* D. UK/US consistency (whole document) ──────────────────── */
function checkSpellingConsistency(allComments, pref){
  const issues = [];
  const fullText = allComments.join(' ');

  let ukCount = 0, usCount = 0;
  UK_US_PAIRS.forEach(p=>{
    ukCount += (fullText.match(p.uk)||[]).length;
    usCount += (fullText.match(p.us)||[]).length;
  });

  let domStyle = 'either';
  if(pref === 'uk') domStyle = 'uk';
  else if(pref === 'us') domStyle = 'us';
  else if(ukCount > 0 && usCount > 0) domStyle = 'mixed';
  else if(ukCount > 0) domStyle = 'uk';
  else if(usCount > 0) domStyle = 'us';

  if(domStyle === 'mixed'){
    const ukExamples = [], usExamples = [];
    UK_US_PAIRS.forEach(p=>{
      const ukM = fullText.match(p.uk);
      const usM = fullText.match(p.us);
      if(ukM && usM){
        if(!ukExamples.find(e=>e.word===p.ukW)) ukExamples.push({word:p.ukW, count:ukM.length});
        if(!usExamples.find(e=>e.word===p.usW)) usExamples.push({word:p.usW, count:usM.length});
      }
    });
    if(ukExamples.length > 0 || usExamples.length > 0){
      const ukList = ukExamples.slice(0,3).map(e=>`"${e.word}"`).join(', ');
      const usList = usExamples.slice(0,3).map(e=>`"${e.word}"`).join(', ');
      issues.push({
        section:'spelling', type:'UK/US spelling mix',
        studentArea:'Whole document',
        whatToCheck:`Both UK (${ukList}) and US (${usList}) spellings appear.`,
        suggestedFix:'Choose one spelling style and apply it consistently across all comments.',
      });
    }
  } else if(domStyle === 'uk' && pref === 'us'){
    issues.push({
      section:'spelling', type:'Spelling style',
      studentArea:'Whole document',
      whatToCheck:'Document uses UK spelling (e.g. "organise", "behaviour").',
      suggestedFix:'Change to US spelling throughout if US English is preferred.',
    });
  } else if(domStyle === 'us' && pref === 'uk'){
    issues.push({
      section:'spelling', type:'Spelling style',
      studentArea:'Whole document',
      whatToCheck:'Document uses US spelling (e.g. "organize", "behavior").',
      suggestedFix:'Change to UK spelling throughout if UK English is preferred.',
    });
  }

  return issues;
}

/* E. Grammar and punctuation ─────────────────────────────── */
const GRAMMAR_CHECKS = [
  // Missing space after full stop
  { re:/([a-z]\.)([A-Z])/g, fix:(m,a,b)=>`${a} ${b}`, type:'Missing space after full stop', desc:(m)=>`"${m[0]}" — missing space` },
  // Extra punctuation
  { re:/([.!?,])\s*\1+/g, fix:(m,a)=>a, type:'Duplicate punctuation', desc:(m)=>`"${m[0]}" — duplicate punctuation mark` },
  // Extra space before punctuation
  { re:/\s+([.,;:!?])/g, fix:(m,a)=>a, type:'Space before punctuation', desc:(m)=>`"${m[0]}" — extra space before punctuation` },
  // Double space
  { re:/([^\s])\s{2,}([^\s])/g, fix:(m,a,b)=>`${a} ${b}`, type:'Extra space', desc:(m)=>`double space in text` },
  // Duplicate words
  { re:/\b(and|the|is|a|an|to|of|in|for|on|at|with|that|this|or|but|as|if|by|from|up)\s+\1\b/gi,
    fix:(m,a)=>a, type:'Duplicate word', desc:(m)=>`"${m[0]}" — repeated word` },
  // Missing article (basic)
  { re:/\bWhile (he|she|they) is (highly )?(independent|confident|capable|creative|curious)\s+learner\b/gi,
    fix:(m,p,q,adj)=>`While ${p} is ${q||''}a${adj.match(/^[aeiou]/i)?'n':''} ${adj} learner`,
    type:'Missing article', desc:(m)=>`"${m[0]}" — missing article "a/an"` },
];

function checkGrammar(seg){
  const { studentName, reportArea, comment } = seg;
  const issues = [];
  const seen = new Set();

  for(const check of GRAMMAR_CHECKS){
    check.re.lastIndex = 0;
    for(const sent of splitSentences(comment)){
      if(!isUsableSentence(sent)) continue;
      check.re.lastIndex = 0;
      const m = check.re.exec(sent);
      if(m && !seen.has(check.type + m[0])){
        seen.add(check.type + m[0]);
        const fixed = typeof check.fix === 'function' ? sent.replace(new RegExp(check.re.source, check.re.flags), check.fix) : sent;
        issues.push({
          section: check.type === 'Duplicate word' ? 'duplication' : 'grammar',
          type: check.type,
          studentArea:`${studentName} — ${reportArea}`,
          whatToCheck: check.desc(m),
          suggestedFix: check.type === 'Duplicate word' ? `Remove one "${m[1]}"` : `"${fixed.trim()}"`,
        });
      }
    }
  }

  // Hyphenation checks
  const HYPHEN_RE = /\b(four|five|six|seven|eight|nine|ten|three|two)\s+(paragraph|page|sentence|week|day|year|hour|minute|word|part)\s+(persuasive|essay|letter|story|report|plan)\b/gi;
  HYPHEN_RE.lastIndex = 0;
  const hm = HYPHEN_RE.exec(comment);
  if(hm && !seen.has('hyphen'+hm[0])){
    seen.add('hyphen'+hm[0]);
    const fixed = hm[0].replace(/\s+/g,'-');
    issues.push({
      section:'grammar', type:'Hyphenation',
      studentArea:`${studentName} — ${reportArea}`,
      whatToCheck:`"${hm[0]}" — compound adjective should be hyphenated`,
      suggestedFix:`"${fixed}"`,
    });
  }

  return issues;
}

/* F. Tone and sensitive wording ──────────────────────────── */
function checkTone(seg){
  const { studentName, reportArea, comment } = seg;
  const issues = [];
  const seen   = new Set();

  for(const {re, sug} of TONE_FLAGS){
    re.lastIndex = 0;
    const m = re.exec(comment);
    if(m && !seen.has(m[0].toLowerCase())){
      seen.add(m[0].toLowerCase());
      // Find the sentence containing this word
      const sent = splitSentences(comment).find(s => {
        re.lastIndex = 0;
        return re.test(s);
      }) || comment.slice(0,120);
      re.lastIndex = 0;
      issues.push({
        section:'tone',
        type:'Sensitive wording',
        studentArea:`${studentName} — ${reportArea}`,
        currentWording: `"${sent.trim().slice(0,100)}"`,
        concern: `"${m[0]}" may be too direct or negative for a parent report.`,
        suggestedWording: `Consider: ${sug}`,
      });
    }
  }
  return issues;
}

/* G. Wordiness and informal wording ──────────────────────── */
const WORDY = [
  { re:/\bnomenclature\b/gi,               sug:'fraction vocabulary / mathematical vocabulary' },
  { re:/\bRoman toilet cleaner\b/gi,       sug:'Roman sanitation worker' },
  { re:/\bfoster(s|ed|ing)? independence and agency\b/gi, sug:'build independence' },
  { re:/\bleverage[sd]?\b/gi,              sug:'use / apply' },
  { re:/\butiliz(e|es|ed|ing)\b/gi,        sug:'use' },
  { re:/\butilis(e|es|ed|ing)\b/gi,        sug:'use' },
  { re:/\bin order to\b/gi,                sug:'to' },
  { re:/\bdue to the fact that\b/gi,       sug:'because' },
  { re:/\bat this point in time\b/gi,      sug:'now / currently' },
  { re:/\bvery unique\b/gi,                sug:'"unique" — "unique" needs no intensifier' },
  { re:/\bmore better\b/gi,                sug:'"better"' },
  { re:/\bI'm\b/gi,                        sug:'"I am" — or rephrase to remove first person' },
  { re:/\bdon\'?t\b/gi,                    sug:'"do not" — avoid contractions in reports' },
  { re:/\bcan\'?t\b/gi,                    sug:'"cannot" — avoid contractions in reports' },
  { re:/\bwon\'?t\b/gi,                    sug:'"will not" — avoid contractions in reports' },
  { re:/\bisn\'?t\b/gi,                    sug:'"is not" — avoid contractions in reports' },
  { re:/\baren\'?t\b/gi,                   sug:'"are not" — avoid contractions in reports' },
  { re:/\bwasn\'?t\b/gi,                   sug:'"was not" — avoid contractions in reports' },
  { re:/\bwe\'?re\b/gi,                    sug:'"we are" — or rephrase to remove first person' },
];

function checkWordiness(seg){
  const { studentName, reportArea, comment } = seg;
  const issues = [];
  const seen   = new Set();
  for(const {re, sug} of WORDY){
    re.lastIndex = 0;
    const m = re.exec(comment);
    if(m && !seen.has(m[0].toLowerCase())){
      seen.add(m[0].toLowerCase());
      issues.push({
        section:'wordiness', type:'Wording to improve',
        studentArea:`${studentName} — ${reportArea}`,
        whatToCheck:`"${m[0]}"`,
        suggestedFix:`Consider: ${sug}`,
      });
    }
  }
  return issues;
}

/* H. First-person language ───────────────────────────────── */
const OUR_UNIT_RE = /\bour\s+(units?\s+of\s+inquiry|inquiry|unit|study|learning\s+community|biography\s+unit|topic|exploration)\b/gi;
const WE_RE       = /\b(we|we've|we're|we'd)\b/gi;
const I_RE        = /\b(I|I'm|I've|I'd|I'll)\b/g;

function checkFirstPerson(seg){
  const { studentName, reportArea, comment } = seg;
  const issues = [];
  const seen   = new Set();

  OUR_UNIT_RE.lastIndex = 0;
  let m = OUR_UNIT_RE.exec(comment);
  while(m){
    if(!seen.has('our'+m[0].toLowerCase())){
      seen.add('our'+m[0].toLowerCase());
      const fixed = m[0].replace(/\bour\b/gi, 'the');
      issues.push({
        section:'grammar', type:'First-person "our"',
        studentArea:`${studentName} — ${reportArea}`,
        whatToCheck:`"${m[0]}"`,
        suggestedFix:`"${fixed}" — reports should use "the" not "our"`,
      });
    }
    m = OUR_UNIT_RE.exec(comment);
  }

  WE_RE.lastIndex = 0;
  const wm = WE_RE.exec(comment);
  if(wm && !seen.has('we')){
    seen.add('we');
    issues.push({
      section:'grammar', type:'First-person "we"',
      studentArea:`${studentName} — ${reportArea}`,
      whatToCheck:`"${wm[0]}" in comment`,
      suggestedFix:'Rephrase to remove "we" — reports should be written about the student, not from the teacher\'s perspective.',
    });
  }

  I_RE.lastIndex = 0;
  const im = I_RE.exec(comment);
  if(im && !seen.has('I')){
    seen.add('I');
    issues.push({
      section:'grammar', type:'First-person "I"',
      studentArea:`${studentName} — ${reportArea}`,
      whatToCheck:`"${im[0]}" in comment`,
      suggestedFix:'Rephrase to remove "I" — reports should focus on the student, not the teacher.',
    });
  }

  return issues;
}

/* I. Duplication and contradiction ───────────────────────── */
function checkDuplication(seg){
  const { studentName, reportArea, comment } = seg;
  const issues = [];
  const seen   = new Set();
  const sents  = splitSentences(comment).filter(isUsableSentence);

  // Repeated transition words
  const TRANSITIONS = ['Furthermore','Additionally','Moreover','However','Therefore','Also'];
  const transFound = [];
  for(const t of TRANSITIONS){
    const re = new RegExp(`\\b${t}\\b`,'gi');
    const count = (comment.match(re)||[]).length;
    if(count >= 2) transFound.push(t);
  }
  for(const t of transFound){
    if(!seen.has('trans'+t)){
      seen.add('trans'+t);
      issues.push({
        section:'duplication', type:'Repeated transition',
        studentArea:`${studentName} — ${reportArea}`,
        whatToCheck:`"${t}" appears multiple times in this comment.`,
        suggestedFix:`Use "${t}" only once. Vary with synonyms or restructure the sentence.`,
      });
    }
  }

  // Contradiction check: "can X" vs "is learning to X" / "is developing X"
  const CAN_RE  = /\bcan\s+(\w+)\b/gi;
  const CANT_RE = /\bis (?:learning|developing|working on|beginning) to\s+(\w+)\b/gi;
  const canVerbs  = [];
  const cantVerbs = [];
  let cm; CAN_RE.lastIndex=0;
  while((cm=CAN_RE.exec(comment))) canVerbs.push(cm[1].toLowerCase());
  let dm; CANT_RE.lastIndex=0;
  while((dm=CANT_RE.exec(comment))) cantVerbs.push(dm[1].toLowerCase());

  for(const v of canVerbs){
    if(cantVerbs.includes(v) && !seen.has('contra'+v)){
      seen.add('contra'+v);
      issues.push({
        section:'duplication', type:'Possible contradiction',
        studentArea:`${studentName} — ${reportArea}`,
        whatToCheck:`Comment says both "can ${v}" and "is learning to ${v}" (or similar).`,
        suggestedFix:`Keep one version — either the student can do this (use "can ${v}") or is still developing it (use "is developing").`,
      });
    }
  }

  return issues;
}

/* J. Level label ("an achieving student") ────────────────── */
function checkLevelLabel(seg){
  const { studentName, reportArea, comment } = seg;
  const issues = [];
  LEVEL_LABEL_RE.lastIndex = 0;
  const m = LEVEL_LABEL_RE.exec(comment);
  if(m){
    issues.push({
      section:'biggest', type:'Level label as description',
      studentArea:`${studentName} — ${reportArea}`,
      whatToCheck:`"${m[0].trim()}"`,
      suggestedFix:`Do not use the student's level as a descriptor. Describe what they do: e.g. "demonstrates strong understanding of..." or name the specific skill.`,
    });
  }
  return issues;
}

/* K. Level alignment ─────────────────────────────────────── */
const STRONG_WORDS = /\b(exceptional|exemplary|outstanding|remarkable|insightful|extraordinary|mastery|sophisticated|beyond expectations|extends beyond)\b/gi;
const WEAK_WORDS   = /\b(beginning to|rarely|seldom|with significant support|not yet|unable to)\b/gi;

function checkLevelAlignment(seg){
  const { studentName, reportArea, comment, level } = seg;
  if(!level) return [];
  const issues = [];

  if(/^(Developing|Emerging)$/i.test(level)){
    STRONG_WORDS.lastIndex = 0;
    const m = STRONG_WORDS.exec(comment);
    if(m){
      issues.push({
        section:'level', type:'Level alignment',
        studentArea:`${studentName} — ${reportArea}`,
        visibleLevel: level,
        whyCheck:`Comment uses "${m[0]}" but the level is ${level}.`,
        possibleAction:`Either adjust the level upward or soften the wording to match a ${level} level.`,
      });
    }
  }

  if(/^(Achieving|Extending)$/i.test(level)){
    WEAK_WORDS.lastIndex = 0;
    const m = WEAK_WORDS.exec(comment);
    if(m){
      issues.push({
        section:'level', type:'Level alignment',
        studentArea:`${studentName} — ${reportArea}`,
        visibleLevel: level,
        whyCheck:`Comment uses "${m[0]}" but the level is ${level}.`,
        possibleAction:`Either adjust the level downward or revise the wording to reflect the ${level} level.`,
      });
    }
  }

  return issues;
}

/* ═══════════════════════════════════════════════════════════
   RUN ALL CHECKS
═══════════════════════════════════════════════════════════ */

function runAllChecks(segments, roster, settings){
  const { spellingPref, checkFirstPersonFlag, checkLevelFlag, hasManualRoster } = settings;
  const allComments = segments.map(s=>s.comment);
  const issues = [];

  // Whole-document spelling consistency
  checkSpellingConsistency(allComments, spellingPref).forEach(i=>issues.push(i));

  for(const seg of segments){
    // Wrong name — only when class list provided
    if(hasManualRoster) checkWrongName(seg, roster).forEach(i=>issues.push(i));
    checkPronouns(seg).forEach(i=>issues.push(i));
    checkLevelLabel(seg).forEach(i=>issues.push(i));
    checkTypos(seg).forEach(i=>issues.push(i));
    checkGrammar(seg).forEach(i=>issues.push(i));
    checkTone(seg).forEach(i=>issues.push(i));
    checkWordiness(seg).forEach(i=>issues.push(i));
    checkDuplication(seg).forEach(i=>issues.push(i));
    if(checkFirstPersonFlag) checkFirstPerson(seg).forEach(i=>issues.push(i));
    if(checkLevelFlag) checkLevelAlignment(seg).forEach(i=>issues.push(i));
  }

  // Consolidate: level labels → one "Whole document" row if 3+
  return consolidate(issues);
}

function consolidate(issues){
  const skipIdx = new Set();
  const extra   = [];

  // Level label: 3+ occurrences → consolidate
  const lblIdx = issues.reduce((acc,i,idx)=>{ if(i.type==='Level label as description') acc.push(idx); return acc; },[]);
  if(lblIdx.length >= 3){
    const examples = [...new Set(lblIdx.slice(0,3).map(idx=>{
      LEVEL_LABEL_RE.lastIndex=0;
      const m = LEVEL_LABEL_RE.exec(issues[idx].whatToCheck||'');
      return m ? m[0].trim() : issues[idx].whatToCheck||'';
    }))].slice(0,3);
    extra.push({
      section:'biggest', type:'Level label as description',
      studentArea:'Whole document',
      whatToCheck:`${lblIdx.length} comments use a level label as a description (${examples.map(e=>`"${e}"`).join(', ')}…).`,
      suggestedFix:`Do not describe students by their level label. Describe what they do instead.`,
    });
    lblIdx.forEach(idx=>skipIdx.add(idx));
  }

  // "our [unit]" first-person: 3+ → one whole-document row
  const ourIdx = issues.reduce((acc,i,idx)=>{ if(i.type==='First-person "our"') acc.push(idx); return acc; },[]);
  if(ourIdx.length >= 3){
    const examples = [...new Set(ourIdx.slice(0,3).map(idx=>issues[idx].whatToCheck||''))].slice(0,3);
    extra.push({
      section:'grammar', type:'First-person "our" (whole document)',
      studentArea:'Whole document',
      whatToCheck:`${ourIdx.length} comments use "our" for the unit/inquiry (e.g. ${examples.map(e=>`${e}`).join(', ')}).`,
      suggestedFix:`Change "our" to "the" throughout — e.g. "our Units of Inquiry" → "the Units of Inquiry".`,
    });
    ourIdx.forEach(idx=>skipIdx.add(idx));
  }

  const remaining = issues.filter((_,idx)=>!skipIdx.has(idx));
  return [...extra, ...remaining];
}

/* ═══════════════════════════════════════════════════════════
   RENDERING
═══════════════════════════════════════════════════════════ */

function renderPreview(segments, skippedCount){
  const tbody = document.getElementById('previewBody');
  tbody.innerHTML = '';

  segments.forEach(seg=>{
    const tr = document.createElement('tr');
    const preview = seg.comment.slice(0,90) + (seg.comment.length > 90 ? '…' : '');
    tr.innerHTML = `
      <td class="td-student">${h(seg.studentName)}</td>
      <td>${h(seg.reportArea)}</td>
      <td>${h(seg.level||'—')}</td>
      <td class="td-comment-preview">${h(preview)}</td>
      <td class="status-ready">&#10003; Ready</td>`;
    tbody.appendChild(tr);
  });

  const skipNote = document.getElementById('skipNote');
  if(skippedCount > 0){
    skipNote.hidden = false;
    skipNote.innerHTML = `<strong>&#9888;</strong> ${skippedCount} section${skippedCount>1?'s were':' was'} skipped because the student name or report area could not be read clearly. Only clearly identified rows are shown above.`;
  } else {
    skipNote.hidden = true;
  }

  document.getElementById('previewSection').hidden = false;
  document.getElementById('previewSection').scrollIntoView({ behavior:'smooth', block:'start' });
}

function renderResults(issues, warnings, className){
  const titleStr = className ? `${className} Report Card Feedback` : 'Report Card Feedback';
  document.getElementById('resultsTitle').textContent = titleStr;

  // Summary pills
  const SECTIONS = [
    { key:'biggest',    label:'Biggest fixes',      emoji:'🔴' },
    { key:'names',      label:'Names & pronouns',   emoji:'🟡' },
    { key:'spelling',   label:'Spelling',            emoji:'🟡' },
    { key:'grammar',    label:'Grammar & style',     emoji:'🟡' },
    { key:'tone',       label:'Tone',                emoji:'🟠' },
    { key:'wordiness',  label:'Wording',             emoji:'🔵' },
    { key:'duplication',label:'Duplication',         emoji:'🔵' },
    { key:'level',      label:'Level alignment',     emoji:'🟢' },
  ];
  const counts = {};
  SECTIONS.forEach(s=>{ counts[s.key] = issues.filter(i=>i.section===s.key).length; });
  const total = issues.length;

  const bar = document.getElementById('summaryBar');
  bar.innerHTML = `<div class="summary-pill${total===0?' green':total<=5?' amber':' red'}"><span class="pill-count">${total}</span> total items</div>` +
    SECTIONS.filter(s=>counts[s.key]>0).map(s=>
      `<div class="summary-pill"><span class="pill-count">${counts[s.key]}</span> ${s.label}</div>`
    ).join('');

  // Warnings
  const warnBox = document.getElementById('extractionWarning');
  if(warnings.length > 0){
    document.getElementById('warningList').innerHTML = warnings.map(w=>`<li>${h(w)}</li>`).join('');
    warnBox.hidden = false;
  } else {
    warnBox.hidden = true;
  }

  // Build feedback sections
  const body = document.getElementById('feedbackBody');
  body.innerHTML = '';

  if(total === 0){
    body.innerHTML = '<div class="feedback-section"><div class="section-heading">No major issues found</div><div class="section-ok">&#10003; No major issues found. Please still complete a final teacher read-through before submitting reports.</div></div>';
  } else {
    SECTIONS.forEach(sec=>{
      const secIssues = issues.filter(i=>i.section===sec.key);
      if(secIssues.length === 0) return;

      let tableHtml;
      if(sec.key === 'tone'){
        tableHtml = renderToneTable(secIssues);
      } else if(sec.key === 'level'){
        tableHtml = renderLevelTable(secIssues);
      } else if(sec.key === 'spelling'){
        tableHtml = renderSpellingTable(secIssues);
      } else {
        tableHtml = renderMainTable(secIssues);
      }

      const TITLES = {
        biggest:'Biggest fixes needed',
        names:'Name and pronoun consistency',
        spelling:'Spelling and UK/US consistency',
        grammar:'Grammar, punctuation, and style',
        tone:'Tone — comments to soften',
        wordiness:'Wordiness and informal wording',
        duplication:'Duplication and contradiction',
        level:'Comment and level alignment',
      };

      body.innerHTML += `<div class="feedback-section">
        <div class="section-heading">${h(TITLES[sec.key]||sec.key)} <span class="section-count">${secIssues.length}</span></div>
        ${tableHtml}
      </div>`;
    });
  }

  // Priority checklist
  const priorities = buildPriorities(issues);
  const pBox = document.getElementById('priorityBox');
  if(priorities.length > 0){
    document.getElementById('priorityTable').innerHTML = priorities.map((p,i)=>
      `<tr><td class="priority-num">Priority ${i+1}</td><td class="priority-action">${h(p)}</td></tr>`
    ).join('');
    pBox.hidden = false;
  } else {
    pBox.hidden = true;
  }

  // Footer
  document.getElementById('resultsFooter').textContent = total > 0
    ? 'Overall: The reports are mostly polished and professional. The items above are mainly consistency, tone, and editing checks before final submission.'
    : 'No major issues found. Please still complete a final teacher read-through before submitting reports.';

  document.getElementById('resultsSection').hidden = false;
  document.getElementById('resultsSection').scrollIntoView({ behavior:'smooth', block:'start' });
}

function renderMainTable(issues){
  const rows = issues.map(i=>{
    const isDoc = i.studentArea === 'Whole document';
    const badge = `<span class="type-badge${isDoc?' type-badge--doc':''}">${h(i.type||'')}</span>`;
    const check = i.whatToCheck
      ? `<em class="exact-quote">${h(i.whatToCheck)}</em>`
      : `<span class="issue-note">${h(i.suggestedFix||'')}</span>`;
    return `<tr${isDoc?' class="whole-doc-row"':''}>
      <td class="td-student">${h(i.studentArea)}</td>
      <td>${badge}</td>
      <td class="td-issue">${check}</td>
      <td class="td-fix">${h(i.suggestedFix||'')}</td>
    </tr>`;
  }).join('');
  return `<div class="table-wrap"><table>
    <thead><tr><th>Student / Area</th><th>Issue type</th><th>What to check</th><th>Suggested fix</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderToneTable(issues){
  const rows = issues.map(i=>`<tr>
    <td class="td-student">${h(i.studentArea)}</td>
    <td class="td-current">${h(i.currentWording||'')}</td>
    <td class="td-concern">${h(i.concern||'')}</td>
    <td class="td-suggest">${h(i.suggestedWording||'')}</td>
  </tr>`).join('');
  return `<div class="table-wrap"><table>
    <thead><tr><th>Student / Area</th><th>Current wording</th><th>Concern</th><th>Suggested wording</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderSpellingTable(issues){
  const rows = issues.map(i=>{
    const isDoc = i.studentArea === 'Whole document';
    return `<tr${isDoc?' class="whole-doc-row"':''}>
      <td class="td-student">${h(i.studentArea)}</td>
      <td>${h(i.whatToCheck||i.type||'')}</td>
      <td class="td-fix">${h(i.suggestedFix||'')}</td>
    </tr>`;
  }).join('');
  return `<div class="table-wrap"><table>
    <thead><tr><th>Student / Area</th><th>Current usage</th><th>Recommendation</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderLevelTable(issues){
  const rows = issues.map(i=>`<tr>
    <td class="td-student">${h(i.studentArea)}</td>
    <td>${h(i.visibleLevel||'')}</td>
    <td class="td-why">${h(i.whyCheck||'')}</td>
    <td class="td-suggest">${h(i.possibleAction||'')}</td>
  </tr>`).join('');
  return `<div class="table-wrap"><table>
    <thead><tr><th>Student / Area</th><th>Visible level</th><th>Why to check</th><th>Possible action</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function buildPriorities(issues){
  const items = [];
  const biggest = issues.filter(i=>i.section==='biggest');
  if(biggest.length > 0) items.push(`Fix ${biggest.length} high-priority issue${biggest.length>1?'s':''}: ${biggest.slice(0,3).map(i=>i.type).join(', ')}${biggest.length>3?' and others':''}.`);
  if(issues.some(i=>i.section==='names')) items.push('Check name and pronoun consistency in flagged comments.');
  if(issues.some(i=>i.section==='spelling')) items.push('Resolve spelling and UK/US consistency across the document.');
  if(issues.some(i=>i.section==='tone')) items.push('Review tone comments and soften any sensitive wording.');
  if(issues.some(i=>i.section==='grammar')) items.push('Correct grammar, punctuation, and first-person wording.');
  if(issues.some(i=>i.section==='level')) items.push('Review comment/level alignment items before finalising levels.');
  return items.slice(0,6);
}

/* ═══════════════════════════════════════════════════════════
   DOWNLOADS
═══════════════════════════════════════════════════════════ */

function triggerDownload(url, name){
  Object.assign(document.createElement('a'),{href:url,download:name}).click();
}

function downloadPdf(issues, title){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
  const NAVY = [26, 58, 92];

  doc.setFontSize(16); doc.setTextColor(...NAVY);
  doc.text(title, 14, 18);
  doc.setFontSize(10); doc.setTextColor(100);
  doc.text('Only comments that need attention are included.', 14, 25);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 30);

  const SECTIONS = [
    { key:'biggest',    label:'Biggest fixes needed' },
    { key:'names',      label:'Name and pronoun consistency' },
    { key:'spelling',   label:'Spelling and UK/US consistency' },
    { key:'grammar',    label:'Grammar, punctuation, and style' },
    { key:'tone',       label:'Tone — comments to soften' },
    { key:'wordiness',  label:'Wordiness and informal wording' },
    { key:'duplication',label:'Duplication and contradiction' },
    { key:'level',      label:'Comment and level alignment' },
  ];

  let y = 36;

  SECTIONS.forEach(sec=>{
    const secIssues = issues.filter(i=>i.section===sec.key);
    if(!secIssues.length) return;

    if(y > 170){ doc.addPage(); y = 16; }

    let body;
    if(sec.key==='tone'){
      body = secIssues.map(i=>[ i.studentArea||'', i.currentWording||'', i.concern||'', i.suggestedWording||'' ]);
      doc.autoTable({ head:[['Student / Area','Current wording','Concern','Suggested wording']], body, startY:y, headStyles:{fillColor:NAVY,fontSize:9}, styles:{fontSize:8,cellPadding:3}, columnStyles:{0:{cellWidth:45},1:{cellWidth:70},2:{cellWidth:50},3:{cellWidth:80}}, margin:{left:14,right:14}, didDrawPage:(d)=>{ y=d.cursor.y; }, theme:'grid' });
    } else if(sec.key==='level'){
      body = secIssues.map(i=>[ i.studentArea||'', i.visibleLevel||'', i.whyCheck||'', i.possibleAction||'' ]);
      doc.autoTable({ head:[['Student / Area','Visible level','Why to check','Possible action']], body, startY:y, headStyles:{fillColor:NAVY,fontSize:9}, styles:{fontSize:8,cellPadding:3}, columnStyles:{0:{cellWidth:45},1:{cellWidth:30},2:{cellWidth:80},3:{cellWidth:90}}, margin:{left:14,right:14}, didDrawPage:(d)=>{ y=d.cursor.y; }, theme:'grid' });
    } else if(sec.key==='spelling'){
      body = secIssues.map(i=>[ i.studentArea||'', i.whatToCheck||'', i.suggestedFix||'' ]);
      doc.autoTable({ head:[['Student / Area','Current usage','Recommendation']], body, startY:y, headStyles:{fillColor:NAVY,fontSize:9}, styles:{fontSize:8,cellPadding:3}, columnStyles:{0:{cellWidth:45},1:{cellWidth:100},2:{cellWidth:100}}, margin:{left:14,right:14}, didDrawPage:(d)=>{ y=d.cursor.y; }, theme:'grid' });
    } else {
      body = secIssues.map(i=>[ i.studentArea||'', i.type||'', i.whatToCheck||'', i.suggestedFix||'' ]);
      doc.autoTable({ head:[['Student / Area','Issue type','What to check','Suggested fix']], body, startY:y, headStyles:{fillColor:NAVY,fontSize:9}, styles:{fontSize:8,cellPadding:3}, columnStyles:{0:{cellWidth:42},1:{cellWidth:38},2:{cellWidth:90},3:{cellWidth:78}}, margin:{left:14,right:14}, didDrawPage:(d)=>{ y=d.cursor.y; }, theme:'grid' });
    }

    y = (doc.lastAutoTable?.finalY||y) + 8;

    if(y > 180){ doc.addPage(); y = 16; }
    doc.setFontSize(11); doc.setTextColor(...NAVY); doc.setFont(undefined,'bold');
    doc.text(sec.label, 14, y);
    doc.setFont(undefined,'normal');
    y += 4;
  });

  // Footer note
  if(y > 170){ doc.addPage(); y = 16; }
  doc.setFontSize(9); doc.setTextColor(130); doc.setFont(undefined,'italic');
  const footer = issues.length > 0
    ? 'Overall: The reports are mostly polished and professional. The items above are consistency, tone, and editing checks before final submission.'
    : 'No major issues found. Please still complete a final teacher read-through before submitting reports.';
  doc.text(footer, 14, y+8, {maxWidth:260});

  doc.save(`${title.replace(/\s+/g,'_')}_feedback.pdf`);
}

function downloadHtml(issues, title){
  const SECTIONS = [
    { key:'biggest',    label:'Biggest fixes needed' },
    { key:'names',      label:'Name and pronoun consistency' },
    { key:'spelling',   label:'Spelling and UK/US consistency' },
    { key:'grammar',    label:'Grammar, punctuation, and style' },
    { key:'tone',       label:'Tone — comments to soften' },
    { key:'wordiness',  label:'Wordiness and informal wording' },
    { key:'duplication',label:'Duplication and contradiction' },
    { key:'level',      label:'Comment and level alignment' },
  ];

  const style = `body{font-family:Segoe UI,system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:20px;background:#f0f4f8}
    h1{color:#1a3a5c}h2{color:#1a3a5c;margin-top:28px;margin-bottom:8px;font-size:15px;background:#1a3a5c;color:#fff;padding:10px 16px;border-radius:6px}
    table{width:100%;border-collapse:collapse;margin-bottom:4px;font-size:13px}th{background:#1a3a5c;color:#fff;padding:8px 12px;text-align:left}
    td{padding:9px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top}tr:nth-child(even)td{background:#f8faff}
    .whole-doc{background:#eff6ff!important;border-left:3px solid #3b82f6}.footer{color:#9ca3af;font-style:italic;margin-top:24px;text-align:center}`;

  let body = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${h(title)}</title><style>${style}</style></head><body>
    <h1>${h(title)}</h1><p style="color:#4b5563">Only comments that need attention are included. Generated ${new Date().toLocaleDateString('en-GB')}.</p>`;

  SECTIONS.forEach(sec=>{
    const secIssues = issues.filter(i=>i.section===sec.key);
    if(!secIssues.length) return;
    body += `<h2>${h(sec.label)} (${secIssues.length})</h2>`;
    if(sec.key==='tone'){
      body += `<table><thead><tr><th>Student / Area</th><th>Current wording</th><th>Concern</th><th>Suggested wording</th></tr></thead><tbody>`;
      body += secIssues.map(i=>`<tr${i.studentArea==='Whole document'?' class="whole-doc"':''}><td>${h(i.studentArea)}</td><td><em>${h(i.currentWording)}</em></td><td>${h(i.concern)}</td><td>${h(i.suggestedWording)}</td></tr>`).join('');
    } else if(sec.key==='level'){
      body += `<table><thead><tr><th>Student / Area</th><th>Visible level</th><th>Why to check</th><th>Possible action</th></tr></thead><tbody>`;
      body += secIssues.map(i=>`<tr><td>${h(i.studentArea)}</td><td>${h(i.visibleLevel)}</td><td><em>${h(i.whyCheck)}</em></td><td>${h(i.possibleAction)}</td></tr>`).join('');
    } else if(sec.key==='spelling'){
      body += `<table><thead><tr><th>Student / Area</th><th>Current usage</th><th>Recommendation</th></tr></thead><tbody>`;
      body += secIssues.map(i=>`<tr${i.studentArea==='Whole document'?' class="whole-doc"':''}><td>${h(i.studentArea)}</td><td>${h(i.whatToCheck)}</td><td>${h(i.suggestedFix)}</td></tr>`).join('');
    } else {
      body += `<table><thead><tr><th>Student / Area</th><th>Issue type</th><th>What to check</th><th>Suggested fix</th></tr></thead><tbody>`;
      body += secIssues.map(i=>`<tr${i.studentArea==='Whole document'?' class="whole-doc"':''}><td>${h(i.studentArea)}</td><td><strong>${h(i.type)}</strong></td><td><em>${h(i.whatToCheck)}</em></td><td>${h(i.suggestedFix)}</td></tr>`).join('');
    }
    body += `</tbody></table>`;
  });

  body += `<p class="footer">${issues.length>0?'Overall: The reports are mostly polished and professional. The items above are consistency, tone, and editing checks before final submission.':'No major issues found. Please still complete a final teacher read-through before submitting reports.'}</p>`;
  body += `</body></html>`;

  const blob = new Blob([body],{type:'text/html'});
  triggerDownload(URL.createObjectURL(blob), `${title.replace(/\s+/g,'_')}_feedback.html`);
}

function downloadCsv(issues, title){
  const rows = [['Student / Area','Section','Issue type','What to check','Suggested fix']];
  issues.forEach(i=> rows.push([
    i.studentArea||'',
    i.section||'',
    i.type||'',
    (i.whatToCheck||i.currentWording||i.visibleLevel||'').replace(/"/g,'""'),
    (i.suggestedFix||i.suggestedWording||i.possibleAction||'').replace(/"/g,'""'),
  ]));
  const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\r\n');
  const blob = new Blob([csv],{type:'text/csv'});
  triggerDownload(URL.createObjectURL(blob), `${title.replace(/\s+/g,'_')}_feedback.csv`);
}

/* ═══════════════════════════════════════════════════════════
   PROGRESS ANIMATION
═══════════════════════════════════════════════════════════ */

function setProgress(fillId, labelId, pct, label){
  const fill = document.getElementById(fillId);
  const lbl  = document.getElementById(labelId);
  if(fill) fill.style.width = pct + '%';
  if(lbl)  lbl.textContent  = label;
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

/* ═══════════════════════════════════════════════════════════
   MAIN EVENT LISTENERS
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', ()=>{

  const fileInput    = document.getElementById('fileInput');
  const dropZone     = document.getElementById('dropZone');
  const parseBtn     = document.getElementById('parseBtn');
  const checkBtn     = document.getElementById('checkBtn');
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel  = document.getElementById('settingsPanel');
  const settingsArrow  = document.getElementById('settingsArrow');

  let currentFile     = null;
  let parsedSegments  = [];
  let parsedRoster    = new Set();
  let currentIssues   = [];
  let currentTitle    = 'Report Card Feedback';

  // ── File selection ──

  function setFile(f){
    if(!f) return;
    currentFile = f;
    const ext = f.name.split('.').pop().toLowerCase();

    if(ext === 'doc'){
      alert('Please convert .doc to .docx first.\n\nOld .doc files cannot be checked accurately in this browser-only tool. Open the file in Word and save as .docx.');
      return;
    }
    if(ext !== 'pdf' && ext !== 'docx'){
      alert('Please upload a .pdf or .docx file.');
      return;
    }

    document.getElementById('fileNameLabel').textContent = f.name;
    dropZone.classList.add('file-loaded');
    parseBtn.disabled = false;
  }

  fileInput.addEventListener('change', ()=> setFile(fileInput.files[0]||null));
  dropZone.addEventListener('dragover', e=>{ e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', ()=> dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e=>{
    e.preventDefault(); dropZone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if(f){ fileInput.files = e.dataTransfer.files; setFile(f); }
  });

  // ── Settings toggle ──

  settingsToggle.addEventListener('click', ()=>{
    const open = settingsToggle.getAttribute('aria-expanded') === 'true';
    settingsToggle.setAttribute('aria-expanded', String(!open));
    settingsPanel.hidden = open;
    settingsArrow.classList.toggle('open', !open);
  });

  // ── Step 1: Parse file and show preview ──

  parseBtn.addEventListener('click', async ()=>{
    if(!currentFile) return;
    parseBtn.disabled = true;

    const progressWrap = document.getElementById('progressWrap');
    progressWrap.hidden = false;
    document.getElementById('previewSection').hidden = true;
    document.getElementById('resultsSection').hidden = true;

    const classListRaw = document.getElementById('classListInput').value.trim();
    const manualRoster = classListRaw
      ? new Set(classListRaw.split('\n').map(s=>s.trim()).filter(s=>s.length>=2))
      : new Set();

    const ext = currentFile.name.split('.').pop().toLowerCase();

    try {
      setProgress('progressFill','progressLabel', 15, 'Reading file…');
      await sleep(300);
      setProgress('progressFill','progressLabel', 35, 'Parsing report table…');
      await sleep(200);

      let result;
      if(ext === 'docx'){
        result = await parseDocxRows(currentFile, manualRoster);
      } else {
        result = await parsePdfRows(currentFile, manualRoster);
      }

      setProgress('progressFill','progressLabel', 80, 'Building preview…');
      await sleep(200);

      parsedSegments = result.segments || [];
      parsedRoster   = result.roster || new Set();

      if(result.noTable || parsedSegments.length === 0){
        setProgress('progressFill','progressLabel', 100, 'Done');
        progressWrap.hidden = true;
        parseBtn.disabled = false;

        if(ext === 'pdf'){
          alert('This PDF does not have a clear table structure that can be read automatically.\n\nPlease upload the .docx version for accurate results.');
        } else {
          alert('No recognisable report card table was found in this file.\n\nMake sure the file contains a table with subject headings (Math, Language, UOI, Learner, etc.). If using a class list format, paste the student names in Settings above.');
        }
        return;
      }

      // Count skipped rows (segments marked low confidence or garbled)
      const skippedCount = result.skipped || 0;

      setProgress('progressFill','progressLabel', 100, `Found ${parsedSegments.length} comment rows`);
      await sleep(300);
      progressWrap.hidden = true;

      renderPreview(parsedSegments, skippedCount);

    } catch(err){
      progressWrap.hidden = true;
      parseBtn.disabled = false;
      alert('Could not read this file.\n\n' + err.message);
    }

    parseBtn.disabled = false;
  });

  // ── Step 2: Run checks ──

  checkBtn.addEventListener('click', async ()=>{
    if(!parsedSegments.length) return;
    checkBtn.disabled = true;

    const checkWrap = document.getElementById('checkProgressWrap');
    checkWrap.hidden = false;
    document.getElementById('resultsSection').hidden = true;

    const classListRaw   = document.getElementById('classListInput').value.trim();
    const hasManualRoster = classListRaw.trim().length > 0;
    const spellingPref   = document.querySelector('input[name="spelling"]:checked')?.value || 'auto';
    const checkFirstPerson = document.getElementById('chkFirstPerson').checked;
    const checkLevel     = document.getElementById('chkLevel').checked;
    const className      = document.getElementById('classNameInput').value.trim();

    setProgress('checkProgressFill','checkProgressLabel', 20, 'Checking comments…');
    await sleep(200);
    setProgress('checkProgressFill','checkProgressLabel', 60, 'Running consistency checks…');
    await sleep(200);

    currentIssues = runAllChecks(parsedSegments, parsedRoster, {
      spellingPref, checkFirstPersonFlag: checkFirstPerson, checkLevelFlag: checkLevel, hasManualRoster,
    });

    currentTitle = className ? `${className} Report Card Feedback` : 'Report Card Feedback';

    setProgress('checkProgressFill','checkProgressLabel', 90, 'Building feedback report…');
    await sleep(200);

    const warnings = [];
    if(!hasManualRoster && parsedSegments.length > 0){
      warnings.push('No class list was provided — wrong-name detection is off. Paste one name per line in Settings to enable it.');
    }

    setProgress('checkProgressFill','checkProgressLabel', 100, 'Done');
    await sleep(200);
    checkWrap.hidden = true;

    renderResults(currentIssues, warnings, className);

    const pdfFn  = ()=>downloadPdf(currentIssues, currentTitle);
    const htmlFn = ()=>downloadHtml(currentIssues, currentTitle);
    const csvFn  = ()=>downloadCsv(currentIssues, currentTitle);
    ['dlPdf','dlPdf2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.onclick=pdfFn; });
    ['dlHtml','dlHtml2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.onclick=htmlFn; });
    ['dlCsv','dlCsv2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.onclick=csvFn; });

    checkBtn.disabled = false;
  });

});
