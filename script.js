/* ═══════════════════════════════════════════════════════════════
   REPORT CARD CHECKER — script.js
   Style matched to Y4GM and Y5JR sample feedback documents.
   Conservative. High-confidence only. No IB/ATL suggestions.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── WORDS THAT ARE NEVER STUDENT NAMES ──────────────────── */
const NOT_NAMES = new Set([
  'Term','Report','Reports','Card','Cards','Year','Unit','Inquiry','Inquirer',
  'UOI','EAL','ATL','IB','PYP','STEM','PE','Art','Science','Music','Drama',
  'Geography','History','Physical','Education','Technology','Computing','ICT',
  'Mathematics','Maths','Math','English','Language','Reading','Writing',
  'Literacy','Numeracy','Specialist','Grade',
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
  'Gravity','Ancient','Rome','Roman','Story','Mountain','Level','Levels',
  'Position','Number','Shape','Space','Data','Handling','Operations',
  'Addition','Subtraction','Multiplication','Division','Fractions',
  'Measurement','Geometry','Algebra','The','And','But','For','Not',
  'Beginning','End','First','Last','New','Good','Well','Just','Only',
  'How','Why','What','Where','Ascot','Whole','Every','Each','All',
]);

/* ── UK / US SPELLING PAIRS ──────────────────────────────── */
const UK_US = [
  { us:/\borganiz(e|es|ed|ing|ation|ational|er|ers)\b/gi, uk:/\borganis(e|es|ed|ing|ation|ational|er|ers)\b/gi, usBase:'organize', ukBase:'organise' },
  { us:/\banalyz(e|es|ed|ing)\b/gi,   uk:/\banalys(e|es|ed|ing)\b/gi,  usBase:'analyze',  ukBase:'analyse'  },
  { us:/\brecogniz(e|es|ed|ing)\b/gi, uk:/\brecognis(e|es|ed|ing)\b/gi,usBase:'recognize',ukBase:'recognise'},
  { us:/\bsummariz(e|es|ed|ing)\b/gi, uk:/\bsummaris(e|es|ed|ing)\b/gi,usBase:'summarize',ukBase:'summarise'},
  { us:/\bcategoriz(e|es|ed|ing)\b/gi,uk:/\bcategoris(e|es|ed|ing)\b/gi,usBase:'categorize',ukBase:'categorise'},
  { us:/\bcharacteriz(e|es|ed|ing)\b/gi,uk:/\bcharacteris(e|es|ed|ing)\b/gi,usBase:'characterize',ukBase:'characterise'},
  { us:/\bemphasiz(e|es|ed|ing)\b/gi, uk:/\bemphasis(e|es|ed|ing)\b/gi,usBase:'emphasize',ukBase:'emphasise'},
  { us:/\bfinaliz(e|es|ed|ing)\b/gi,  uk:/\bfinalis(e|es|ed|ing)\b/gi, usBase:'finalize', ukBase:'finalise' },
  { us:/\butiliz(e|es|ed|ing)\b/gi,   uk:/\butilis(e|es|ed|ing)\b/gi,  usBase:'utilize',  ukBase:'utilise'  },
  { us:/\bbehavior(s|al)?\b/gi,       uk:/\bbehaviour(s|al)?\b/gi,      usBase:'behavior', ukBase:'behaviour'},
  { us:/\bcenter(s|ed|ing)?\b/gi,     uk:/\bcentre(s|d|ing)?\b/gi,      usBase:'center',   ukBase:'centre'   },
  { us:/\bcolor(s|ed|ful|ing)?\b/gi,  uk:/\bcolour(s|ed|ful|ing)?\b/gi, usBase:'color',    ukBase:'colour'   },
  { us:/\bfavorite(s)?\b/gi,          uk:/\bfavourite(s)?\b/gi,          usBase:'favorite', ukBase:'favourite'},
  { us:/\blabor(s|ed)?\b/gi,          uk:/\blabour(s|ed)?\b/gi,          usBase:'labor',    ukBase:'labour'   },
  { us:/\bpracticing\b/gi,            uk:/\bpractising\b/gi,             usBase:'practicing',ukBase:'practising'},
  { us:/\bprogram(s|med|ming)?\b/gi,  uk:/\bprogramme(s|d|ming)?\b/gi,  usBase:'program',  ukBase:'programme'},
  { us:/\bmodeling\b/gi,              uk:/\bmodelling\b/gi,              usBase:'modeling', ukBase:'modelling'},
];

/* ── COMMON SPELLING ERRORS ──────────────────────────────── */
const TYPOS = [
  ['recieve','receive'],['recieved','received'],['acheive','achieve'],
  ['acheivement','achievement'],['occured','occurred'],['seperate','separate'],
  ['accomodate','accommodate'],['beleive','believe'],['definately','definitely'],
  ['enviroment','environment'],['grammer','grammar'],['independant','independent'],
  ['knowlege','knowledge'],['neccessary','necessary'],['perseverence','perseverance'],
  ['reccommend','recommend'],['resiliance','resilience'],['responsibilty','responsibility'],
  ['communcation','communication'],['collaberation','collaboration'],
  ['succesful','successful'],['untill','until'],['writting','writing'],
  ['develope','develop'],['managment','management'],['relfection','reflection'],
  ['experiance','experience'],['thier','their'],['truely','truly'],
  ['leanring','learning'],['apporach','approach'],['colaborate','collaborate'],
  ['aswell','as well'],
];

/* ── TONE / SENSITIVE WORDING ────────────────────────────── */
const TONE_FLAGS = [
  {
    re: /\b(is\s+)?dysregulated\b/i, type:'Sensitive wording',
    concern:'Clinical language not suited to a parent-facing report.',
    suggest:'"is continuing to develop strategies to manage focus and emotions"',
  },
  {
    re: /\bdistracts?\s+others?\b/i, type:'Sensitive wording',
    concern:'Can sound negative in a report card.',
    suggest:'"can impact the learning environment" or "is developing greater self-management"',
  },
  {
    re: /\bbig\s+feelings?\b/i, type:'Informal/sensitive wording',
    concern:'Informal and potentially sensitive phrasing in a formal report.',
    suggest:'"strong emotions" or "emotional responses"',
  },
  {
    re: /\b(has\s+)?personal\s+boundaries?\b/i, type:'Sensitive wording',
    concern:'Could be sensitive in a parent-facing report.',
    suggest:'"awareness of personal space and respectful interactions"',
  },
  {
    re: /\b(high\s+level\s+of\s+)?intelligence\b/i, type:'Inappropriate fixed-trait wording',
    concern:'"Intelligence" is a fixed-trait judgement and sounds less suitable for a report card.',
    suggest:'"strong curiosity, reasoning skills, and an inquisitive nature"',
  },
  {
    re: /\b(is\s+)?struggling\s+to\b/i, type:'Tone / wording',
    concern:'Deficit-focused language.',
    suggest:'"is continuing to develop" or "needs support with"',
  },
  {
    re: /\bstruggles?\s+(to|with)\b/i, type:'Tone / wording',
    concern:'Deficit-focused language.',
    suggest:'"is working towards" or "is developing confidence with"',
  },
  {
    re: /\ba\s+challenging\s+student\b/i, type:'Tone / wording',
    concern:'Labels the child rather than describing the learning.',
    suggest:'Describe the specific behaviour and next step instead.',
  },
  {
    re: /\bweak\b/i, type:'Tone / wording',
    concern:'Too negative for a parent-facing report.',
    suggest:'"is developing" or "is building confidence with"',
  },
  {
    re: /\b(is\s+)?lazy\b/i, type:'Sensitive wording',
    concern:'Character judgement not appropriate in a report.',
    suggest:'"is developing greater independence and effort"',
  },
  {
    re: /\brefuses?\s+to\b/i, type:'Tone / wording',
    concern:'Too direct for a parent-facing report.',
    suggest:'"is working on" or "sometimes finds it difficult to"',
  },
  {
    re: /\bfails?\s+to\b/i, type:'Tone / wording',
    concern:'Deficit language — rephrase as a next step.',
    suggest:'"is working towards" or "is developing the ability to"',
  },
  {
    re: /\bmust\s+try\s+harder\b/i, type:'Tone / wording',
    concern:'Too vague. Name the specific area to develop.',
    suggest:'State the specific skill or behaviour to develop.',
  },
  {
    re: /\bpoor\s+behavio(u?)r\b/i, type:'Tone / wording',
    concern:'Too general and negative for a report card.',
    suggest:'"is developing greater self-management in the classroom"',
  },
  {
    re: /\bdo(es)?\s+not\s+care\b/i, type:'Tone / wording',
    concern:'Too blunt for a parent-facing report.',
    suggest:'"would benefit from greater engagement with their learning"',
  },
  {
    re: /\battendance\s+(has|is|and)\b/i, type:'Sensitive wording',
    concern:'Attendance is usually handled separately, not in the main comment.',
    suggest:'Soften, e.g. "Consistent attendance will help [Name] make the most of every learning opportunity."',
  },
  {
    re: /\bimproving\s+(her|his|their)\s+attendance\b/i, type:'Sensitive wording',
    concern:'Too direct about attendance in a main report comment.',
    suggest:'Soften, e.g. "Consistent attendance will help [Name] make the most of every learning opportunity."',
  },
  {
    re: /\bpunctuality\b/i, type:'Sensitive wording',
    concern:'Punctuality is usually handled separately, not in the main comment.',
    suggest:'Remove from the main comment or move to a dedicated field.',
  },
];

/* ── LEVEL-LABEL WORDING (flags "an achieving student" etc) ─ */
const LEVEL_LABEL_RE = /\b(an?\s+)?(achieving|developing|emerging|extending|beginning|approaching|exceeding)\s+student\b/i;

/* ── WORDY / INFORMAL PHRASES ────────────────────────────── */
const WORDY = [
  { re:/\bnomenclature\b/i,
    type:'Word choice',
    suggest:'"mathematical vocabulary," "fraction vocabulary," or "technical vocabulary"' },
  { re:/\bin\s+order\s+to\b/i,
    type:'Wordy phrasing',
    suggest:'"to"' },
  { re:/\bdue\s+to\s+the\s+fact\s+that\b/i,
    type:'Wordy phrasing',
    suggest:'"because"' },
  { re:/\bprior\s+to\b/i,
    type:'Wordy phrasing',
    suggest:'"before"' },
  { re:/\ba\s+wide\s+variety\s+of\b/i,
    type:'Wordy phrasing',
    suggest:'"many" or "a range of"' },
  { re:/\ba\s+variety\s+of\s+different\b/i,
    type:'Wordy phrasing',
    suggest:'"a variety of"' },
  { re:/\bon\s+a\s+regular\s+basis\b/i,
    type:'Wordy phrasing',
    suggest:'"regularly"' },
  { re:/\bfor\s+the\s+purpose\s+of\b/i,
    type:'Wordy phrasing',
    suggest:'"to"' },
  { re:/\bhas\s+been\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/i,
    type:'Wordy phrasing',
    suggest:'"understands"' },
  { re:/\bis\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/i,
    type:'Wordy phrasing',
    suggest:'"understands"' },
  { re:/\bhas\s+been\s+able\s+to\s+demonstrate\b/i,
    type:'Wordy phrasing',
    suggest:'"has demonstrated"' },
  { re:/\bis\s+able\s+to\s+demonstrate\b/i,
    type:'Wordy phrasing',
    suggest:'"demonstrates"' },
  { re:/\bis\s+able\s+to\b/i,
    type:'Wordy phrasing',
    suggest:'"can"' },
  { re:/\btrue\s+role\s+model\b/i,
    type:'Tone / wording',
    suggest:'"positive role model for her peers" or "positive role model for classmates" (slightly more measured)' },
  { re:/\bfoster\s+(independence|agency)\b/i,
    type:'Wordy phrasing',
    suggest:'"continue building independence, agency, and confidence"' },
  { re:/\butilize[sd]?\b/i,
    type:'Word choice',
    suggest:'"use" or "apply" (more natural for a parent-facing report)' },
  { re:/\bleverage[sd]?\b/i,
    type:'Word choice',
    suggest:'"use" or "apply"' },
  { re:/\bfacilitate[sd]?\b/i,
    type:'Word choice',
    suggest:'"support" or "help"' },
];

/* ── HELPERS ──────────────────────────────────────────────── */
function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function wc(t)   { return (t.match(/\b[a-zA-Z]+\b/g)||[]).length; }

/* ═══════════════════════════════════════════════════════════════
   FILE READING
═══════════════════════════════════════════════════════════════ */
function readDocx(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload = e => mammoth.extractRawText({arrayBuffer:e.target.result}).then(v=>res(v.value)).catch(rej);
    r.onerror=rej;
    r.readAsArrayBuffer(file);
  });
}

async function readPdf(file){
  const buf=await file.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data:buf}).promise;
  const pages=[];
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    const lineMap=new Map();
    content.items.forEach(item=>{
      const y=Math.round(item.transform[5]);
      if(!lineMap.has(y)) lineMap.set(y,[]);
      lineMap.get(y).push(item.str);
    });
    const lines=[...lineMap.entries()]
      .sort((a,b)=>b[0]-a[0])
      .map(([,parts])=>parts.join(' ').trim())
      .filter(l=>l.length>0);
    pages.push(lines.join('\n'));
  }
  return pages.join('\n\n');
}

/* ── PDF QUALITY ──────────────────────────────────────────── */
function checkPdfQuality(text){
  if(!text||text.trim().length<60) return 'empty';
  const lines=text.split('\n').filter(l=>l.trim().length>5);
  if(lines.length<3) return 'too_short';
  const real=lines.filter(l=>{
    const ws=l.trim().split(/\s+/);
    if(ws.length<3) return false;
    const avg=ws.reduce((s,w)=>s+w.replace(/[^a-z]/gi,'').length,0)/ws.length;
    if(avg>13) return false;
    if(/[A-Z]{6,}/.test(l)) return false;
    return true;
  });
  if(real.length/lines.length<0.25) return 'garbled';
  return 'ok';
}

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT PARSING
═══════════════════════════════════════════════════════════════ */
const AREA_RE=[
  {area:'Learner',    re:/\b(student\s+as\s+a\s+learner|sal|\blearner\b)\b/i},
  {area:'UOI',        re:/\b(unit\s+of\s+inquiry|uoi|central\s+idea)\b/i},
  {area:'Language',   re:/\b(language|english|reading|writing|literacy)\b/i},
  {area:'Math',       re:/\b(math|maths|mathematics|numeracy)\b/i},
  {area:'Science',    re:/\b(science)\b/i},
  {area:'Specialist', re:/\b(specialist|pe|physical\s+ed|music|drama|computing|ict|library)\b/i},
];

const LEVEL_RE=/\b(Emerging|Developing|Achieving|Extending|Beginning|Approaching|Meeting|Exceeding|Secure)\b/;

function detectArea(text){
  for(const {area,re} of AREA_RE){ if(re.test(text)) return area; }
  return 'General';
}

function isHeadingName(line, roster){
  const t=line.trim();
  if(t.length<2||t.length>50) return null;
  if(/[.!?,;:–—]/.test(t)) return null;
  if(/\b(is|are|was|has|have|can|will|does|did|the|and|but|for|in|on|at|to|of|a|an|with|from)\b/i.test(t)) return null;

  // Roster match first
  if(roster.size>0){
    for(const name of roster){
      if(name.toLowerCase()===t.toLowerCase()) return name;
      const first=name.split(/\s+/)[0];
      if(first.length>=3&&first.toLowerCase()===t.toLowerCase()) return name;
    }
  }
  // Pattern match: single or double capitalised word, not a known non-name
  if(/^[A-Z][a-z]{1,20}(\s[A-Z][a-z]{1,20})?$/.test(t)){
    const first=t.split(' ')[0];
    if(!NOT_NAMES.has(first)&&first.length>=3) return t;
  }
  return null;
}

function isAreaLine(line){
  const t=line.trim();
  if(t.length>60||t.split(/\s+/).length>6) return null;
  for(const {area,re} of AREA_RE){ if(re.test(t)) return area; }
  return null;
}

function parseSegments(fullText, manualRoster){
  const lines=fullText.split('\n');
  const roster=new Set(manualRoster);
  const builtRoster=new Set();

  // First pass — build internal roster
  lines.forEach(line=>{ const n=isHeadingName(line.trim(),roster); if(n) builtRoster.add(n); });
  for(const n of manualRoster) builtRoster.add(n);

  const segments=[];
  let curStudent=null, curArea=null, buf=[];

  function flush(){
    const text=buf.join('\n').trim(); buf=[];
    if(!text||text.length<15) return;
    if(!curStudent) return;
    const level=(text.match(LEVEL_RE)||[])[1]||null;
    segments.push({ student:curStudent, area:curArea||detectArea(text), text, level });
  }

  for(const line of lines){
    const t=line.trim(); if(!t) continue;
    const name=isHeadingName(t,builtRoster);
    const area=name?null:isAreaLine(t);
    if(name){   flush(); curStudent=name; curArea=null; }
    else if(area){ flush(); curArea=area; }
    else { buf.push(t); }
  }
  flush();

  // Fallback: no headings — try double-newline blocks
  if(segments.length===0){
    fullText.split(/\n{2,}/).map(b=>b.trim()).filter(b=>b.length>=20).forEach(block=>{
      const firstLine=block.split('\n')[0].trim();
      const name=isHeadingName(firstLine,builtRoster);
      if(!name) return;
      const rest=block.split('\n').slice(1).join('\n').trim();
      const level=(rest.match(LEVEL_RE)||[])[1]||null;
      segments.push({ student:name, area:detectArea(rest||block), text:rest||block, level });
    });
  }

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
    us+=(fullText.match(p.us)||[]).length;
    uk+=(fullText.match(p.uk)||[]).length;
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
  const raw=text.match(/[^.!?]*[.!?]+/g)||[text];
  return raw.map(s=>s.trim()).filter(s=>s.length>8&&wc(s)>=4);
}

function isClean(s){
  if(!s||wc(s)<4) return false;
  if(/[A-Z]{5,}/.test(s)) return false;
  if(/\w{18,}/.test(s)) return false;
  const ws=s.split(/\s+/);
  const avg=ws.reduce((x,w)=>x+w.replace(/[^a-zA-Z]/g,'').length,0)/ws.length;
  if(avg>12||avg<2) return false;
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   CHECKS
═══════════════════════════════════════════════════════════════ */

/* A. WRONG NAME ──────────────────────────────────────────── */
function checkWrongName(seg, roster){
  const {student,area,text}=seg;
  const firstName=student.split(/\s+/)[0];
  const issues=[];
  const sents=splitSentences(text);
  for(const name of roster){
    if(name===student) continue;
    const otherFirst=name.split(/\s+/)[0];
    if(otherFirst.length<3) continue;
    const re=new RegExp(`\\b${escRe(otherFirst)}\\b`,'g');
    for(const sent of sents){
      if(!isClean(sent)) continue;
      if(!re.test(sent)) continue;
      re.lastIndex=0;
      const idx=sent.search(re);
      if(idx<2) continue; // skip if name is at the very start (title reference)
      issues.push({
        section:'biggest',
        type:'Wrong name',
        student:`${student} — ${area}`,
        check:`The comment appears to be for ${firstName}, but the name "${otherFirst}" appears inside the comment.`,
        fix:`Check whether "${otherFirst}" should be changed to "${firstName}."`,
      });
      break;
    }
  }
  return issues;
}

/* B. PRONOUNS ──────────────────────────────────────────────*/
function checkPronouns(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text).filter(isClean);
  const hasMasc=sents.some(s=>/\b(he|him|his)\b/i.test(s));
  const hasFem=sents.some(s=>/\b(she|her|hers)\b/i.test(s));
  if(hasMasc&&hasFem){
    return [{
      section:'names',
      type:'Pronoun inconsistency',
      student:`${student} — ${area}`,
      check:`The comment for ${student.split(' ')[0]} uses both "he/him/his" and "she/her" pronouns.`,
      fix:'Check the comment and use one set of pronouns consistently throughout.',
    }];
  }
  return [];
}

/* C. LEVEL-LABEL WORDING ("an achieving student") ─────────*/
function checkLevelLabel(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text);
  const issues=[];
  for(const sent of sents){
    if(!isClean(sent)) continue;
    const m=sent.match(LEVEL_LABEL_RE);
    if(m){
      const lvl=m[2];
      issues.push({
        section:'biggest',
        type:'Awkward level label',
        student:`${student} — ${area}`,
        check:`"${m[0]}" — describing the child as "an ${lvl} student" can sound like the level is labelling the child rather than describing achievement.`,
        fix:`Use wording such as "is working at an ${lvl.charAt(0).toUpperCase()+lvl.slice(1)} level in…" or "is developing confidence in…"`,
      });
    }
  }
  return issues;
}

/* D. SPELLING TYPOS ─────────────────────────────────────── */
function checkTypos(seg){
  const {student,area,text}=seg;
  const issues=[];
  const sents=splitSentences(text);
  for(const sent of sents){
    if(!isClean(sent)) continue;
    for(const [wrong,right] of TYPOS){
      const re=new RegExp(`\\b${escRe(wrong)}\\b`,'i');
      const m=sent.match(re);
      if(m){
        issues.push({
          section:'spelling',
          type:'Spelling error',
          word:`${m[0]} → ${right}`,
          usage:`"${m[0]}" in ${student}'s ${area} comment`,
          rec:`Change "${m[0]}" to "${right}"`,
        });
        break;
      }
    }
  }
  return issues;
}

/* E. UK/US CONSISTENCY (doc-level) ─────────────────────── */
function checkSpellingConsistency(fullText, domStyle, allSegments){
  if(domStyle==='either') return [];
  const issues=[];
  const seen=new Set();

  for(const seg of allSegments){
    for(const sent of splitSentences(seg.text)){
      if(!isClean(sent)) continue;
      for(const pair of UK_US){
        const pairKey=pair.usBase+'/'+pair.ukBase;
        if(seen.has(pairKey)) continue;

        if(domStyle==='uk'||domStyle==='mixed'){
          const m=sent.match(pair.us);
          if(m){
            const concern=domStyle==='mixed'
              ? `Both "${pair.usBase}" and "${pair.ukBase}" appear in the document.`
              : `"${m[0]}" (US spelling) found — document mostly uses UK spelling.`;
            issues.push({
              section:'spelling',
              word:`${pair.usBase} / ${pair.ukBase}`,
              usage:concern,
              rec:domStyle==='mixed'
                ? `Choose one spelling style and use it consistently. Both UK and US spellings are acceptable — just not both.`
                : `Change to UK spelling: "${pair.ukBase}"`,
            });
            seen.add(pairKey);
          }
        } else if(domStyle==='us'){
          const m=sent.match(pair.uk);
          if(m){
            issues.push({
              section:'spelling',
              word:`${pair.usBase} / ${pair.ukBase}`,
              usage:`"${m[0]}" (UK spelling) found — document mostly uses US spelling.`,
              rec:`Change to US spelling: "${pair.usBase}"`,
            });
            seen.add(pairKey);
          }
        }
      }
    }
  }
  return issues;
}

/* F. GRAMMAR ─────────────────────────────────────────────── */

// STRICT a/an: explicit safe cases only — no guessing
const AAN_NEEDS_AN_LIST=[
  [/\ba\s+(understanding)\b/i,  'an understanding'],
  [/\ba\s+(inquiry)\b/i,        'an inquiry'],
  [/\ba\s+(excellent)\b/i,      'an excellent'],
  [/\ba\s+(important)\b/i,      'an important'],
  [/\ba\s+(interesting)\b/i,    'an interesting'],
  [/\ba\s+(effective)\b/i,      'an effective'],
  [/\ba\s+(essential)\b/i,      'an essential'],
  [/\ba\s+(engaging)\b/i,       'an engaging'],
  [/\ba\s+(authentic)\b/i,      'an authentic'],
  [/\ba\s+(accurate)\b/i,       'an accurate'],
  [/\ba\s+(IB)\b/i,             'an IB'],
];
const AAN_NEEDS_A_LIST=[
  [/\ban\s+(strong)\b/i,       'a strong'],
  [/\ban\s+(great)\b/i,        'a great'],
  [/\ban\s+(good)\b/i,         'a good'],
  [/\ban\s+(student)\b/i,      'a student'],
  [/\ban\s+(significant)\b/i,  'a significant'],
];

// Missing "a" before "highly/very independent/keen/talented learner/thinker etc."
const MISSING_A_RE=/\b(is|was|remains?|became?)\s+(very|highly|quite|an?\s+incredibly|incredibly|remarkably|quite)\s+(?!a\b|an\b)(independent|keen|talented|motivated|confident|dedicated|organised|organized|focused|resilient|thoughtful|engaged|enthusiastic)\s+(learner|thinker|communicator|contributor|member|reader|writer|mathematician)\b/i;

// Missing "the" — common specific cases
const MISSING_THE_LIST=[
  { re:/\bapproaches\s+(Unit\s+of\s+Inquiry)\b/i, correct:'approaches the Unit of Inquiry' },
  { re:/\bduring\s+(Unit\s+of\s+Inquiry)\b/i,     correct:'during the Unit of Inquiry' },
  { re:/\bin\s+(Unit\s+of\s+Inquiry)\b/i,          correct:'in the Unit of Inquiry' },
  { re:/\bthrough\s+(Unit\s+of\s+Inquiry)\b/i,     correct:'through the Unit of Inquiry' },
];

// Missing hyphen
const HYPHEN_LIST=[
  { re:/\b(four|three|five|six|seven|eight)\s+paragraph\b(?!\s*[-–])/i, suggest:'Add a hyphen: e.g. "four-paragraph persuasive letter"' },
  { re:/\bwell\s+written\b(?!\s*[-–])/i,       suggest:'Add a hyphen when used before a noun: "well-written"' },
  { re:/\bwell\s+structured\b(?!\s*[-–])/i,    suggest:'Add a hyphen when used before a noun: "well-structured"' },
  { re:/\bself\s+management\b(?!\s*[-–])/i,    suggest:'Add a hyphen: "self-management"' },
  { re:/\bself\s+directed\b(?!\s*[-–])/i,      suggest:'Add a hyphen: "self-directed"' },
  { re:/\bself\s+motivated\b(?!\s*[-–])/i,     suggest:'Add a hyphen: "self-motivated"' },
  { re:/\bself\s+paced\b(?!\s*[-–])/i,         suggest:'Add a hyphen: "self-paced"' },
];

function checkGrammar(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text);
  const issues=[];

  for(const sent of sents){
    if(!isClean(sent)) continue;

    // a/an — needs "an"
    for(const [re,correct] of AAN_NEEDS_AN_LIST){
      const m=sent.match(re);
      if(m){
        const improved=sent.replace(re,correct);
        if(!/\ban\s+a[n]?\b/i.test(improved)){
          issues.push({ section:'grammar', type:'Grammar', student:`${student} — ${area}`,
            check:`"${m[0]}" — should be "${correct}".`,
            fix:`Change "${m[0]}" to "${correct}".` });
          break;
        }
      }
    }

    // a/an — needs "a"
    for(const [re,correct] of AAN_NEEDS_A_LIST){
      const m=sent.match(re);
      if(m){
        issues.push({ section:'grammar', type:'Grammar', student:`${student} — ${area}`,
          check:`"${m[0]}" — "${m[1]}" begins with a consonant sound and needs "a", not "an".`,
          fix:`Change "${m[0]}" to "${correct}".` });
        break;
      }
    }

    // Missing "a" before "highly independent learner" etc.
    const mA=sent.match(MISSING_A_RE);
    if(mA){
      issues.push({ section:'grammar', type:'Missing word', student:`${student} — ${area}`,
        check:`"${mA[0]}" — missing the article "a" before the noun phrase.`,
        fix:`Add "a": e.g. "…is a highly ${mA[3]} ${mA[4]}"` });
    }

    // Missing "the"
    for(const {re,correct} of MISSING_THE_LIST){
      const m=sent.match(re);
      if(m){
        issues.push({ section:'grammar', type:'Missing word', student:`${student} — ${area}`,
          check:`"${m[0]}" — missing "the".`,
          fix:`Change to "${correct}".` });
        break;
      }
    }

    // Missing hyphen
    for(const {re,suggest} of HYPHEN_LIST){
      const m=sent.match(re);
      if(m){
        issues.push({ section:'grammar', type:'Hyphenation', student:`${student} — ${area}`,
          check:`"${m[0]}" — compound adjective used before a noun needs a hyphen.`,
          fix:suggest });
        break;
      }
    }
  }
  return issues;
}

/* G. PUNCTUATION / SPACING ──────────────────────────────── */
function checkPunctuation(seg){
  const {student,area,text}=seg;
  const issues=[];

  // Missing space after full stop — "word.Capital" — clear high-confidence cases
  const re1=/([a-z]{3,})\.(Additionally|Furthermore|However|Throughout|This|The|In|During|As|By|After|Before|He|She|They|It|Our|His|Her|Their|One|Another|Over|Both|While|Since|Although|When|Although|Across|Through)/g;
  let m;
  const spacingCount=[];
  while((m=re1.exec(text))!==null){
    spacingCount.push({ student:`${student} — ${area}`, found:m[0], fix:`"${m[1]}. ${m[2]}"` });
    if(spacingCount.length>=2) break;
  }
  spacingCount.forEach(s=>{
    issues.push({ section:'grammar', type:'Spacing', student:s.student,
      check:`"${s.found}" — missing space after full stop.`,
      fix:`Change to ${s.fix}.` });
  });

  // Extra full stop ("topic. ." or "topic..")
  const re2=/\w[.]\s+[.]|[.][.]/g;
  if(re2.test(text)){
    issues.push({ section:'grammar', type:'Punctuation', student:`${student} — ${area}`,
      check:'Extra full stop found (e.g. "topic. ." or "topic..").',
      fix:'Remove the extra full stop.' });
  }

  // Space before comma
  const re3=/([a-zA-Z])\s,/g;
  if(re3.test(text)){
    issues.push({ section:'grammar', type:'Spacing', student:`${student} — ${area}`,
      check:'Space before a comma found (e.g. "progress ,").',
      fix:'Remove the space before the comma.' });
  }

  return issues;
}

/* H. FIRST PERSON ───────────────────────────────────────── */
function checkFirstPerson(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text);
  const issues=[];
  const weMatches=[];
  const ourMatches=[];
  for(const sent of sents){
    if(!isClean(sent)) continue;
    if(/\bwe\b/i.test(sent)) weMatches.push(sent);
    if(/\bour\b/i.test(sent)) ourMatches.push(sent);
  }
  if(weMatches.length){
    issues.push({ section:'firstperson', type:'First-person wording', student:`${student} — ${area}`,
      current:`"we" used in comment`,
      concern:'Report cards are usually written in third person.',
      suggest:'Replace "we" with the subject. E.g. "As we moved into…" → "During the…"' });
  }
  if(ourMatches.length){
    issues.push({ section:'firstperson', type:'First-person wording', student:`${student} — ${area}`,
      current:`"our" used in comment (e.g. "${ourMatches[0].trim().substring(0,60)}…")`,
      concern:'Report cards are usually written in third person.',
      suggest:'Replace "our" with "the". E.g. "our biography unit" → "the biography unit".' });
  }
  return issues;
}

/* I. TONE ───────────────────────────────────────────────── */
function checkTone(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text);
  const issues=[];
  for(const sent of sents){
    if(!isClean(sent)) continue;
    for(const rule of TONE_FLAGS){
      const m=sent.match(rule.re);
      if(!m) continue;
      // Skip "challenging tasks/work/content" — about the content not the child
      if(/(challenging|difficult)\s+(task|work|content|text|question|problem|activity|topic|reading|concept)/i.test(sent)&&
         /challenging|difficult/i.test(m[0])) continue;
      issues.push({ section:'tone', type:rule.type, student:`${student} — ${area}`,
        current:`"${sent.trim()}"`,
        concern:rule.concern,
        suggest:rule.suggest });
      break;
    }
  }
  return issues;
}

/* J. WORDINESS ──────────────────────────────────────────── */
function checkWordiness(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text);
  const issues=[];
  for(const sent of sents){
    if(!isClean(sent)) continue;
    for(const {re,type,suggest} of WORDY){
      const m=sent.match(re);
      if(m){
        issues.push({ section:'wordy', type:type||'Wording', student:`${student} — ${area}`,
          current:`"${m[0]}"`,
          concern:'Wordy or overly formal phrasing that may be unclear for some parents.',
          suggest:`Consider: ${suggest}` });
        break;
      }
    }
  }
  return issues;
}

/* K. DUPLICATION / CONTRADICTION ───────────────────────── */
function checkDuplication(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text);
  const issues=[];

  for(const sent of sents){
    if(!isClean(sent)) continue;

    // "Furthermore/Moreover ... also"
    if(/\b(furthermore|moreover)\b[^.]{0,80}\balso\b/i.test(sent)){
      issues.push({ section:'duplication', type:'Redundant wording', student:`${student} — ${area}`,
        check:'"furthermore" (or "moreover") and "also" used together in one sentence.',
        fix:'Use one or the other: "Furthermore, he is encouraged…" or "He is also encouraged…"' });
    }

    // Exact word repeated ("the the", "and and", "a a", "to to")
    const dbl=sent.match(/\b(\w{1,15})\s+\1\b/i);
    if(dbl){
      issues.push({ section:'duplication', type:'Repeated word', student:`${student} — ${area}`,
        check:`"${dbl[0]}" — the same word appears twice in a row.`,
        fix:`Remove the duplicate "${dbl[1]}".` });
    }
  }

  // Contradiction: "can X … is learning to X"
  if(/\bcan\b.{0,80}\bis\s+(learning|working)\s+to\b/i.test(text)){
    issues.push({ section:'duplication', type:'Possible contradiction', student:`${student} — ${area}`,
      check:'The comment says the student can already do something, then says they are learning to do it.',
      fix:'Choose one: either the student can already do this, or they are working towards it.' });
  }

  return issues;
}

/* L. LEVEL ALIGNMENT ────────────────────────────────────── */
const STRONG_WORDS=/\b(exemplary|remarkable|outstanding|exceptional|surpasses?|beyond\s+the\s+(curriculum|requirements?|expectations?)|extends?\s+(her|his|their)?\s+learning\s+beyond)\b/i;
const WEAK_WORDS=/\b(is\s+beginning|still\s+developing|finding\s+(this\s+)?difficult|needs?\s+(a\s+lot\s+of\s+)?support\b|with\s+support|not\s+yet)\b/i;

function checkLevelAlignment(seg){
  const {student,area,text,level}=seg;
  if(!level) return [];
  const isHigh=/(Extending|Exceeding)/i.test(level);
  const isLow=/(Emerging|Beginning|Approaching)/i.test(level);
  const issues=[];

  if(!isHigh&&STRONG_WORDS.test(text)){
    const m=text.match(STRONG_WORDS);
    issues.push({ section:'level', student:`${student} — ${area}`, level,
      concern:`The comment uses very strong wording ("${m[0]}") that sounds stronger than the selected level (${level}).`,
      action:'Either raise the level or slightly reduce the wording of the comment.' });
  }
  if(!isLow&&WEAK_WORDS.test(text)){
    const m=text.match(WEAK_WORDS);
    issues.push({ section:'level', student:`${student} — ${area}`, level,
      concern:`The comment uses wording ("${m[0]}") that suggests the student may be below the selected level (${level}).`,
      action:'Either lower the level or revise the comment to better reflect the selected level.' });
  }
  return issues;
}

/* ═══════════════════════════════════════════════════════════════
   WHOLE-DOCUMENT CHECKS (not per-student)
═══════════════════════════════════════════════════════════════ */
function checkDocumentWide(fullText, domStyle, segments){
  const issues=[];

  // UK/US consistency
  const spellIssues=checkSpellingConsistency(fullText,domStyle,segments);
  spellIssues.forEach(i=>issues.push(i));

  return issues;
}

/* ═══════════════════════════════════════════════════════════════
   RUN ALL CHECKS
═══════════════════════════════════════════════════════════════ */
function runAllChecks(segments, roster, fullText, settings){
  const {spellingPref,checkFirstPersonFlag,checkLevelFlag}=settings;
  const domStyle=detectSpelling(fullText,spellingPref);
  const allIssues=[];

  // Document-wide checks
  checkDocumentWide(fullText,domStyle,segments).forEach(i=>allIssues.push(i));

  // Per-segment checks
  for(const seg of segments){
    checkWrongName(seg,roster).forEach(i=>allIssues.push(i));
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

  return {allIssues,domStyle};
}

/* ═══════════════════════════════════════════════════════════════
   RENDER — tables styled to match Y4GM / Y5JR sample documents
═══════════════════════════════════════════════════════════════ */
function h(s){ return escH(s); }

function makeSection(title, icon, count){
  const el=document.createElement('div');
  el.className='feedback-section';
  const countBadge=count>0?` <span class="section-count">${count}</span>`:'';
  el.innerHTML=`<div class="section-heading">${icon} ${h(title)}${countBadge}</div>`;
  return el;
}

function emptySection(title,icon,msg){
  const el=document.createElement('div');
  el.className='feedback-section';
  el.innerHTML=`<div class="section-heading">${icon} ${h(title)}</div><div class="section-ok">&#10003; ${h(msg)}</div>`;
  return el;
}

/* --- Biggest fixes needed (+ name issues) ─────────────────── */
function renderBiggest(issues){
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student||'Whole document')}</td>
    <td><span class="type-badge">${h(i.type||'')}</span></td>
    <td class="td-issue">${h(i.check||i.col1||'')}</td>
    <td class="td-fix">${h(i.fix||i.col3||'')}</td>
  </tr>`).join('');
  const el=issues.length===0
    ? emptySection('Biggest fixes needed','&#128276;','No major issues found. See sections below for smaller checks.')
    : makeSection('Biggest fixes needed','&#128276;',issues.length);
  if(issues.length>0) el.innerHTML+=`
    <div class="table-wrap"><table>
      <thead><tr><th>Student / Area</th><th>Issue type</th><th>What to check</th><th>Suggested fix</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  return el;
}

/* --- Name and pronoun consistency ─────────────────────────── */
function renderNames(issues){
  if(!issues.length) return emptySection('Name and pronoun consistency','&#128101;','No name or pronoun issues found.');
  const el=makeSection('Name and pronoun consistency','&#128101;',issues.length);
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td><span class="type-badge">${h(i.type)}</span></td>
    <td class="td-issue">${h(i.check)}</td>
    <td class="td-fix">${h(i.fix)}</td>
  </tr>`).join('');
  el.innerHTML+=`<div class="table-wrap"><table>
    <thead><tr><th>Student / Area</th><th>Issue type</th><th>What to check</th><th>Suggested fix</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
  return el;
}

/* --- Spelling ──────────────────────────────────────────────── */
function renderSpelling(issues){
  if(!issues.length) return emptySection('Spelling and UK/US consistency','&#128221;','No spelling issues found.');
  const el=makeSection('Spelling and UK/US consistency','&#128221;',issues.length);
  const rows=issues.map(i=>`<tr>
    <td class="td-word-cell"><span class="td-word">${h(i.word)}</span></td>
    <td class="td-current">${h(i.usage)}</td>
    <td class="td-fix">${h(i.rec)}</td>
  </tr>`).join('');
  el.innerHTML+=`<div class="table-wrap"><table>
    <thead><tr><th>Word / phrase</th><th>Current usage</th><th>Recommendation</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
  return el;
}

/* --- Grammar, punctuation, spacing ────────────────────────── */
function renderGrammar(issues){
  if(!issues.length) return emptySection('Grammar, punctuation and spacing','&#9998;','No grammar or punctuation issues found.');
  const el=makeSection('Grammar, punctuation and spacing','&#9998;',issues.length);
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td><span class="type-badge">${h(i.type)}</span></td>
    <td class="td-issue">${h(i.check)}</td>
    <td class="td-fix">${h(i.fix)}</td>
  </tr>`).join('');
  el.innerHTML+=`<div class="table-wrap"><table>
    <thead><tr><th>Student / Area</th><th>Issue type</th><th>What to check</th><th>Suggested fix</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
  return el;
}

/* --- Tone ──────────────────────────────────────────────────── */
function renderTone(issues){
  if(!issues.length) return emptySection('Tone comments to soften','&#128172;','No sensitive or negative tone issues found.');
  const el=makeSection('Tone comments to soften','&#128172;',issues.length);
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td class="td-current">${h(i.current||i.col1)}</td>
    <td class="td-concern">${h(i.concern||i.col2)}</td>
    <td class="td-fix">${h(i.suggest||i.col3)}</td>
  </tr>`).join('');
  el.innerHTML+=`<div class="table-wrap"><table>
    <thead><tr><th>Student / Area</th><th>Current wording</th><th>Concern</th><th>Suggested wording</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
  return el;
}

/* --- First person ──────────────────────────────────────────── */
function renderFirstPerson(issues){
  if(!issues.length) return null;
  const el=makeSection('First-person wording (we / our / I)','&#9997;&#65039;',issues.length);
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td class="td-current">${h(i.current)}</td>
    <td class="td-concern">${h(i.concern)}</td>
    <td class="td-fix">${h(i.suggest)}</td>
  </tr>`).join('');
  el.innerHTML+=`<div class="table-wrap"><table>
    <thead><tr><th>Student / Area</th><th>Current wording</th><th>Concern</th><th>Suggested wording</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
  return el;
}

/* --- Wordiness ─────────────────────────────────────────────── */
function renderWordy(issues){
  if(!issues.length) return emptySection('Wordiness / informal wording / parent-friendly clarity','&#128196;','No wordiness or clarity issues found.');
  const el=makeSection('Wordiness / informal wording / parent-friendly clarity','&#128196;',issues.length);
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td class="td-current">${h(i.current)}</td>
    <td class="td-concern">${h(i.concern)}</td>
    <td class="td-fix">${h(i.suggest)}</td>
  </tr>`).join('');
  el.innerHTML+=`<div class="table-wrap"><table>
    <thead><tr><th>Student / Area</th><th>Current wording</th><th>Concern</th><th>Suggested wording</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
  return el;
}

/* --- Duplication ───────────────────────────────────────────── */
function renderDuplication(issues){
  if(!issues.length) return emptySection('Duplication or contradiction','&#128260;','No duplication or contradiction issues found.');
  const el=makeSection('Duplication or contradiction','&#128260;',issues.length);
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td><span class="type-badge">${h(i.type)}</span></td>
    <td class="td-issue">${h(i.check)}</td>
    <td class="td-fix">${h(i.fix)}</td>
  </tr>`).join('');
  el.innerHTML+=`<div class="table-wrap"><table>
    <thead><tr><th>Student / Area</th><th>Issue type</th><th>What to check</th><th>Suggested fix</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
  return el;
}

/* --- Level alignment ───────────────────────────────────────── */
function renderLevel(issues){
  if(!issues.length) return null;
  const el=makeSection('Comments that may sound stronger or weaker than their level','&#127919;',issues.length);
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td>${h(i.level)}</td>
    <td class="td-concern">${h(i.concern)}</td>
    <td class="td-fix">${h(i.action)}</td>
  </tr>`).join('');
  el.innerHTML+=`<div class="table-wrap"><table>
    <thead><tr><th>Student / Area</th><th>Level</th><th>Comment concern</th><th>Possible action</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
  return el;
}

/* --- Priority checklist (as a table, matching Y5JR style) ─── */
function buildPriority(allIssues){
  const items=[];
  const names=allIssues.filter(i=>i.section==='biggest'&&(i.type||'').toLowerCase().includes('name'));
  if(names.length) items.push(`Fix ${names.length} possible wrong-name issue${names.length>1?'s':''}.`);

  const pronouns=allIssues.filter(i=>i.section==='names');
  if(pronouns.length) items.push(`Fix ${pronouns.length} pronoun inconsistency issue${pronouns.length>1?'s':''}.`);

  const typos=allIssues.filter(i=>i.section==='spelling'&&i.type==='Spelling error');
  if(typos.length) items.push(`Correct ${typos.length} spelling error${typos.length>1?'s':''}: ${typos.slice(0,3).map(i=>i.word).join(', ')}${typos.length>3?'…':''}.`);

  const consist=allIssues.filter(i=>i.section==='spelling'&&!i.type);
  if(consist.length) items.push(`Resolve UK/US spelling inconsistency (${consist.slice(0,2).map(i=>i.word).join(', ')}${consist.length>2?'…':''}).`);

  const fp=allIssues.filter(i=>i.section==='firstperson');
  if(fp.length) items.push(`Remove or reduce first-person wording ("our", "we") — found in ${fp.length} comment${fp.length>1?'s':''}.`);

  const tone=allIssues.filter(i=>i.section==='tone');
  if(tone.length){
    const labels=[...new Set(tone.slice(0,3).map(i=>i.type))];
    items.push(`Soften sensitive or negative wording: ${labels.join(', ')}.`);
  }

  const gram=allIssues.filter(i=>i.section==='grammar');
  if(gram.length) items.push(`Review ${gram.length} grammar/punctuation item${gram.length>1?'s':''}.`);

  const dup=allIssues.filter(i=>i.section==='duplication');
  if(dup.length) items.push(`Fix ${dup.length} duplication or contradiction item${dup.length>1?'s':''}.`);

  const level=allIssues.filter(i=>i.section==='level');
  if(level.length) items.push(`Review comment/level alignment for ${level.length} comment${level.length>1?'s':''}.`);

  return items;
}

function renderPriority(items){
  const box=document.getElementById('priorityBox');
  const tbl=document.getElementById('priorityTable');
  if(!items.length){ box.hidden=true; return; }
  tbl.innerHTML=items.map((it,i)=>`<tr>
    <td class="priority-num">Priority ${i+1}</td>
    <td class="priority-action">${h(it)}</td>
  </tr>`).join('');
  box.hidden=false;
}

/* ── MAIN RENDER ────────────────────────────────────────── */
function renderResults(allIssues, warnings, fileName, className){
  const title = className
    ? `${className} Report Card Feedback`
    : (fileName ? `${fileName.replace(/\.[^.]+$/,'')} Report Card Feedback` : 'Report Card Feedback');
  document.getElementById('resultsTitle').textContent=title;

  // Warnings
  const warnBox=document.getElementById('extractionWarning');
  const warnList=document.getElementById('warningList');
  if(warnings.length){
    warnList.innerHTML=warnings.map(w=>`<li>${h(w)}</li>`).join('');
    warnBox.hidden=false;
  } else { warnBox.hidden=true; }

  // Summary
  const total=allIssues.length;
  const bigCount=allIssues.filter(i=>i.section==='biggest').length;
  const nameCount=allIssues.filter(i=>i.section==='names').length;
  const spellCount=allIssues.filter(i=>i.section==='spelling').length;
  const gramCount=allIssues.filter(i=>i.section==='grammar').length;
  const toneCount=allIssues.filter(i=>i.section==='tone').length;
  document.getElementById('summaryBar').innerHTML=`
    <div class="summary-pill ${total>10?'red':total>3?'amber':'green'}">
      <span class="pill-count">${total}</span> items to review
    </div>
    ${bigCount?`<div class="summary-pill red"><span class="pill-count">${bigCount}</span> biggest fixes</div>`:''}
    ${nameCount?`<div class="summary-pill red"><span class="pill-count">${nameCount}</span> name/pronoun</div>`:''}
    ${spellCount?`<div class="summary-pill amber"><span class="pill-count">${spellCount}</span> spelling</div>`:''}
    ${gramCount?`<div class="summary-pill amber"><span class="pill-count">${gramCount}</span> grammar</div>`:''}
    ${toneCount?`<div class="summary-pill amber"><span class="pill-count">${toneCount}</span> tone</div>`:''}
    ${total===0?`<div class="summary-pill green"><span class="pill-count">&#10003;</span> No issues found</div>`:''}
  `;

  // Sections
  const body=document.getElementById('feedbackBody');
  body.innerHTML='';

  const biggestIssues=allIssues.filter(i=>i.section==='biggest');
  body.appendChild(renderBiggest(biggestIssues));
  body.appendChild(renderNames(allIssues.filter(i=>i.section==='names')));
  body.appendChild(renderSpelling(allIssues.filter(i=>i.section==='spelling')));
  body.appendChild(renderGrammar(allIssues.filter(i=>i.section==='grammar')));
  body.appendChild(renderTone(allIssues.filter(i=>i.section==='tone')));

  const fpEl=renderFirstPerson(allIssues.filter(i=>i.section==='firstperson'));
  if(fpEl) body.appendChild(fpEl);

  body.appendChild(renderWordy(allIssues.filter(i=>i.section==='wordy')));
  body.appendChild(renderDuplication(allIssues.filter(i=>i.section==='duplication')));

  const lvlEl=renderLevel(allIssues.filter(i=>i.section==='level'));
  if(lvlEl) body.appendChild(lvlEl);

  renderPriority(buildPriority(allIssues));

  document.getElementById('resultsSection').hidden=false;
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

function flattenForExport(allIssues){
  return allIssues.map(i=>({
    section: i.section,
    type:    i.type||'',
    student: i.student||'Whole document',
    col1:    i.check||i.word||i.current||'',
    col2:    i.check?'':i.usage||i.concern||'',
    col3:    i.fix||i.rec||i.suggest||i.action||'',
  }));
}

function downloadCsv(allIssues,titleStr){
  const flat=flattenForExport(allIssues);
  const hdr=['Section','Issue type','Student / Area','Issue / Current wording','Additional detail','Suggested fix'];
  const csv=[hdr,...flat.map(r=>[r.section,r.type,r.student,r.col1,r.col2,r.col3])]
    .map(row=>row.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  dlBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),titleStr.replace(/\s+/g,'_')+'_feedback.csv');
}

function downloadHtml(allIssues,titleStr,subtitleStr){
  const flat=flattenForExport(allIssues);
  const rows=flat.map(r=>`<tr>
    <td>${h(r.section)}</td><td>${h(r.type)}</td><td><strong>${h(r.student)}</strong></td>
    <td>${h(r.col1)}</td><td style="color:#166534">${h(r.col3)}</td>
  </tr>`).join('');
  const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${h(titleStr)}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;font-size:13px;color:#1a2332}
h1{color:#1a3a5c;font-size:20px}p.sub{color:#4b5563;margin:6px 0 24px;font-size:13px}
table{width:100%;border-collapse:collapse}
thead th{background:#1a3a5c;color:#fff;padding:9px 12px;text-align:left;font-size:12px}
tbody td{padding:9px 12px;border-bottom:1px solid #f0f4f8;vertical-align:top;font-size:12.5px;line-height:1.5}
.note{color:#6b7280;font-style:italic;font-size:12px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px}</style>
</head><body>
<h1>${h(titleStr)}</h1>
<p class="sub">${h(subtitleStr)}</p>
<table>
<thead><tr><th>Section</th><th>Issue type</th><th>Student / Area</th><th>What to check</th><th>Suggested fix</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="note">The reports are mostly polished and professional. The issues above are mainly consistency, tone, and editing checks before submission.</p>
</body></html>`;
  dlBlob(new Blob([html],{type:'text/html;charset=utf-8'}),titleStr.replace(/\s+/g,'_')+'_feedback.html');
}

function downloadPdf(allIssues,titleStr,subtitleStr){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const flat=flattenForExport(allIssues);
  const date=new Date().toLocaleDateString('en-GB');

  doc.setFontSize(16); doc.setTextColor(26,58,92);
  doc.text(titleStr,14,15);
  doc.setFontSize(8); doc.setTextColor(80,80,80);
  const subLines=doc.splitTextToSize(subtitleStr,260);
  doc.text(subLines,14,22);
  doc.setFontSize(7); doc.setTextColor(130,130,130);
  doc.text(`Generated: ${date}`,14,22+subLines.length*4+2);

  const startY=22+subLines.length*4+8;

  doc.autoTable({
    startY,
    head:[['Section','Issue type','Student / Area','What to check','Suggested fix']],
    body:flat.map(r=>[r.section,r.type,r.student,r.col1,r.col3]),
    theme:'striped',
    headStyles:{fillColor:[26,58,92],fontSize:7,fontStyle:'bold',cellPadding:3},
    bodyStyles:{fontSize:7,cellPadding:3,valign:'top',lineColor:[240,244,248],lineWidth:.2},
    columnStyles:{
      0:{cellWidth:22,textColor:[100,100,100]},
      1:{cellWidth:28},
      2:{cellWidth:32,fontStyle:'bold'},
      3:{cellWidth:70},
      4:{cellWidth:80,textColor:[22,101,52]},
    },
    alternateRowStyles:{fillColor:[248,250,255]},
  });

  const finalY=doc.lastAutoTable.finalY+6;
  doc.setFontSize(7); doc.setTextColor(100,100,100);
  doc.text('The reports are mostly polished and professional. The issues above are mainly consistency, tone, and editing checks before submission.',14,finalY);
  doc.save(titleStr.replace(/\s+/g,'_')+'_feedback.pdf');
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
async function processFile(file){
  const ext=file.name.split('.').pop().toLowerCase();
  if(ext==='doc'){
    alert('Please convert this file to .docx first.\n\nOpen it in Microsoft Word or Google Docs, then File → Save as .docx and try again.');
    return;
  }
  if(ext!=='docx'&&ext!=='pdf'){
    alert('Please upload a .pdf or .docx file.');
    return;
  }

  let fullText;
  try{
    fullText = ext==='docx' ? await readDocx(file) : await readPdf(file);
  } catch(err){
    alert('Could not read this file. Make sure it is not password-protected.\n\nError: '+err.message);
    return;
  }

  if(ext==='pdf'){
    const q=checkPdfQuality(fullText);
    if(q==='empty'){
      alert('No text could be extracted from this PDF.\n\nThis is likely a scanned (image-only) PDF. Please export a text-based PDF or upload the .docx version.');
      return;
    }
    if(q==='garbled'){
      alert('This file could not be read clearly enough to check accurately.\n\nThe extracted text looks garbled or mixed up — this often happens with scanned PDFs or PDFs exported from table layouts.\n\nPlease upload the .docx version for accurate results.');
      return;
    }
  }

  const className   = document.getElementById('classNameInput').value.trim();
  const classListRaw= document.getElementById('classListInput').value.trim();
  const manualRoster= classListRaw
    ? new Set(classListRaw.split('\n').map(s=>s.trim()).filter(s=>s.length>=2))
    : new Set();

  const spellingPref        = document.querySelector('input[name="spelling"]:checked')?.value||'auto';
  const checkFirstPersonFlag= document.getElementById('chkFirstPerson').checked;
  const checkLevelFlag      = document.getElementById('chkLevel').checked;

  const {segments,roster}=parseSegments(fullText,manualRoster);

  const warnings=[];
  if(segments.length===0){
    warnings.push('The app could not identify any student sections in this file. For best results, use a .docx file where each student\'s name appears as a clear heading on its own line, or paste your class list in the Settings panel.');
  }

  const {allIssues}=runAllChecks(segments,roster,fullText,{
    spellingPref, checkFirstPersonFlag, checkLevelFlag
  });

  const subtitle='Only comments that need attention are included. Main report card comments were checked for name/pronoun consistency, spelling and UK/US consistency, professional report-card tone, first-person wording/contractions, grammar, punctuation, spacing, duplication, and comment/level alignment.';

  renderResults(allIssues, warnings, file.name, className);

  // Wire downloads
  const titleStr=className?`${className} Report Card Feedback`:'Report Card Feedback';
  const pdfFn =()=>downloadPdf(allIssues,titleStr,subtitle);
  const htmlFn=()=>downloadHtml(allIssues,titleStr,subtitle);
  const csvFn =()=>downloadCsv(allIssues,titleStr);
  ['dlPdf','dlPdf2'].forEach(id=>{const el=document.getElementById(id);if(el)el.onclick=pdfFn;});
  ['dlHtml','dlHtml2'].forEach(id=>{const el=document.getElementById(id);if(el)el.onclick=htmlFn;});
  ['dlCsv','dlCsv2'].forEach(id=>{const el=document.getElementById(id);if(el)el.onclick=csvFn;});
}

/* ═══════════════════════════════════════════════════════════════
   EVENT LISTENERS
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',()=>{
  const fileInput    = document.getElementById('fileInput');
  const dropZone     = document.getElementById('dropZone');
  const fileNameEl   = document.getElementById('fileName');
  const checkBtn     = document.getElementById('checkBtn');
  const spinner      = document.getElementById('spinner');
  const toggle       = document.getElementById('settingsToggle');
  const panel        = document.getElementById('settingsPanel');
  const arrow        = document.getElementById('settingsArrow');
  let chosenFile=null;

  function setFile(f){
    chosenFile=f;
    fileNameEl.textContent=f?`Selected: ${f.name}`:'Accepts .pdf and .docx · For .doc files, save as .docx first';
    checkBtn.disabled=!f;
  }

  toggle.addEventListener('click',()=>{
    const open=!panel.hidden;
    panel.hidden=open;
    toggle.setAttribute('aria-expanded',String(!open));
    arrow.classList.toggle('open',!open);
  });

  fileInput.addEventListener('change',()=>setFile(fileInput.files[0]||null));
  dropZone.addEventListener('click',()=>fileInput.click());
  dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('drag-over');});
  dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop',e=>{
    e.preventDefault();dropZone.classList.remove('drag-over');
    const f=e.dataTransfer.files[0];if(f)setFile(f);
  });

  checkBtn.addEventListener('click',async()=>{
    if(!chosenFile)return;
    checkBtn.disabled=true; spinner.hidden=false;
    document.getElementById('resultsSection').hidden=true;
    try{ await processFile(chosenFile); }
    finally{ spinner.hidden=true; checkBtn.disabled=false; }
  });
});
