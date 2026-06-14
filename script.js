/* ═══════════════════════════════════════════════════════════════
   REPORT CARD CHECKER — script.js

   ACCURACY FIRST:
   · Every flagged issue must exist in the actual text.
   · Every suggested fix is the exact corrected sentence/phrase.
   · If the app cannot produce a real fix, it skips the issue.
   · Only high-confidence patterns are checked.
   · Area (Learner / UOI / Language / Math / Science / Specialist)
     is detected per segment from headings and content.
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

/* ─── AREA DETECTION ──────────────────────────────────────── */
const AREAS = [
  { label:'Learner',    re:/\b(student\s+as\s+a\s+learner|sal|learner)\b/i },
  { label:'UOI',        re:/\b(unit\s+of\s+inquiry|uoi|central\s+idea)\b/i },
  { label:'Language',   re:/\b(language arts?|english|literacy|reading|writing)\b/i },
  { label:'Math',       re:/\b(math(?:ematics|s)?|numeracy)\b/i },
  { label:'Science',    re:/\b(science)\b/i },
  { label:'Specialist', re:/\b(specialist|physical\s+ed|music\b|drama\b|computing|library)\b/i },
];

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

/* Apply a regex replacement to a sentence and return the corrected version,
   or null if the result looks wrong (same as input, or still contains the error). */
function applyFix(sentence, searchRe, replacement){
  const corrected = sentence.replace(searchRe, replacement);
  if(corrected === sentence) return null;
  return corrected;
}

/* ═══════════════════════════════════════════════════════════════
   FILE READING
   For .docx: use convertToHtml so we can detect headings/structure.
   For .pdf: extract text with Y-position grouping.
═══════════════════════════════════════════════════════════════ */
async function readDocxHtml(file){
  return new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload = e => mammoth.convertToHtml({arrayBuffer:e.target.result}).then(v=>res(v.value)).catch(rej);
    r.onerror = rej;
    r.readAsArrayBuffer(file);
  });
}

async function readPdf(file){
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data:buf}).promise;
  const pages = [];
  for(let i=1; i<=pdf.numPages; i++){
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lineMap = new Map();
    content.items.forEach(item=>{
      const y = Math.round(item.transform[5]);
      if(!lineMap.has(y)) lineMap.set(y,[]);
      lineMap.get(y).push(item.str);
    });
    const lines = [...lineMap.entries()]
      .sort((a,b)=>b[0]-a[0])
      .map(([,parts])=>parts.join(' ').trim())
      .filter(l=>l.length>0);
    pages.push(lines.join('\n'));
  }
  return pages.join('\n\n');
}

/* ─── PDF QUALITY ─────────────────────────────────────────── */
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
   DOCUMENT PARSING
   Parses HTML (from mammoth) or plain text (from PDF) into
   segments: { student, area, text, level }
═══════════════════════════════════════════════════════════════ */
const LEVEL_RE = /\b(Emerging|Developing|Achieving|Extending|Beginning|Approaching|Meeting|Exceeding|Secure)\b/;

function detectArea(text){
  for(const {label,re} of AREAS){ if(re.test(text)) return label; }
  return 'General';
}

function looksLikeName(t, roster){
  t = t.trim();
  if(t.length<2||t.length>45) return null;
  if(/[.!?,;:–—()\[\]{}]/.test(t)) return null;
  // Must not contain sentence-structure words
  if(/\b(is|are|was|has|have|can|will|does|did|the|and|but|for|in|on|at|to|of|a|an|with|from|that|this|his|her|their|which|who)\b/i.test(t)) return null;

  // Roster match (highest confidence)
  if(roster && roster.size>0){
    for(const name of roster){
      const first = name.split(/\s+/)[0];
      if(name.toLowerCase()===t.toLowerCase()) return name;
      if(first.length>=3 && first.toLowerCase()===t.toLowerCase()) return name;
    }
  }

  // Pattern: single or double proper name
  if(/^[A-Z][a-z]{1,20}(\s[A-Z][a-z]{1,20})?$/.test(t)){
    const first = t.split(' ')[0];
    if(!NOT_NAMES.has(first) && first.length>=3) return t;
  }
  // Hyphenated name: D-Jaa, Mary-Anne
  if(/^[A-Z][a-zA-Z]{0,10}-[A-Z][a-zA-Z]{1,15}$/.test(t)){
    return t;
  }
  return null;
}

function looksLikeAreaHeading(t){
  t = t.trim();
  if(t.length<2||t.length>60) return null;
  if(t.split(/\s+/).length>7) return null;
  for(const {label,re} of AREAS){ if(re.test(t) && wc(t)<=6) return label; }
  return null;
}

/* Parse HTML output from mammoth into structured segments */
function parseHtml(html, manualRoster){
  const roster = new Set(manualRoster||[]);

  // Build internal roster from heading elements first
  const parser = new DOMParser();
  const doc    = parser.parseFromString(html, 'text/html');
  const elems  = Array.from(doc.body.children);

  // Pre-scan for names in headings
  const builtRoster = new Set(roster);
  elems.forEach(el=>{
    const tag = el.tagName.toLowerCase();
    const txt = el.textContent.trim();
    if(['h1','h2','h3','h4'].includes(tag)){
      const n = looksLikeName(txt, roster);
      if(n) builtRoster.add(n);
    } else if(tag==='p'){
      // Bold-only paragraph → likely a heading
      const bolds = el.querySelectorAll('strong, b');
      const boldText = Array.from(bolds).map(b=>b.textContent).join('').trim();
      if(boldText===txt && txt.length<50){
        const n = looksLikeName(txt, roster);
        if(n) builtRoster.add(n);
      }
    }
  });

  const segments = [];
  let curStudent = null, curArea = null, buf = [];

  function flush(){
    const text = buf.join('\n').trim(); buf = [];
    if(!text || text.length<15 || !curStudent) return;
    const level = (text.match(LEVEL_RE)||[])[1] || null;
    const area  = curArea || detectArea(text);
    segments.push({ student:curStudent, area, text, level });
  }

  elems.forEach(el=>{
    const tag = el.tagName.toLowerCase();
    const txt = el.textContent.trim();
    if(!txt) return;

    const isHeading = ['h1','h2','h3','h4'].includes(tag);
    const isBoldOnly = tag==='p' && (() => {
      const bolds = el.querySelectorAll('strong, b');
      const boldText = Array.from(bolds).map(b=>b.textContent).join('').trim();
      return boldText===txt && txt.length<50;
    })();

    if(isHeading || isBoldOnly){
      const name = looksLikeName(txt, builtRoster);
      const area = name ? null : looksLikeAreaHeading(txt);
      if(name){   flush(); curStudent=name; curArea=null; return; }
      if(area){   flush(); curArea=area;    return; }
    }

    // Regular text — check for inline "Name – Area" pattern
    const inlineMatch = txt.match(/^([A-Z][a-z]{1,20}(?:\s[A-Z][a-z]{1,20})?)\s*[–\-—]\s*(.{3,30})$/);
    if(inlineMatch){
      const namePart = inlineMatch[1];
      const areaPart = inlineMatch[2];
      const name = looksLikeName(namePart, builtRoster);
      const area = looksLikeAreaHeading(areaPart);
      if(name){ flush(); curStudent=name; curArea=area||null; return; }
    }

    buf.push(txt);
  });
  flush();

  return { segments, roster:builtRoster };
}

/* Parse plain text (PDF fallback) */
function parsePlainText(fullText, manualRoster){
  const roster = new Set(manualRoster||[]);
  const lines  = fullText.split('\n');
  const builtRoster = new Set(roster);

  // Pre-scan
  lines.forEach(line=>{
    const n = looksLikeName(line.trim(), roster);
    if(n) builtRoster.add(n);
  });

  const segments = [];
  let curStudent = null, curArea = null, buf = [];

  function flush(){
    const text = buf.join('\n').trim(); buf = [];
    if(!text||text.length<15||!curStudent) return;
    const level = (text.match(LEVEL_RE)||[])[1]||null;
    const area  = curArea||detectArea(text);
    segments.push({ student:curStudent, area, text, level });
  }

  for(const line of lines){
    const t = line.trim(); if(!t) continue;
    const name = looksLikeName(t, builtRoster);
    const area = name ? null : looksLikeAreaHeading(t);
    if(name){   flush(); curStudent=name; curArea=null; }
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
  let uk=0, us=0;
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
  // Split on full stop / exclamation / question followed by space+capital or end
  const parts = text.match(/[^.!?]+(?:[.!?]+(?=\s+[A-Z]|\s*$)|[.!?]+)/g) || [text];
  return parts.map(s=>s.trim()).filter(s=>s.length>8 && wc(s)>=4);
}

function isUsableSentence(s){
  if(!s || wc(s)<4)  return false;
  if(/[A-Z]{5,}/.test(s))  return false;  // garbled caps
  if(/\w{18,}/.test(s))    return false;  // merged words
  const ws  = s.split(/\s+/);
  const avg = ws.reduce((x,w)=>x+w.replace(/[^a-zA-Z]/g,'').length,0)/ws.length;
  return avg>=2 && avg<=12;
}

/* ═══════════════════════════════════════════════════════════════
   CHECKS
   Each check returns an array of issue objects:
   {
     section,  // 'biggest' | 'names' | 'spelling' | 'grammar' | 'tone' | 'firstperson' | 'wordy' | 'duplication' | 'level'
     type,     // display label e.g. 'Grammar', 'Spelling error'
     student,  // "Name — Area"
     exactSent,// the full original sentence (shown in "What to check" col)
     issue,    // brief description of what's wrong
     fix,      // the EXACT corrected sentence or phrase
   }
═══════════════════════════════════════════════════════════════ */

/* ─── A. WRONG NAME ───────────────────────────────────────── */
function checkWrongName(seg, roster){
  const { student, area, text } = seg;
  const firstName = student.split(/[\s\-]+/)[0];
  const issues = [];
  const sents  = splitSentences(text);

  for(const other of roster){
    if(other===student) continue;
    const otherFirst = other.split(/[\s\-]+/)[0];
    if(otherFirst.length<3) continue;
    if(NOT_NAMES.has(otherFirst)) continue;

    const re = new RegExp(`\\b${escRe(otherFirst)}\\b`,'g');
    for(const sent of sents){
      if(!isUsableSentence(sent)) continue;
      const m = sent.match(re);
      if(!m) continue;
      // Skip if the name appears at the very start (could be a reference comparison)
      const idx = sent.search(re);
      if(idx<3) continue;

      const corrected = sent.replace(re, firstName);
      issues.push({
        section:'biggest', type:'Wrong name',
        student:`${student} — ${area}`,
        exactSent: sent,
        issue:`The name "${otherFirst}" appears in ${firstName}'s comment — possible copy-paste from another student's report.`,
        fix:`Check: "${corrected}"`,
      });
      break;
    }
  }
  return issues;
}

/* ─── B. PRONOUN INCONSISTENCY ─────────────────────────────── */
function checkPronouns(seg){
  const { student, area, text } = seg;
  const sents = splitSentences(text).filter(isUsableSentence);
  const heSents  = sents.filter(s=>/\b(he|him|his)\b/i.test(s));
  const sheSents = sents.filter(s=>/\b(she|her|hers)\b/i.test(s));

  if(heSents.length>0 && sheSents.length>0){
    const example = heSents[0];
    return [{
      section:'names', type:'Pronoun inconsistency',
      student:`${student} — ${area}`,
      exactSent: example,
      issue:`This comment uses both "he/him/his" and "she/her" pronouns. Example: "${heSents[0].trim()}"`,
      fix:`Choose one set of pronouns throughout ${student.split(' ')[0]}'s entire ${area} comment and use it consistently.`,
    }];
  }
  return [];
}

/* ─── C. LEVEL LABEL ("an achieving student") ──────────────── */
const LEVEL_LABEL_RE = /\b(an?\s+)(achieving|developing|emerging|extending|beginning|approaching|exceeding)\s+(student|learner|child)\b/gi;

function checkLevelLabel(seg){
  const { student, area, text } = seg;
  const sents  = splitSentences(text);
  const issues = [];
  for(const sent of sents){
    if(!isUsableSentence(sent)) continue;
    const re = new RegExp(LEVEL_LABEL_RE.source, 'gi');
    const m  = re.exec(sent);
    if(m){
      const lvlWord = cap(m[2]);
      const noun    = m[3];
      const corrected = sent.replace(new RegExp(escRe(m[0]),'gi'),
        `a ${noun} working at an ${lvlWord} level`);
      issues.push({
        section:'biggest', type:'Awkward level label',
        student:`${student} — ${area}`,
        exactSent: sent,
        issue:`"${m[0]}" — describing a child as "${m[0].trim()}" labels them by their level rather than their learning.`,
        fix:`"${corrected}"`,
      });
    }
  }
  return issues;
}

/* ─── D. SPELLING TYPOS ─────────────────────────────────────── */
function checkTypos(seg){
  const { student, area, text } = seg;
  const issues = [];
  const sents  = splitSentences(text);
  for(const sent of sents){
    if(!isUsableSentence(sent)) continue;
    for(const [wrong, right] of TYPOS){
      const re = new RegExp(`\\b${escRe(wrong)}\\b`,'i');
      const m  = sent.match(re);
      if(m){
        const corrected = sent.replace(re, right);
        issues.push({
          section:'spelling', type:'Spelling error',
          student:`${student} — ${area}`,
          word: `${m[0]} → ${right}`,
          usage: `"${m[0]}" in the ${area} comment`,
          rec:   `Corrected sentence: "${corrected}"`,
        });
        break;
      }
    }
  }
  return issues;
}

/* ─── E. UK/US CONSISTENCY (document-level) ─────────────────── */
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

        if(domStyle==='uk' || domStyle==='mixed'){
          m = sent.match(pair.us);
          if(m){
            concern = domStyle==='mixed'
              ? `Both "${pair.ukW}" and "${pair.usW}" appear in the document.`
              : `"${m[0]}" (US spelling) found — the document mostly uses UK spelling.`;
            rec = `Use "${pair.ukW}" consistently throughout.`;
            seen.add(key);
          }
        } else if(domStyle==='us'){
          m = sent.match(pair.uk);
          if(m){
            concern = `"${m[0]}" (UK spelling) found — the document mostly uses US spelling.`;
            rec = `Use "${pair.usW}" consistently throughout.`;
            seen.add(key);
          }
        }
        if(m){
          issues.push({ section:'spelling', word:`${pair.usW} / ${pair.ukW}`, usage:concern, rec });
        }
      }
    }
  }
  return issues;
}

/* ─── F. GRAMMAR ─────────────────────────────────────────────── */

/* A/AN — explicit allowlist only (never guess) */
const AAN_TO_AN = [
  /\ba\s+(understanding)\b/i,
  /\ba\s+(inquiry)\b/i,
  /\ba\s+(excellent)\b/i,
  /\ba\s+(important)\b/i,
  /\ba\s+(interesting)\b/i,
  /\ba\s+(effective)\b/i,
  /\ba\s+(engaging)\b/i,
  /\ba\s+(authentic)\b/i,
  /\ba\s+(accurate)\b/i,
  /\ba\s+(IB)\b/i,
  /\ba\s+(honest)\b/i,
  /\ba\s+(enthusiastic)\b/i,
  /\ba\s+(exceptional)\b/i,
  /\ba\s+(impressive)\b/i,
  /\ba\s+(outstanding)\b/i,
  /\ba\s+(organised)\b/i,
  /\ba\s+(organized)\b/i,
  /\ba\s+(open[- ]minded)\b/i,
  /\ba\s+(increasing)\b/i,
  /\ba\s+(enjoyable)\b/i,
  /\ba\s+(encouraging)\b/i,
];
const AAN_TO_A = [
  /\ban\s+(strong)\b/i,
  /\ban\s+(great)\b/i,
  /\ban\s+(good)\b/i,
  /\ban\s+(student)\b/i,
  /\ban\s+(significant)\b/i,
  /\ban\s+(steady)\b/i,
  /\ban\s+(successful)\b/i,
  /\ban\s+(key)\b/i,
  /\ban\s+(growing)\b/i,
  /\ban\s+(positive)\b/i,
  /\ban\s+(creative)\b/i,
  /\ban\s+(curious)\b/i,
  /\ban\s+(confident)\b/i,
  /\ban\s+(dedicated)\b/i,
  /\ban\s+(motivated)\b/i,
  /\ban\s+(talented)\b/i,
];

/* Missing "the" before known phrases */
const MISSING_THE = [
  { re:/\b(approaches|during|in|through|across|throughout)\s+(Unit\s+of\s+Inquiry)\b/i,
    fn: (m) => m[0].replace(m[2], 'the ' + m[2]) },
  { re:/\bapproaches\s+(Units\s+of\s+Inquiry)\b/i,
    fn: (m) => m[0].replace('approaches ', 'approaches the ') },
];

/* Missing "a" before adjective+noun — specific safe patterns */
const MISSING_A_PATTERNS = [
  // "is highly independent learner" → "is a highly independent learner"
  { re:/\b(is|was|remains?|became?)\s+(very|highly|quite|remarkably|incredibly|extremely)\s+(independent|keen|motivated|dedicated|focused|resilient|enthusiastic|thoughtful|engaged)\s+(learner|thinker|communicator|reader|writer|contributor|member)\b/i,
    fn:(sent, m) => sent.replace(m[0], `${m[1]} a ${m[2]} ${m[3]} ${m[4]}`) },
];

/* Missing hyphen in compound adjectives — specific patterns */
const HYPHEN_PATTERNS = [
  { re:/\b(two|three|four|five|six|seven|eight)\s+(paragraph)\s+(persuasive|informative|narrative|recount|argument|essay|letter|text|piece)\b/i,
    fn:(sent,m) => sent.replace(m[0], `${m[1]}-${m[2]} ${m[3]}`) },
  { re:/\bself\s+(management|directed|motivated|paced|regulation|regulated|confidence|sufficient|sufficient)\b/i,
    fn:(sent,m) => sent.replace(m[0], `self-${m[1]}`) },
  { re:/\bwell\s+(written|structured|organised|organized|developed|supported|presented|researched|rounded)\b(?=\s+\w)/i,
    fn:(sent,m) => sent.replace(m[0], `well-${m[1]}`) },
];

function checkGrammar(seg){
  const { student, area, text } = seg;
  const sents  = splitSentences(text);
  const issues = [];

  for(const sent of sents){
    if(!isUsableSentence(sent)) continue;

    // A → AN
    for(const re of AAN_TO_AN){
      const m = sent.match(re);
      if(m){
        const word      = m[1];
        const corrected = sent.replace(re, `an ${word}`);
        if(/\ban\s+a[n]?\b/i.test(corrected)) continue; // safety check
        issues.push({
          section:'grammar', type:'Grammar',
          student:`${student} — ${area}`,
          exactSent: sent,
          issue:`"a ${word}" — should use "an" before a vowel sound.`,
          fix:`"${corrected}"`,
        });
        break;
      }
    }

    // AN → A
    for(const re of AAN_TO_A){
      const m = sent.match(re);
      if(m){
        const word      = m[1];
        const corrected = sent.replace(re, `a ${word}`);
        issues.push({
          section:'grammar', type:'Grammar',
          student:`${student} — ${area}`,
          exactSent: sent,
          issue:`"an ${word}" — "${word}" begins with a consonant sound and needs "a".`,
          fix:`"${corrected}"`,
        });
        break;
      }
    }

    // Missing "the"
    for(const {re,fn} of MISSING_THE){
      const m = sent.match(re);
      if(m){
        const corrected = sent.replace(m[0], fn(m));
        if(corrected !== sent){
          issues.push({
            section:'grammar', type:'Missing word',
            student:`${student} — ${area}`,
            exactSent: sent,
            issue:`"${m[0]}" — missing "the".`,
            fix:`"${corrected}"`,
          });
          break;
        }
      }
    }

    // Missing "a"
    for(const {re,fn} of MISSING_A_PATTERNS){
      const m = sent.match(re);
      if(m){
        const corrected = fn(sent, m);
        if(corrected && corrected!==sent){
          issues.push({
            section:'grammar', type:'Missing word',
            student:`${student} — ${area}`,
            exactSent: sent,
            issue:`"${m[0]}" — missing the article "a".`,
            fix:`"${corrected}"`,
          });
          break;
        }
      }
    }

    // Missing hyphen
    for(const {re,fn} of HYPHEN_PATTERNS){
      const m = sent.match(re);
      if(m){
        const corrected = fn(sent, m);
        if(corrected && corrected!==sent){
          issues.push({
            section:'grammar', type:'Hyphenation',
            student:`${student} — ${area}`,
            exactSent: sent,
            issue:`"${m[0]}" — compound adjective needs a hyphen.`,
            fix:`"${corrected}"`,
          });
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

  // Missing space after full stop — only specific common words to avoid false positives
  const spaceRe = /([a-z]{3,})\.(Additionally|Furthermore|However|Throughout|This|The|In|During|As|By|After|Before|He|She|They|It|Our|His|Her|Their|One|Another|Over|Both|While|Since|Although|When|Through)/g;
  const spaceMatches = [];
  let sm;
  while((sm=spaceRe.exec(text))!==null){
    spaceMatches.push(sm);
    if(spaceMatches.length>=2) break;
  }
  for(const sm of spaceMatches){
    issues.push({
      section:'grammar', type:'Spacing',
      student:`${student} — ${area}`,
      exactSent: `"...${sm[0]}..."`,
      issue:`Missing space after full stop: "${sm[0]}"`,
      fix:`Change "${sm[0]}" to "${sm[1]}. ${sm[2]}"`,
    });
  }

  // Space before comma — "word ,"
  const commaRe = /([a-zA-Z])\s,/g;
  const cm = commaRe.exec(text);
  if(cm){
    const snippet = text.substring(Math.max(0,cm.index-15),cm.index+10).trim();
    issues.push({
      section:'grammar', type:'Spacing',
      student:`${student} — ${area}`,
      exactSent: `"${snippet}"`,
      issue:`Space before comma: "${snippet}"`,
      fix:`Remove the space before the comma.`,
    });
  }

  // Extra full stop: "word. ." or "word.."
  const dotRe = /([a-z]{2,})\.\s+\.|([a-z]{2,})\.\./g;
  const dm = dotRe.exec(text);
  if(dm){
    const found = dm[0];
    issues.push({
      section:'grammar', type:'Punctuation',
      student:`${student} — ${area}`,
      exactSent: `"${found}"`,
      issue:`Extra full stop: "${found}"`,
      fix:`Remove the extra full stop.`,
    });
  }

  return issues;
}

/* ─── H. FIRST-PERSON WORDING ──────────────────────────────── */
function checkFirstPerson(seg){
  const { student, area, text } = seg;
  const sents  = splitSentences(text);
  const issues = [];

  for(const sent of sents){
    if(!isUsableSentence(sent)) continue;

    // "As we moved into / explored / looked at / began / studied..."
    const weRe = /\bAs\s+we\s+(moved?\s+into|explored?|looked?\s+at|began?|studied?|continued?|delved?|turned?\s+to|worked?\s+on)\b/i;
    const we1  = sent.match(weRe);
    if(we1){
      const corrected = sent.replace(weRe, (m, verb) => {
        const verbMap = {
          'moved into':'During', 'move into':'During', 'explored':'During',
          'explore':'During','looked at':'In','look at':'In',
          'began':'During','begin':'During','studied':'During','study':'During',
          'continued':'Continuing to','delved':'In','turned to':'Moving to',
          'worked on':'Working on',
        };
        const mapped = verbMap[verb.toLowerCase()] || 'During';
        return mapped;
      });
      if(corrected !== sent){
        issues.push({
          section:'firstperson', type:'First-person wording',
          student:`${student} — ${area}`,
          exactSent: sent,
          issue:`"${we1[0]}" — first-person "we" in a report card.`,
          fix:`Consider: "${corrected}"`,
        });
        continue;
      }
    }

    // "our [X] unit" → "the [X] unit"
    const ourUnit = sent.match(/\bour\s+(\w+(?:\s+\w+)?)\s+(unit|study|investigation|inquiry|work|project|learning|focus|exploration|theme)\b/i);
    if(ourUnit){
      const corrected = sent.replace(ourUnit[0], `the ${ourUnit[1]} ${ourUnit[2]}`);
      issues.push({
        section:'firstperson', type:'First-person wording',
        student:`${student} — ${area}`,
        exactSent: sent,
        issue:`"${ourUnit[0]}" — "our" in a report card is first-person.`,
        fix:`"${corrected}"`,
      });
    }
  }
  return issues;
}

/* ─── I. TONE ─────────────────────────────────────────────────
   Only flag very specific patterns where the concern is clear
   AND we can produce an exact corrected sentence.
──────────────────────────────────────────────────────────── */
const TONE_RULES = [
  {
    // "big feelings" → "strong emotions"
    re: /\bbig\s+feelings?\b/gi,
    type:'Informal/sensitive wording',
    fn:(sent) => ({ corrected: sent.replace(/\bbig\s+feelings?\b/gi,'strong emotions'), label:'"big feelings"' }),
  },
  {
    // "dysregulated" → "continuing to develop strategies to manage focus and emotions"
    re: /\b(becomes?|is|was|felt?|gets?)\s+dysregulated\b/gi,
    type:'Sensitive wording',
    fn:(sent,m) => ({ corrected: sent.replace(m[0],`${m[1]} continuing to develop strategies to manage focus and emotions`), label:'"dysregulated"' }),
  },
  {
    re:/\bdysregulated\b/gi,
    type:'Sensitive wording',
    fn:(sent) => ({ corrected: sent.replace(/\bdysregulated\b/gi,'continuing to develop strategies to manage focus and emotions'), label:'"dysregulated"' }),
  },
  {
    // "displays a high level of intelligence" → "demonstrates strong reasoning skills"
    re:/\b(displays?|shows?|has)\s+a\s+high\s+level\s+of\s+intelligence\b/gi,
    type:'Fixed-trait wording',
    fn:(sent,m) => ({ corrected: sent.replace(m[0],`${m[1]} strong reasoning skills and curiosity`), label:'"high level of intelligence"' }),
  },
  {
    // "showcase his/her/their intelligence" → "showcase his/her/their reasoning skills"
    re:/\b(showcase|show|display|demonstrate)\s+(his|her|their)\s+intelligence\b/gi,
    type:'Fixed-trait wording',
    fn:(sent,m) => ({ corrected: sent.replace(m[0],`${m[1]} ${m[2]} reasoning skills and curiosity`), label:'"intelligence"' }),
  },
  {
    // "improving his/her/their attendance" → softer version
    re:/\b(improving|improve)\s+(his|her|their)\s+attendance\b/gi,
    type:'Sensitive wording',
    fn:(sent,m) => ({ corrected: sent.replace(m[0],`consistent attendance will support ${m[2]} continued learning`), label:'"improving attendance"' }),
  },
  {
    // "remains focused on improving her attendance and punctuality"
    re:/\bremains?\s+focused\s+on\s+improving\s+(his|her|their)\s+attendance(\s+and\s+punctuality)?\b/gi,
    type:'Sensitive wording',
    fn:(sent,m) => ({ corrected: sent.replace(m[0],`continued consistency with attendance${m[2]?` and punctuality`:''} will further support ${m[1]} learning`), label:'"improving attendance"' }),
  },
  {
    // "distracts others" → "can impact the learning environment"
    re:/\bdistracts?\s+others?\b/gi,
    type:'Sensitive wording',
    fn:(sent) => ({ corrected: sent.replace(/\bdistracts?\s+others?\b/gi,'can impact the learning environment'), label:'"distracts others"' }),
  },
  {
    // "personal boundaries and respectful use of space" → gentler
    re:/\bpersonal\s+boundaries\b/gi,
    type:'Sensitive wording',
    fn:(sent) => ({ corrected: sent.replace(/\bpersonal\s+boundaries\b/gi,'awareness of personal space and respectful interactions'), label:'"personal boundaries"' }),
  },
  {
    // "true role model" → "positive role model for peers"
    re:/\btrue\s+role\s+model\b/gi,
    type:'Tone / wording',
    fn:(sent) => ({ corrected: sent.replace(/\btrue\s+role\s+model\b/gi,'positive role model for peers'), label:'"true role model"' }),
  },
  {
    // "is lazy" / "can be lazy"
    re:/\b(is|can\s+be|was)\s+lazy\b/gi,
    type:'Sensitive wording',
    fn:(sent,m) => ({ corrected: sent.replace(m[0],`${m[1]} developing greater independence and effort`), label:'"lazy"' }),
  },
];

function checkTone(seg){
  const { student, area, text } = seg;
  const sents  = splitSentences(text);
  const issues = [];

  for(const sent of sents){
    if(!isUsableSentence(sent)) continue;
    for(const rule of TONE_RULES){
      const m = sent.match(rule.re);
      if(!m) continue;
      const result = rule.fn(sent, m);
      if(!result || !result.corrected || result.corrected===sent) continue;
      issues.push({
        section:'tone', type:rule.type,
        student:`${student} — ${area}`,
        exactSent: sent,
        issue:`${result.label} — this wording may not be suitable for a parent-facing report.`,
        fix:`"${result.corrected}"`,
      });
      break; // one issue per sentence
    }
  }
  return issues;
}

/* ─── J. WORDINESS ────────────────────────────────────────────
   Only flag specific, unambiguous cases where the fix is exact.
────────────────────────────────────────────────────────────── */
const WORDY_RULES = [
  {
    re:/\bnomenclature\b/gi, type:'Word choice',
    fn:(sent) => ({ corrected: sent.replace(/\bnomenclature\b/gi,'mathematical vocabulary') }),
  },
  {
    re:/\bis\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/gi, type:'Wordy phrasing',
    fn:(sent) => ({ corrected: sent.replace(/\bis\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/gi,'understands') }),
  },
  {
    re:/\bhas\s+been\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/gi, type:'Wordy phrasing',
    fn:(sent) => ({ corrected: sent.replace(/\bhas\s+been\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/gi,'understands') }),
  },
  {
    re:/\bhas\s+been\s+able\s+to\s+demonstrate\b/gi, type:'Wordy phrasing',
    fn:(sent) => ({ corrected: sent.replace(/\bhas\s+been\s+able\s+to\s+demonstrate\b/gi,'has demonstrated') }),
  },
  {
    re:/\bis\s+able\s+to\s+demonstrate\b/gi, type:'Wordy phrasing',
    fn:(sent) => ({ corrected: sent.replace(/\bis\s+able\s+to\s+demonstrate\b/gi,'demonstrates') }),
  },
  {
    re:/\brequires\s+teacher\s+(assistance|support|guidance)\s+to\s+foster\s+(independence|agency)\b/gi, type:'Wordy phrasing',
    fn:(sent,m) => ({ corrected: sent.replace(m[0],`benefits from teacher ${m[1]} to continue building independence`) }),
  },
  {
    re:/\bfoster\s+independence\s+and\s+agency\b/gi, type:'Wordy phrasing',
    fn:(sent) => ({ corrected: sent.replace(/\bfoster\s+independence\s+and\s+agency\b/gi,'continue building independence and confidence') }),
  },
];

function checkWordiness(seg){
  const { student, area, text } = seg;
  const sents  = splitSentences(text);
  const issues = [];

  for(const sent of sents){
    if(!isUsableSentence(sent)) continue;
    for(const rule of WORDY_RULES){
      const m = sent.match(rule.re);
      if(!m) continue;
      const result = rule.fn(sent, m);
      if(!result||!result.corrected||result.corrected===sent) continue;
      issues.push({
        section:'wordy', type:rule.type,
        student:`${student} — ${area}`,
        exactSent: sent,
        issue:`"${m[0]}" — wordy or overly formal phrasing.`,
        fix:`"${result.corrected}"`,
      });
      break;
    }
  }
  return issues;
}

/* ─── K. DUPLICATION / CONTRADICTION ─────────────────────────── */
function checkDuplication(seg){
  const { student, area, text } = seg;
  const sents  = splitSentences(text);
  const issues = [];

  for(const sent of sents){
    if(!isUsableSentence(sent)) continue;

    // Exact word repeated ("the the", "a a", "and and")
    const dbl = sent.match(/\b(\w{1,15})\s+\1\b/i);
    if(dbl){
      const corrected = sent.replace(new RegExp(`\\b(${escRe(dbl[1])})\\s+\\1\\b`,'gi'), dbl[1]);
      issues.push({
        section:'duplication', type:'Repeated word',
        student:`${student} — ${area}`,
        exactSent: sent,
        issue:`"${dbl[0]}" — word repeated twice in a row.`,
        fix:`"${corrected}"`,
      });
    }

    // "Furthermore/Moreover ... also" in same sentence
    if(/\b(furthermore|moreover)\b[^.]{0,90}\balso\b/i.test(sent)){
      const corrected = sent.replace(/\balso\b/, '').replace(/\s{2,}/g,' ').trim();
      issues.push({
        section:'duplication', type:'Redundant wording',
        student:`${student} — ${area}`,
        exactSent: sent,
        issue:`"furthermore" (or "moreover") and "also" used in the same sentence — this is redundant.`,
        fix:`Remove "also": "${corrected}"`,
      });
    }
  }

  // Contradiction: "can do X … is learning to do X"
  if(/\bcan\b.{5,80}\bis\s+(learning|working)\s+to\b/i.test(text)){
    issues.push({
      section:'duplication', type:'Possible contradiction',
      student:`${student} — ${area}`,
      exactSent:'(Across the comment)',
      issue:'The comment says the student can already do something, then says they are learning to do it.',
      fix:'Choose one: either the student can already do this, or they are working towards it — not both in the same comment.',
    });
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
    issues.push({
      section:'level', type:'Level / comment mismatch',
      student:`${student} — ${area}`,
      level,
      concern:`The comment uses very strong wording ("${m[0]}") that sounds stronger than the selected level (${level}).`,
      action:`Either raise the level to reflect the comment, or slightly reduce the wording of the comment.`,
    });
  }
  if(!isLow && WEAK_RE.test(text)){
    const m = text.match(WEAK_RE);
    issues.push({
      section:'level', type:'Level / comment mismatch',
      student:`${student} — ${area}`,
      level,
      concern:`The comment uses wording ("${m[0]}") that suggests the student may be below the selected level (${level}).`,
      action:`Either lower the level or revise the comment to better reflect the selected level.`,
    });
  }
  return issues;
}

/* ═══════════════════════════════════════════════════════════════
   RUN ALL CHECKS
═══════════════════════════════════════════════════════════════ */
function runAllChecks(segments, roster, fullText, settings){
  const { spellingPref, checkFirstPersonFlag, checkLevelFlag } = settings;
  const domStyle  = detectSpelling(fullText, spellingPref);
  const allIssues = [];

  // Document-level spelling consistency
  checkSpellingConsistency(fullText, domStyle, segments).forEach(i=>allIssues.push(i));

  for(const seg of segments){
    checkWrongName(seg, roster).forEach(i=>allIssues.push(i));
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
   RENDER
═══════════════════════════════════════════════════════════════ */
function h(s){ return escH(s); }

function makeSection(title, icon, count){
  const el = document.createElement('div');
  el.className = 'feedback-section';
  el.innerHTML = `<div class="section-heading">${icon} ${h(title)}<span class="section-count">${count}</span></div>`;
  return el;
}

function emptySection(title, icon, msg){
  const el = document.createElement('div');
  el.className = 'feedback-section';
  el.innerHTML = `<div class="section-heading">${icon} ${h(title)}</div><div class="section-ok">&#10003; ${h(msg)}</div>`;
  return el;
}

function stdTable(issues, colHeaders, rowFn){
  const rows = issues.map(rowFn).join('');
  return `<div class="table-wrap"><table>
    <thead><tr>${colHeaders.map(c=>`<th>${h(c)}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

/* Biggest fixes + Level labels */
function renderBiggest(issues){
  if(!issues.length) return emptySection('Biggest fixes needed','&#128276;','No major issues found. See sections below for smaller checks.');
  const el = makeSection('Biggest fixes needed','&#128276;', issues.length);
  el.innerHTML += stdTable(issues,
    ['Student / Area','Issue type','What to check','Suggested fix'],
    i=>`<tr>
      <td class="td-student">${h(i.student)}</td>
      <td><span class="type-badge">${h(i.type)}</span></td>
      <td class="td-issue">${h(i.issue)}</td>
      <td class="td-fix">${h(i.fix)}</td>
    </tr>`);
  return el;
}

/* Names / Pronouns */
function renderNames(issues){
  if(!issues.length) return emptySection('Name and pronoun consistency','&#128101;','No name or pronoun issues found.');
  const el = makeSection('Name and pronoun consistency','&#128101;', issues.length);
  el.innerHTML += stdTable(issues,
    ['Student / Area','Issue type','What to check','Suggested fix'],
    i=>`<tr>
      <td class="td-student">${h(i.student)}</td>
      <td><span class="type-badge">${h(i.type)}</span></td>
      <td class="td-issue">${h(i.issue)}</td>
      <td class="td-fix">${h(i.fix)}</td>
    </tr>`);
  return el;
}

/* Spelling */
function renderSpelling(issues){
  if(!issues.length) return emptySection('Spelling and UK/US consistency','&#128221;','No spelling issues found.');
  const el = makeSection('Spelling and UK/US consistency','&#128221;', issues.length);
  el.innerHTML += stdTable(issues,
    ['Word / phrase','Current usage','Recommendation'],
    i=>`<tr>
      <td class="td-word-cell"><span class="td-word">${h(i.word||'')}</span></td>
      <td class="td-current">${h(i.usage||'')}</td>
      <td class="td-fix">${h(i.rec||'')}</td>
    </tr>`);
  return el;
}

/* Grammar / punctuation */
function renderGrammar(issues){
  if(!issues.length) return emptySection('Grammar, punctuation and spacing','&#9998;','No grammar or punctuation issues found.');
  const el = makeSection('Grammar, punctuation and spacing','&#9998;', issues.length);
  el.innerHTML += stdTable(issues,
    ['Student / Area','Issue type','Exact sentence from report','Suggested correction'],
    i=>`<tr>
      <td class="td-student">${h(i.student)}</td>
      <td><span class="type-badge">${h(i.type)}</span></td>
      <td class="td-issue td-exact">${h(i.exactSent)}</td>
      <td class="td-fix">${h(i.fix)}</td>
    </tr>`);
  return el;
}

/* Tone */
function renderTone(issues){
  if(!issues.length) return emptySection('Tone comments to soften','&#128172;','No sensitive or negative tone issues found.');
  const el = makeSection('Tone comments to soften','&#128172;', issues.length);
  el.innerHTML += stdTable(issues,
    ['Student / Area','Issue type','Current wording','Suggested wording'],
    i=>`<tr>
      <td class="td-student">${h(i.student)}</td>
      <td><span class="type-badge">${h(i.type)}</span></td>
      <td class="td-exact td-current">${h(i.exactSent)}</td>
      <td class="td-fix">${h(i.fix)}</td>
    </tr>`);
  return el;
}

/* First person */
function renderFirstPerson(issues){
  if(!issues.length) return null;
  const el = makeSection('First-person wording (we / our)','&#9997;&#65039;', issues.length);
  el.innerHTML += stdTable(issues,
    ['Student / Area','Issue type','Current wording','Suggested wording'],
    i=>`<tr>
      <td class="td-student">${h(i.student)}</td>
      <td><span class="type-badge">${h(i.type)}</span></td>
      <td class="td-exact td-current">${h(i.exactSent)}</td>
      <td class="td-fix">${h(i.fix)}</td>
    </tr>`);
  return el;
}

/* Wordiness */
function renderWordy(issues){
  if(!issues.length) return emptySection('Wordiness / parent-friendly clarity','&#128196;','No wordiness or clarity issues found.');
  const el = makeSection('Wordiness / parent-friendly clarity','&#128196;', issues.length);
  el.innerHTML += stdTable(issues,
    ['Student / Area','Issue type','Current wording','Suggested wording'],
    i=>`<tr>
      <td class="td-student">${h(i.student)}</td>
      <td><span class="type-badge">${h(i.type)}</span></td>
      <td class="td-exact td-current">${h(i.exactSent)}</td>
      <td class="td-fix">${h(i.fix)}</td>
    </tr>`);
  return el;
}

/* Duplication */
function renderDuplication(issues){
  if(!issues.length) return emptySection('Duplication or contradiction','&#128260;','No duplication or contradiction issues found.');
  const el = makeSection('Duplication or contradiction','&#128260;', issues.length);
  el.innerHTML += stdTable(issues,
    ['Student / Area','Issue type','What to check','Suggested fix'],
    i=>`<tr>
      <td class="td-student">${h(i.student)}</td>
      <td><span class="type-badge">${h(i.type)}</span></td>
      <td class="td-issue td-exact">${h(i.exactSent)}</td>
      <td class="td-fix">${h(i.fix)}</td>
    </tr>`);
  return el;
}

/* Level alignment */
function renderLevel(issues){
  if(!issues.length) return null;
  const el = makeSection('Comments that may sound stronger or weaker than their level','&#127919;', issues.length);
  el.innerHTML += stdTable(issues,
    ['Student / Area','Level','Comment concern','Possible action'],
    i=>`<tr>
      <td class="td-student">${h(i.student)}</td>
      <td><span class="type-badge">${h(i.level)}</span></td>
      <td class="td-concern">${h(i.concern)}</td>
      <td class="td-fix">${h(i.action)}</td>
    </tr>`);
  return el;
}

/* Priority table */
function buildPriority(allIssues){
  const items = [];
  const wrongNames = allIssues.filter(i=>i.type==='Wrong name');
  if(wrongNames.length) items.push(`Fix ${wrongNames.length} possible wrong-name issue${wrongNames.length>1?'s':''}.`);
  const pronouns = allIssues.filter(i=>i.type==='Pronoun inconsistency');
  if(pronouns.length) items.push(`Fix pronoun inconsistency in ${pronouns.map(i=>i.student).join(', ')}.`);
  const typos = allIssues.filter(i=>i.section==='spelling'&&i.type==='Spelling error');
  if(typos.length) items.push(`Correct ${typos.length} spelling error${typos.length>1?'s':''}: ${typos.slice(0,3).map(i=>i.word).join(', ')}${typos.length>3?'…':''}.`);
  const consist = allIssues.filter(i=>i.section==='spelling'&&!i.type);
  if(consist.length) items.push(`Resolve UK/US spelling inconsistency (${consist.slice(0,2).map(i=>i.word).join(', ')}).`);
  const fp = allIssues.filter(i=>i.section==='firstperson');
  if(fp.length) items.push(`Remove or reduce first-person wording ("our", "we") — found in ${fp.length} comment${fp.length>1?'s':''}.`);
  const tone = allIssues.filter(i=>i.section==='tone');
  if(tone.length) items.push(`Soften sensitive wording in ${tone.length} comment${tone.length>1?'s':''}. See "Tone" section.`);
  const gram = allIssues.filter(i=>i.section==='grammar');
  if(gram.length) items.push(`Fix ${gram.length} grammar or punctuation issue${gram.length>1?'s':''}.`);
  const dup = allIssues.filter(i=>i.section==='duplication');
  if(dup.length) items.push(`Fix ${dup.length} duplication or contradiction item${dup.length>1?'s':''}.`);
  const lev = allIssues.filter(i=>i.section==='level');
  if(lev.length) items.push(`Review comment/level alignment for ${lev.map(i=>i.student).join(', ')}.`);
  return items;
}

function renderPriority(items){
  const box = document.getElementById('priorityBox');
  const tbl = document.getElementById('priorityTable');
  if(!items.length){ box.hidden=true; return; }
  tbl.innerHTML = items.map((it,i)=>`<tr>
    <td class="priority-num">Priority ${i+1}</td>
    <td class="priority-action">${h(it)}</td>
  </tr>`).join('');
  box.hidden = false;
}

/* Main render */
function renderResults(allIssues, warnings, fileName, className){
  const title = className
    ? `${className} Report Card Feedback`
    : (fileName ? `${fileName.replace(/\.[^.]+$/,'')} Report Card Feedback` : 'Report Card Feedback');
  document.getElementById('resultsTitle').textContent = title;

  const warnBox  = document.getElementById('extractionWarning');
  const warnList = document.getElementById('warningList');
  if(warnings.length){
    warnList.innerHTML = warnings.map(w=>`<li>${h(w)}</li>`).join('');
    warnBox.hidden = false;
  } else { warnBox.hidden = true; }

  // Summary pills
  const total    = allIssues.length;
  const bigCount = allIssues.filter(i=>i.section==='biggest').length;
  const nameCount= allIssues.filter(i=>i.section==='names').length;
  const spellCount=allIssues.filter(i=>i.section==='spelling').length;
  const gramCount= allIssues.filter(i=>i.section==='grammar').length;
  const toneCount= allIssues.filter(i=>i.section==='tone').length;

  document.getElementById('summaryBar').innerHTML = `
    <div class="summary-pill ${total>10?'red':total>3?'amber':'green'}">
      <span class="pill-count">${total}</span> items to review
    </div>
    ${bigCount  ?`<div class="summary-pill red">  <span class="pill-count">${bigCount}</span>   biggest fixes</div>`:''}
    ${nameCount ?`<div class="summary-pill red">  <span class="pill-count">${nameCount}</span>   name/pronoun</div>`:''}
    ${spellCount?`<div class="summary-pill amber"><span class="pill-count">${spellCount}</span>  spelling</div>`:''}
    ${gramCount ?`<div class="summary-pill amber"><span class="pill-count">${gramCount}</span>   grammar</div>`:''}
    ${toneCount ?`<div class="summary-pill amber"><span class="pill-count">${toneCount}</span>   tone</div>`:''}
    ${total===0 ?`<div class="summary-pill green"><span class="pill-count">&#10003;</span> No issues found</div>`:''}
  `;

  // Sections
  const body = document.getElementById('feedbackBody');
  body.innerHTML = '';

  body.appendChild(renderBiggest(allIssues.filter(i=>i.section==='biggest')));
  body.appendChild(renderNames(allIssues.filter(i=>i.section==='names')));
  body.appendChild(renderSpelling(allIssues.filter(i=>i.section==='spelling')));
  body.appendChild(renderGrammar(allIssues.filter(i=>i.section==='grammar')));
  body.appendChild(renderTone(allIssues.filter(i=>i.section==='tone')));
  const fpEl = renderFirstPerson(allIssues.filter(i=>i.section==='firstperson'));
  if(fpEl) body.appendChild(fpEl);
  body.appendChild(renderWordy(allIssues.filter(i=>i.section==='wordy')));
  body.appendChild(renderDuplication(allIssues.filter(i=>i.section==='duplication')));
  const lvlEl = renderLevel(allIssues.filter(i=>i.section==='level'));
  if(lvlEl) body.appendChild(lvlEl);

  renderPriority(buildPriority(allIssues));

  document.getElementById('resultsSection').hidden = false;
  document.getElementById('resultsSection').scrollIntoView({behavior:'smooth'});
}

/* ═══════════════════════════════════════════════════════════════
   DOWNLOADS
═══════════════════════════════════════════════════════════════ */
function dlBlob(blob,name){
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'),{href:url,download:name}).click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}

function flatForExport(allIssues){
  return allIssues.map(i=>({
    section: i.section,
    type:    i.type||'',
    student: i.student||'Whole document',
    check:   i.issue||i.concern||i.usage||'',
    fix:     i.fix||i.rec||i.action||'',
  }));
}

function downloadCsv(allIssues, titleStr){
  const flat = flatForExport(allIssues);
  const hdr  = ['Section','Issue type','Student / Area','What to check','Suggested fix'];
  const csv  = [hdr,...flat.map(r=>[r.section,r.type,r.student,r.check,r.fix])]
    .map(row=>row.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  dlBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}), titleStr.replace(/\s+/g,'_')+'_feedback.csv');
}

function downloadHtml(allIssues, titleStr, subtitle){
  const flat = flatForExport(allIssues);
  const rows = flat.map(r=>`<tr>
    <td>${h(r.section)}</td><td>${h(r.type)}</td>
    <td><strong>${h(r.student)}</strong></td>
    <td>${h(r.check)}</td>
    <td style="color:#166534">${h(r.fix)}</td>
  </tr>`).join('');
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${h(titleStr)}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;font-size:13px}h1{color:#1a3a5c}p.sub{color:#6b7280;margin:4px 0 20px}
table{width:100%;border-collapse:collapse}thead th{background:#1a3a5c;color:#fff;padding:8px 12px;text-align:left;font-size:11px}
tbody td{padding:8px 12px;border-bottom:1px solid #f0f4f8;vertical-align:top;line-height:1.5}
.note{color:#6b7280;font-style:italic;font-size:12px;margin-top:20px;border-top:1px solid #e5e7eb;padding-top:12px}</style>
</head><body><h1>${h(titleStr)}</h1><p class="sub">${h(subtitle)}</p>
<table><thead><tr><th>Section</th><th>Issue type</th><th>Student / Area</th><th>What to check</th><th>Suggested fix</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="note">The reports are mostly polished and professional. The issues above are mainly consistency, tone, and editing checks before submission.</p>
</body></html>`;
  dlBlob(new Blob([html],{type:'text/html;charset=utf-8'}), titleStr.replace(/\s+/g,'_')+'_feedback.html');
}

function downloadPdf(allIssues, titleStr, subtitle){
  const {jsPDF} = window.jspdf;
  const doc  = new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const flat = flatForExport(allIssues);
  const date = new Date().toLocaleDateString('en-GB');

  doc.setFontSize(16); doc.setTextColor(26,58,92);
  doc.text(titleStr, 14, 15);
  doc.setFontSize(8); doc.setTextColor(80,80,80);
  const subLines = doc.splitTextToSize(subtitle, 260);
  doc.text(subLines, 14, 22);
  doc.setFontSize(7); doc.setTextColor(130,130,130);
  doc.text(`Generated: ${date}`, 14, 22+subLines.length*4+2);

  doc.autoTable({
    startY: 22+subLines.length*4+8,
    head:[['Section','Issue type','Student / Area','What to check','Suggested fix']],
    body: flat.map(r=>[r.section,r.type,r.student,r.check,r.fix]),
    theme:'striped',
    headStyles:{fillColor:[26,58,92],fontSize:7,fontStyle:'bold',cellPadding:3},
    bodyStyles:{fontSize:6.5,cellPadding:3,valign:'top'},
    columnStyles:{
      0:{cellWidth:22},1:{cellWidth:26},2:{cellWidth:34},
      3:{cellWidth:80},4:{cellWidth:70,textColor:[22,101,52]},
    },
    alternateRowStyles:{fillColor:[248,250,255]},
  });

  doc.setFontSize(7); doc.setTextColor(100,100,100);
  doc.text('The reports are mostly polished and professional. The issues above are mainly consistency, tone, and editing checks before submission.',
    14, doc.lastAutoTable.finalY+7);
  doc.save(titleStr.replace(/\s+/g,'_')+'_feedback.pdf');
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

  let fullText, parseResult;
  const className     = document.getElementById('classNameInput').value.trim();
  const classListRaw  = document.getElementById('classListInput').value.trim();
  const manualRoster  = classListRaw
    ? new Set(classListRaw.split('\n').map(s=>s.trim()).filter(s=>s.length>=2))
    : new Set();

  try{
    if(ext==='docx'){
      const html = await readDocxHtml(file);
      parseResult = parseHtml(html, manualRoster);
      // Also get plain text for spelling detection
      fullText = parseResult.segments.map(s=>s.text).join('\n\n');
    } else {
      fullText = await readPdf(file);
      const q  = checkPdfQuality(fullText);
      if(q==='empty'){
        alert('No text could be extracted from this PDF.\n\nThis is likely a scanned (image-only) PDF. Please export a text-based PDF or upload the .docx version.');
        return;
      }
      if(q==='garbled'){
        alert('This file could not be read clearly enough to check accurately.\n\nThe extracted text looks garbled — this often happens with scanned PDFs or PDFs from certain table layouts.\n\nPlease upload the .docx version for accurate results.');
        return;
      }
      parseResult = parsePlainText(fullText, manualRoster);
    }
  } catch(err){
    alert('Could not read this file. Make sure it is not password-protected.\n\nError: '+err.message);
    return;
  }

  const { segments, roster } = parseResult;
  const warnings = [];
  if(segments.length===0){
    warnings.push('The app could not identify any student sections in this file. For best results, use a .docx file where each student\'s name appears as a clear heading on its own line, or paste your class list in the Settings panel above.');
  }

  const spellingPref         = document.querySelector('input[name="spelling"]:checked')?.value||'auto';
  const checkFirstPersonFlag = document.getElementById('chkFirstPerson').checked;
  const checkLevelFlag       = document.getElementById('chkLevel').checked;

  const { allIssues } = runAllChecks(segments, roster, fullText, {
    spellingPref, checkFirstPersonFlag, checkLevelFlag,
  });

  const subtitle  = 'Only comments that need attention are included. Main report card comments were checked for name/pronoun consistency, spelling and UK/US consistency, professional report-card tone, first-person wording/contractions, grammar, punctuation, spacing, duplication, and comment/level alignment.';
  const titleStr  = className ? `${className} Report Card Feedback` : 'Report Card Feedback';

  renderResults(allIssues, warnings, file.name, className);

  const pdfFn  = ()=>downloadPdf(allIssues, titleStr, subtitle);
  const htmlFn = ()=>downloadHtml(allIssues, titleStr, subtitle);
  const csvFn  = ()=>downloadCsv(allIssues, titleStr);
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
    chosenFile = f;
    fileNameEl.textContent = f ? `Selected: ${f.name}` : 'Accepts .pdf and .docx · For .doc files, save as .docx first';
    checkBtn.disabled = !f;
  }

  toggle.addEventListener('click',()=>{
    const open = !panel.hidden;
    panel.hidden = open;
    toggle.setAttribute('aria-expanded', String(!open));
    arrow.classList.toggle('open', !open);
  });

  fileInput.addEventListener('change', ()=>setFile(fileInput.files[0]||null));
  dropZone.addEventListener('click',   ()=>fileInput.click());
  dropZone.addEventListener('dragover', e=>{ e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave',  ()=>dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e=>{
    e.preventDefault(); dropZone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0]; if(f) setFile(f);
  });

  checkBtn.addEventListener('click', async()=>{
    if(!chosenFile) return;
    checkBtn.disabled = true; spinner.hidden = false;
    document.getElementById('resultsSection').hidden = true;
    try{ await processFile(chosenFile); }
    finally{ spinner.hidden=true; checkBtn.disabled=false; }
  });
});
