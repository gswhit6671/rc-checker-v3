/* ═══════════════════════════════════════════════════════════════
   REPORT CARD CHECKER  —  script.js
   Conservative, teacher-friendly feedback.
   Only shows high-confidence issues with clear, fixable suggestions.
   No IB/ATL suggestions. No "Unknown Student". No invented fixes.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── WORDS THAT ARE NEVER STUDENT NAMES ──────────────────── */
const NOT_NAMES = new Set([
  'Term','Report','Reports','Card','Cards','Year','Unit','Inquiry','Inquirer',
  'UOI','EAL','ATL','IB','PYP','STEM','PE','Art','Science','Music','Drama',
  'Geography','History','Physical','Education','Technology','Computing','ICT',
  'Mathematics','Maths','Math','English','Language','Reading','Writing',
  'Literacy','Numeracy','Specialist','Specialist',
  'Student','Learner','Learning','Teacher','Primary','Secondary','Grade',
  'Profile','Attribute','Attributes','Skills','Skill','Comment','Comments',
  'Emerging','Developing','Achieving','Extending','Secure','Beginning',
  'Approaching','Meeting','Exceeding','High','Support','Beginning',
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
]);

/* ── UK / US SPELLING PAIRS ──────────────────────────────── */
const UK_US = [
  { us: /\borganize(s|d|r|rs|tion|tions|r's)?\b/gi, uk: /\borganise(s|d|r|rs|tion|tions|r's)?\b/gi, usBase:'organize', ukBase:'organise' },
  { us: /\banalyze(s|d|r|rs)?\b/gi,                 uk: /\banalyse(s|d|r|rs)?\b/gi,                  usBase:'analyze',  ukBase:'analyse'  },
  { us: /\brecognize(s|d|r)?\b/gi,                  uk: /\brecognise(s|d|r)?\b/gi,                    usBase:'recognize',ukBase:'recognise' },
  { us: /\bsummarize(s|d|r)?\b/gi,                  uk: /\bsummarise(s|d|r)?\b/gi,                    usBase:'summarize',ukBase:'summarise'},
  { us: /\bcategorize(s|d|r)?\b/gi,                 uk: /\bcategorise(s|d|r)?\b/gi,                   usBase:'categorize',ukBase:'categorise'},
  { us: /\bcharacterize(s|d|r)?\b/gi,               uk: /\bcharacterise(s|d|r)?\b/gi,                 usBase:'characterize',ukBase:'characterise'},
  { us: /\bemphasize(s|d|r)?\b/gi,                  uk: /\bemphasise(s|d|r)?\b/gi,                    usBase:'emphasize',ukBase:'emphasise'},
  { us: /\bfinaliz(e|es|ed|ing)\b/gi,               uk: /\bfinalis(e|es|ed|ing)\b/gi,                 usBase:'finalize', ukBase:'finalise' },
  { us: /\bbehavior(s|al)?\b/gi,                    uk: /\bbehaviour(s|al)?\b/gi,                     usBase:'behavior', ukBase:'behaviour' },
  { us: /\bcenter(s|ed|ing)?\b/gi,                  uk: /\bcentre(s|d|ing)?\b/gi,                     usBase:'center',   ukBase:'centre'    },
  { us: /\bcolor(s|ed|ful|ing)?\b/gi,               uk: /\bcolour(s|ed|ful|ing)?\b/gi,                usBase:'color',    ukBase:'colour'    },
  { us: /\bfavorite(s)?\b/gi,                       uk: /\bfavourite(s)?\b/gi,                        usBase:'favorite', ukBase:'favourite' },
  { us: /\blabor(s|ed)?\b/gi,                       uk: /\blabour(s|ed)?\b/gi,                        usBase:'labor',    ukBase:'labour'    },
  { us: /\bpracticing\b/gi,                         uk: /\bpractising\b/gi,                           usBase:'practicing',ukBase:'practising'},
  { us: /\bprogram(s|med|ming)?\b/gi,               uk: /\bprogramme(s|d|ming)?\b/gi,                 usBase:'program',  ukBase:'programme' },
  { us: /\bmodeling\b/gi,                           uk: /\bmodelling\b/gi,                            usBase:'modeling', ukBase:'modelling' },
  { us: /\btraveling\b/gi,                          uk: /\btravelling\b/gi,                           usBase:'traveling',ukBase:'travelling'},
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
  ['aswell','as well'],['alot','a lot'],['alltogether','altogether'],
];

/* ── TONE WORDS TO SOFTEN ────────────────────────────────── */
const TONE_FLAGS = [
  {
    re: /\b(is\s+)?dysregulated\b/i,
    label: '"dysregulated"',
    concern: 'Clinical language not suited to a parent-facing report.',
    suggest: '"is continuing to develop strategies to manage focus and emotions"',
  },
  {
    re: /\bdistracts?\s+others?\b/i,
    label: '"distracts others"',
    concern: 'Can sound negative in a report card.',
    suggest: '"can impact the learning environment" or "is developing greater self-management"',
  },
  {
    re: /\bbig\s+feelings?\b/i,
    label: '"big feelings"',
    concern: 'Informal and potentially sensitive phrasing.',
    suggest: '"strong emotions" or "emotional responses"',
  },
  {
    re: /\b(has\s+)?personal\s+boundaries?\b/i,
    label: '"personal boundaries"',
    concern: 'Sensitive phrasing that may be inappropriate in a report card.',
    suggest: '"awareness of personal space and respectful interactions"',
  },
  {
    re: /\b(his|her|their)?\s*intelligence\b/i,
    label: '"intelligence"',
    concern: 'Labelling a child\'s intelligence can be sensitive.',
    suggest: '"reasoning skills," "curiosity," or "insight"',
  },
  {
    re: /\bis\s+struggling\s+to\b/i,
    label: '"is struggling to"',
    concern: 'Deficit-focused language.',
    suggest: '"is continuing to develop" or "needs support with"',
  },
  {
    re: /\bstruggles?\s+to\b/i,
    label: '"struggles to"',
    concern: 'Deficit-focused language.',
    suggest: '"is working towards" or "is continuing to develop"',
  },
  {
    re: /\bstruggles?\s+with\b/i,
    label: '"struggles with"',
    concern: 'Deficit-focused language.',
    suggest: '"is developing confidence with" or "needs support with"',
  },
  {
    re: /\bis\s+challenging\b/i,
    label: '"is challenging" (describing the student)',
    concern: 'Sounds like a character judgement rather than a description of learning.',
    suggest: 'Describe the specific behaviour and next step instead.',
  },
  {
    re: /\ba\s+challenging\s+student\b/i,
    label: '"a challenging student"',
    concern: 'Labels the child rather than describing the learning.',
    suggest: 'Describe the specific behaviour and next step instead.',
  },
  {
    re: /\bweak\b/i,
    label: '"weak"',
    concern: 'Too negative for a parent-facing report.',
    suggest: '"is developing" or "is building confidence with"',
  },
  {
    re: /\b(is\s+)?lazy\b/i,
    label: '"lazy"',
    concern: 'Character judgement not appropriate in a report.',
    suggest: '"is developing greater independence and effort"',
  },
  {
    re: /\brefuses?\s+to\b/i,
    label: '"refuses to"',
    concern: 'Too direct for a parent-facing report.',
    suggest: '"is working on" or "sometimes finds it difficult to"',
  },
  {
    re: /\bfails?\s+to\b/i,
    label: '"fails to"',
    concern: 'Deficit language — rephrase as a next step.',
    suggest: '"is working towards" or "is developing the ability to"',
  },
  {
    re: /\bmust\s+try\s+harder\b/i,
    label: '"must try harder"',
    concern: 'Too vague. Name the specific area to develop.',
    suggest: 'State the specific skill or behaviour to develop.',
  },
  {
    re: /\bpoor\s+behavio(u?)r\b/i,
    label: '"poor behaviour"',
    concern: 'Too general and negative for a report card.',
    suggest: '"is developing greater self-management in the classroom"',
  },
  {
    re: /\bdo(es)?\s+not\s+care\b/i,
    label: '"does not care"',
    concern: 'Too blunt for a parent-facing report.',
    suggest: '"would benefit from greater engagement with their learning"',
  },
  {
    re: /\battendance\s+(has|is)\b/i,
    label: 'Attendance mentioned in main comment',
    concern: 'Attendance is usually handled separately, not in the main comment.',
    suggest: 'Remove attendance wording from the main comment or move to a dedicated field.',
  },
  {
    re: /\bpunctuality\b/i,
    label: 'Punctuality mentioned in main comment',
    concern: 'Punctuality is usually handled separately, not in the main comment.',
    suggest: 'Remove punctuality wording or move to a dedicated field.',
  },
];

/* ── WORDY / INFORMAL PHRASES ────────────────────────────── */
const WORDY = [
  { re: /\bnomenclature\b/i, suggest: '"mathematical vocabulary," "fraction vocabulary," or "technical vocabulary"' },
  { re: /\bin\s+order\s+to\b/i, suggest: '"to"' },
  { re: /\bdue\s+to\s+the\s+fact\s+that\b/i, suggest: '"because"' },
  { re: /\bat\s+this\s+point\s+in\s+time\b/i, suggest: '"now" or "currently"' },
  { re: /\bprior\s+to\b/i, suggest: '"before"' },
  { re: /\bwith\s+regard\s+to\b/i, suggest: '"regarding" or "about"' },
  { re: /\ba\s+wide\s+variety\s+of\b/i, suggest: '"many" or "a range of"' },
  { re: /\ba\s+variety\s+of\s+different\b/i, suggest: '"a variety of"' },
  { re: /\bon\s+a\s+regular\s+basis\b/i, suggest: '"regularly"' },
  { re: /\bfor\s+the\s+purpose\s+of\b/i, suggest: '"to"' },
  { re: /\bhas\s+been\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/i, suggest: '"understands"' },
  { re: /\bis\s+able\s+to\s+demonstrate\s+an?\s+understanding\s+of\b/i, suggest: '"understands"' },
  { re: /\bhas\s+been\s+able\s+to\s+demonstrate\b/i, suggest: '"has demonstrated"' },
  { re: /\bis\s+able\s+to\s+demonstrate\b/i, suggest: '"demonstrates"' },
  { re: /\bis\s+able\s+to\b/i, suggest: '"can"' },
  { re: /\bhas\s+been\s+able\s+to\b/i, suggest: '"has been able to" → just use the verb directly, e.g. "has completed"' },
  { re: /\btrue\s+role\s+model\b/i, suggest: '"positive role model for peers"' },
  { re: /\bfoster\s+(independence|agency)\b/i, suggest: '"continue building independence"' },
  { re: /\bleverage(s|d)?\b/i, suggest: '"use" or "apply"' },
  { re: /\butilize(s|d)?\b/i, suggest: '"use" or "apply"' },
  { re: /\bfacilitate(s|d)?\b/i, suggest: '"support" or "help"' },
];

/* ── HELPERS ──────────────────────────────────────────────── */
function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function words(t){ return (t.match(/\b[a-zA-Z]+\b/g)||[]).length; }

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

/* ── PDF QUALITY CHECK ────────────────────────────────────── */
function checkPdfQuality(text){
  if(!text||text.trim().length<60) return 'empty';
  const lines=text.split('\n').filter(l=>l.trim().length>5);
  if(lines.length<3) return 'too_short';
  const realLines=lines.filter(l=>{
    const ws=l.trim().split(/\s+/);
    if(ws.length<3) return false;
    const avg=ws.reduce((s,w)=>s+w.replace(/[^a-z]/gi,'').length,0)/ws.length;
    if(avg>13) return false;
    if(/[A-Z]{6,}/.test(l)) return false;
    return true;
  });
  if(realLines.length/lines.length<0.25) return 'garbled';
  return 'ok';
}

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT PARSING
   Reads the document and groups text into segments: {student, area, text, level}
═══════════════════════════════════════════════════════════════ */

const AREA_RE=[
  {area:'Learner',       re:/\b(learner|student\s+as\s+a\s+learner|sal)\b/i},
  {area:'UOI',           re:/\b(unit\s+of\s+inquiry|uoi|central\s+idea)\b/i},
  {area:'Language',      re:/\b(language|english|reading|writing|literacy)\b/i},
  {area:'Math',          re:/\b(math|maths|mathematics|numeracy)\b/i},
  {area:'Science',       re:/\b(science)\b/i},
  {area:'Specialist',    re:/\b(specialist|pe|physical\s+education|music|drama|art|computing|ict|library)\b/i},
];

const LEVEL_RE=/\b(Emerging|Developing|Achieving|Extending|Beginning|Approaching|Meeting|Exceeding|Secure|High\s+Achieving)\b/;

function detectArea(text){
  for(const {area,re} of AREA_RE){ if(re.test(text)) return area; }
  return 'General';
}

/* Decide if a short line is a student heading */
function isHeadingName(line, rosterSet){
  const t=line.trim();
  if(t.length<2||t.length>50) return null;
  if(/[.!?,;:–—]/.test(t)) return null;
  if(/\b(is|are|was|has|have|can|will|does|did|the|and|but|for|in|on|at|to|of|a|an|with|from)\b/i.test(t)) return null;

  // Roster match first (highest confidence)
  if(rosterSet.size>0){
    for(const name of rosterSet){
      if(name.toLowerCase()===t.toLowerCase()) return name;
      const first=name.split(/\s+/)[0];
      if(first.length>=3 && first.toLowerCase()===t.toLowerCase()) return name;
    }
  }
  // Must look like a proper name: capitalised, not a known non-name word
  if(/^[A-Z][a-z]{1,20}(\s[A-Z][a-z]{1,20})?$/.test(t)){
    const first=t.split(' ')[0];
    if(!NOT_NAMES.has(first) && first.length>=3) return t;
  }
  return null;
}

/* Check whether a line describes a report area */
function isAreaLine(line){
  const t=line.trim();
  if(t.length>80) return null;
  for(const {area,re} of AREA_RE){ if(re.test(t) && t.split(/\s+/).length<=6) return area; }
  return null;
}

function buildRosterFromManual(classListText){
  return new Set(
    classListText.split('\n').map(s=>s.trim()).filter(s=>s.length>=2)
  );
}

function parseSegments(fullText, manualRoster){
  const lines=fullText.split('\n');
  const segments=[];
  const rosterSet=new Set(manualRoster);
  const builtRoster=new Set();

  // First pass: detect all probable student name headings to build internal roster
  lines.forEach(line=>{
    const name=isHeadingName(line, rosterSet);
    if(name) builtRoster.add(name);
  });

  // Combine with manual roster
  for(const n of manualRoster) builtRoster.add(n);

  // Second pass: group into segments
  let curStudent=null, curArea=null, buf=[];

  function flush(){
    const text=buf.join('\n').trim(); buf=[];
    if(!text||text.length<20) return;
    if(!curStudent) return; // skip if no student identified
    const level=(text.match(LEVEL_RE)||[])[1]||null;
    segments.push({
      student: curStudent,
      area:    curArea||detectArea(text),
      text,
      level,
    });
  }

  for(const line of lines){
    const t=line.trim(); if(!t) continue;
    const name=isHeadingName(t, builtRoster);
    const area=name?null:isAreaLine(t);
    if(name){   flush(); curStudent=name; curArea=null; }
    else if(area){ flush(); curArea=area; }
    else { buf.push(t); }
  }
  flush();

  // Fallback: no headings found — try splitting by double newlines
  if(segments.length===0){
    const blocks=fullText.split(/\n{2,}/).map(b=>b.trim()).filter(b=>b.length>=20);
    blocks.forEach((block,idx)=>{
      // Try to find the student name at the start of the block
      const firstLine=block.split('\n')[0].trim();
      const name=isHeadingName(firstLine, builtRoster);
      if(name){
        const rest=block.split('\n').slice(1).join('\n').trim();
        const level=(rest.match(LEVEL_RE)||[])[1]||null;
        segments.push({ student:name, area:detectArea(rest||block), text:rest||block, level });
      }
      // If we can't identify a name, skip this block
    });
  }

  return { segments, roster: builtRoster };
}

/* ═══════════════════════════════════════════════════════════════
   SPELLING STYLE DETECTION
═══════════════════════════════════════════════════════════════ */
function detectSpelling(fullText, pref){
  if(pref==='uk') return 'uk';
  if(pref==='us') return 'us';
  let uk=0, us=0;
  for(const pair of UK_US){
    us+=(fullText.match(pair.us)||[]).length;
    uk+=(fullText.match(pair.uk)||[]).length;
  }
  if(uk===0&&us===0) return 'either';
  if(us>uk*2) return 'us';
  if(uk>us*2) return 'uk';
  return 'mixed';
}

/* ═══════════════════════════════════════════════════════════════
   SENTENCE HELPERS
═══════════════════════════════════════════════════════════════ */
function splitSentences(text){
  const raw=text.match(/[^.!?]*[.!?]+/g)||[text];
  return raw.map(s=>s.trim()).filter(s=>s.length>8&&words(s)>=4);
}

/* Is this sentence clean enough to check? */
function isClean(sentence){
  if(!sentence||words(sentence)<4) return false;
  if(/[A-Z]{5,}/.test(sentence)) return false;  // garbled caps
  if(/\w{18,}/.test(sentence)) return false;     // merged words
  const ws=sentence.split(/\s+/);
  const avg=ws.reduce((s,w)=>s+w.replace(/[^a-zA-Z]/g,'').length,0)/ws.length;
  if(avg>12||avg<2) return false;
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   CHECKS — each returns array of issue objects
   Issue shape: { section, student, area, col1..col4 }
═══════════════════════════════════════════════════════════════ */

/* ── A. WRONG NAME ────────────────────────────────────────── */
function checkWrongName(seg, roster){
  const {student, area, text} = seg;
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
      const m=sent.match(re);
      if(!m) continue;
      // Make sure the match isn't at the very start of a sentence (could be a comparison)
      const idx=sent.search(re);
      if(idx<2) continue;
      issues.push({
        section:'names',
        student: `${student} — ${area}`,
        col1: 'Possible wrong name in comment',
        col2: `The comment appears to be for ${firstName}, but the name "${otherFirst}" appears inside the comment — possible copy-paste error.`,
        col3: `Check whether "${otherFirst}" should be changed to "${firstName}."`,
      });
      break; // one issue per other name
    }
  }
  return issues;
}

/* ── B. PRONOUNS ──────────────────────────────────────────── */
function checkPronouns(seg){
  const {student, area, text}=seg;
  const sents=splitSentences(text).filter(isClean);
  const hasMasc=sents.some(s=>/\b(he|him|his)\b/i.test(s));
  const hasFem=sents.some(s=>/\b(she|her|hers)\b/i.test(s));
  if(hasMasc&&hasFem){
    return [{
      section:'names',
      student:`${student} — ${area}`,
      col1:'Pronoun inconsistency',
      col2:`The comment for ${student.split(' ')[0]} uses both "he/him/his" and "she/her" pronouns.`,
      col3:'Check the comment and use one set of pronouns consistently throughout.',
    }];
  }
  return [];
}

/* ── C. SPELLING TYPOS ────────────────────────────────────── */
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
          type:'error',
          word:`${m[0]} → ${right}`,
          usage:`"${m[0]}" found in ${student}'s ${area} comment`,
          rec:`Change "${m[0]}" to "${right}"`,
        });
        break;
      }
    }
  }
  return issues;
}

/* ── D. UK/US CONSISTENCY (doc-level) ────────────────────── */
function checkSpellingConsistency(fullText, dominantStyle, allSegments){
  if(dominantStyle==='either') return [];
  const issues=[];

  for(const seg of allSegments){
    const sents=splitSentences(seg.text);
    for(const sent of sents){
      if(!isClean(sent)) continue;
      for(const pair of UK_US){
        if(dominantStyle==='uk'){
          const m=sent.match(pair.us);
          if(m){
            issues.push({
              section:'spelling',
              type:'consistency',
              word:`${m[0]}`,
              usage:`"${m[0]}" (US) found in ${seg.student}'s ${seg.area} comment — document mostly uses UK spelling (${pair.ukBase})`,
              rec:`Change to "${pair.ukBase}" for consistency`,
            });
          }
        } else if(dominantStyle==='us'){
          const m=sent.match(pair.uk);
          if(m){
            issues.push({
              section:'spelling',
              type:'consistency',
              word:`${m[0]}`,
              usage:`"${m[0]}" (UK) found in ${seg.student}'s ${seg.area} comment — document mostly uses US spelling (${pair.usBase})`,
              rec:`Change to "${pair.usBase}" for consistency`,
            });
          }
        } else if(dominantStyle==='mixed'){
          // Both styles found — flag both
          const mUS=sent.match(pair.us);
          const mUK=sent.match(pair.uk);
          if(mUS||mUK){
            const found=mUS?mUS[0]:mUK[0];
            issues.push({
              section:'spelling',
              type:'consistency',
              word:`${pair.usBase} / ${pair.ukBase}`,
              usage:`Both "${pair.usBase}" and "${pair.ukBase}" appear in the document.`,
              rec:`Choose one spelling style and apply consistently. Both UK and US spellings are acceptable — just not both.`,
            });
            break; // only flag each pair once
          }
        }
      }
    }
  }

  // Deduplicate by word pair
  const seen=new Set();
  return issues.filter(i=>{
    const key=i.word;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ── E. GRAMMAR ───────────────────────────────────────────── */

// STRICT a/an — only explicit, certain cases
const AAN_NEEDS_AN=[
  /\ba\s+(understanding)\b/i,
  /\ba\s+(inquiry)\b/i,
  /\ba\s+(excellent)\b/i,
  /\ba\s+(important)\b/i,
  /\ba\s+(interesting)\b/i,
  /\ba\s+(effective)\b/i,
  /\ba\s+(essential)\b/i,
  /\ba\s+(engaging)\b/i,
  /\ba\s+(exciting)\b/i,
  /\ba\s+(authentic)\b/i,
  /\ba\s+(active)\b/i,
  /\ba\s+(accurate)\b/i,
  /\ba\s+(IB)\b/i,
];
const AAN_NEEDS_A=[
  /\ban\s+(strong)\b/i,
  /\ban\s+(great)\b/i,
  /\ban\s+(good)\b/i,
  /\ban\s+(student)\b/i,
  /\ban\s+(significant)\b/i,
  /\ban\s+(skilled)\b/i,
  /\ban\s+(steady)\b/i,
  /\ban\s+(structured)\b/i,
];

// Missing hyphen in compound adjectives
const HYPHEN_PATTERNS=[
  {re:/\bfour\s+paragraph\b(?!\s*[-–])/i, suggest:'"four-paragraph"'},
  {re:/\bthree\s+paragraph\b(?!\s*[-–])/i, suggest:'"three-paragraph"'},
  {re:/\bfive\s+paragraph\b(?!\s*[-–])/i, suggest:'"five-paragraph"'},
  {re:/\bfour\s+part\b(?!\s*[-–])/i, suggest:'"four-part"'},
  {re:/\bthree\s+part\b(?!\s*[-–])/i, suggest:'"three-part"'},
  {re:/\bwell\s+written\b(?!\s*[-–])/i, suggest:'"well-written" (when used before a noun)'},
  {re:/\bwell\s+structured\b(?!\s*[-–])/i, suggest:'"well-structured"'},
  {re:/\bself\s+management\b(?!\s*[-–])/i, suggest:'"self-management"'},
  {re:/\bself\s+directed\b(?!\s*[-–])/i, suggest:'"self-directed"'},
  {re:/\bcritical\s+thinking\s+skills\b/i, suggest:null}, // skip — not a hyphen issue
];

// Missing article ("he is highly independent learner" → "a highly independent learner")
const MISSING_ARTICLE=[
  {re:/\b(is|was|became?|remains?)\s+(a\s+)?(very|highly|incredibly|extremely|quite|rather)\s+(?!a\b|an\b)(\w+)\s+(learner|thinker|communicator|contributor|member|reader|writer)\b/i,
   check: m => !/\b(is|was|became?|remains?)\s+a\b/i.test(m), label:'missing article "a"'},
];

function checkGrammar(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text);
  const issues=[];

  for(const sent of sents){
    if(!isClean(sent)) continue;

    // A/an — needs "an"
    for(const re of AAN_NEEDS_AN){
      const m=sent.match(re);
      if(m){
        const word=m[1];
        const correct=sent.replace(re,`an ${word}`);
        if(!/\ban\s+a[n]?\b/i.test(correct)){
          issues.push({
            section:'grammar',
            student:`${student} — ${area}`,
            col1:`"a ${word}" → "an ${word}"`,
            col2:'Missing "an" before a vowel sound.',
            col3:`Change "a ${word}" to "an ${word}".`,
          });
        }
        break;
      }
    }

    // A/an — needs "a"
    for(const re of AAN_NEEDS_A){
      const m=sent.match(re);
      if(m){
        const word=m[1];
        issues.push({
          section:'grammar',
          student:`${student} — ${area}`,
          col1:`"an ${word}" → "a ${word}"`,
          col2:'"an" should only be used before a vowel sound. "' + word + '" begins with a consonant sound.',
          col3:`Change "an ${word}" to "a ${word}".`,
        });
        break;
      }
    }

    // Missing hyphen
    for(const {re,suggest} of HYPHEN_PATTERNS){
      if(!suggest) continue;
      const m=sent.match(re);
      if(m){
        issues.push({
          section:'grammar',
          student:`${student} — ${area}`,
          col1:`Missing hyphen: "${m[0]}"`,
          col2:'Compound adjectives used before a noun should be hyphenated.',
          col3:`Consider writing ${suggest}.`,
        });
        break;
      }
    }
  }
  return issues;
}

/* ── F. PUNCTUATION AND SPACING ──────────────────────────── */
function checkPunctuation(seg){
  const {student,area,text}=seg;
  const issues=[];

  // Missing space after full stop — "word.Capital"
  const re1=/([a-z]{2,})\.(Additionally|Furthermore|However|Throughout|This|The|In|During|As|By|After|Before|He|She|They|It|Throughout|Our|His|Her|Their|One|Another|Over|Under|Both|While|Since|Although|When)/g;
  let m;
  while((m=re1.exec(text))!==null){
    issues.push({
      section:'grammar',
      student:`${student} — ${area}`,
      col1:`Missing space: "${m[0]}"`,
      col2:'A full stop should be followed by a space before the next word.',
      col3:`Change "${m[0]}" to "${m[1]}. ${m[2]}".`,
    });
    if(issues.filter(i=>i.student===`${student} — ${area}`&&i.col1.startsWith('Missing space')).length>=2) break;
  }

  // Missing space after full stop — more general pattern (letters.UppercaseLetter)
  if(issues.length===0){
    const re1b=/([a-z]{3,})\.([A-Z][a-z]{2,})/g;
    while((m=re1b.exec(text))!==null){
      const after=m[2];
      if(NOT_NAMES.has(after)||after.length<4) continue; // skip abbreviations and short words
      issues.push({
        section:'grammar',
        student:`${student} — ${area}`,
        col1:`Missing space: "${m[0]}"`,
        col2:'A full stop should be followed by a space before the next word.',
        col3:`Change "${m[0]}" to "${m[1]}. ${m[2]}".`,
      });
      if(issues.filter(i=>i.col1.startsWith('Missing space')).length>=2) break;
    }
  }

  // Extra full stop — "topic. ." or "word.."
  const re2=/[.]\s+[.]/g;
  while((m=re2.exec(text))!==null){
    issues.push({
      section:'grammar',
      student:`${student} — ${area}`,
      col1:'Extra full stop: "' + text.substring(Math.max(0,m.index-20),m.index+5).trim() + '."',
      col2:'There appear to be two consecutive full stops.',
      col3:'Remove the extra full stop.',
    });
    break;
  }

  // Space before comma — "progress ,"
  const re3=/([a-z])\s,/g;
  while((m=re3.exec(text))!==null){
    issues.push({
      section:'grammar',
      student:`${student} — ${area}`,
      col1:`Extra space before comma: "...${text.substring(Math.max(0,m.index-10),m.index+5).trim()}..."`,
      col2:'There should be no space before a comma.',
      col3:'Remove the space before the comma.',
    });
    break;
  }

  return issues;
}

/* ── G. FIRST PERSON ──────────────────────────────────────── */
function checkFirstPerson(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text);
  const issues=[];
  for(const sent of sents){
    if(!isClean(sent)) continue;
    const mWe=sent.match(/\b(we|our)\b/i);
    if(mWe){
      issues.push({
        section:'tone',
        student:`${student} — ${area}`,
        col1:`First-person wording: "${mWe[0]}"`,
        col2:'Report cards are usually written in third person. "We" and "our" suggest the teacher is speaking as part of the class.',
        col3:mWe[0].toLowerCase()==='we'
          ? 'Replace "we" with "students" or reframe in the third person. E.g. "As we moved into…" → "During the…"'
          : 'Replace "our" with "the". E.g. "our biography unit" → "the biography unit".',
      });
      break;
    }
  }
  return issues;
}

/* ── H. TONE ──────────────────────────────────────────────── */
function checkTone(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text);
  const issues=[];
  for(const sent of sents){
    if(!isClean(sent)) continue;
    for(const rule of TONE_FLAGS){
      const m=sent.match(rule.re);
      if(!m) continue;
      // Skip "challenging tasks/work/text/content" — this is about the content not the child
      if(/(challenging|difficult)\s+(task|work|content|text|question|problem|activity|topic|reading|concept)/i.test(sent)){
        if(/challenging|difficult/i.test(m[0])) continue;
      }
      issues.push({
        section:'tone',
        student:`${student} — ${area}`,
        current:`"${sent.trim()}"`,
        concern:rule.concern,
        suggest:rule.suggest,
        _label:rule.label,
      });
      break; // one tone issue per sentence
    }
  }
  return issues;
}

/* ── I. WORDINESS ─────────────────────────────────────────── */
function checkWordiness(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text);
  const issues=[];
  for(const sent of sents){
    if(!isClean(sent)) continue;
    for(const {re,suggest} of WORDY){
      const m=sent.match(re);
      if(m){
        issues.push({
          section:'wordy',
          student:`${student} — ${area}`,
          current:`"${m[0]}"`,
          concern:'Wordy or overly formal phrasing that may be unclear for some parents.',
          suggest:`Consider: ${suggest}`,
        });
        break;
      }
    }
  }
  return issues;
}

/* ── J. DUPLICATION / CONTRADICTION ──────────────────────── */
function checkDuplication(seg){
  const {student,area,text}=seg;
  const sents=splitSentences(text);
  const issues=[];

  // "Furthermore/Moreover ... also" double-connector
  for(const sent of sents){
    if(!isClean(sent)) continue;
    if(/\b(furthermore|moreover)\b[^.]{0,80}\balso\b/i.test(sent)){
      issues.push({
        section:'duplication',
        student:`${student} — ${area}`,
        col1:'Double transition: "furthermore/moreover" and "also" in the same sentence',
        col2:'Using two transition words together is redundant.',
        col3:'Use either "Furthermore, he is encouraged…" or "He is also encouraged…" — not both.',
      });
    }
    // Exact word repeated: "the the", "and and", "a a", "to to"
    const dbl=sent.match(/\b(\w{1,12})\s+\1\b/i);
    if(dbl){
      issues.push({
        section:'duplication',
        student:`${student} — ${area}`,
        col1:`Word repeated twice: "${dbl[0]}"`,
        col2:'The same word appears twice in a row.',
        col3:`Remove the duplicate "${dbl[1]}".`,
      });
    }
  }

  // Contradiction: "can X … is learning to X" or "is developing … already"
  const fullLower=text.toLowerCase();
  if(/\bcan\b.{0,60}\bis\s+(learning|working)\s+to\b/i.test(text)){
    issues.push({
      section:'duplication',
      student:`${student} — ${area}`,
      col1:'Possible contradiction: "can" then "is learning to"',
      col2:'The comment says the student can already do something, then says they are learning to do it.',
      col3:'Choose one: either the student can do this already, or they are working towards it.',
    });
  }

  // Repeated phrase (same 4+ word phrase appearing twice)
  const phraseRe=/\b([\w]{4,}\s+[\w]{4,}\s+[\w]{4,}\s+[\w]{3,})\b/g;
  const phrases=new Map();
  let pm;
  while((pm=phraseRe.exec(fullLower))!==null){
    const p=pm[1];
    phrases.set(p,(phrases.get(p)||0)+1);
  }
  for(const [p,count] of phrases){
    if(count>=2&&!p.match(/^(the|a|and|but|for|this|that|they|she|he|it|is|are|was|has)\b/)){
      issues.push({
        section:'duplication',
        student:`${student} — ${area}`,
        col1:`Repeated phrase: "${p}"`,
        col2:'The same phrase appears more than once in the comment.',
        col3:`Review the comment to remove or rephrase the repeated section.`,
      });
      break; // only flag first repeated phrase per segment
    }
  }

  return issues;
}

/* ── K. LEVEL ALIGNMENT ───────────────────────────────────── */
function checkLevelAlignment(seg){
  const {student,area,text,level}=seg;
  if(!level) return [];

  const strongWords=/\b(exemplary|remarkable|outstanding|exceptional|surpasses?|beyond\s+the\s+(curriculum|requirements?|expectations?)|extends?\s+(her|his|their)?\s+learning\s+beyond)\b/i;
  const weakWords=/\b(is\s+beginning|still\s+developing|finding\s+(this\s+)?difficult|needs?\s+(a\s+lot\s+of\s+)?support|with\s+support|not\s+yet)\b/i;

  const issues=[];
  const isHigh=/(Extending|Exceeding|High\s+Achieving)/i.test(level);
  const isLow=/(Emerging|Beginning|Approaching)/i.test(level);

  if(!isHigh && strongWords.test(text)){
    const m=text.match(strongWords);
    issues.push({
      section:'level',
      student:`${student} — ${area}`,
      level,
      concern:`The comment uses very strong wording ("${m[0]}") that sounds stronger than the selected level (${level}).`,
      action:`Either raise the level or slightly reduce the wording of the comment.`,
    });
  }
  if(!isLow && weakWords.test(text)){
    const m=text.match(weakWords);
    issues.push({
      section:'level',
      student:`${student} — ${area}`,
      level,
      concern:`The comment uses wording ("${m[0]}") that suggests the student is below the selected level (${level}).`,
      action:`Either lower the level or revise the comment to better reflect the selected level.`,
    });
  }
  return issues;
}

/* ═══════════════════════════════════════════════════════════════
   RUN ALL CHECKS
═══════════════════════════════════════════════════════════════ */
function runAllChecks(segments, roster, fullText, settings){
  const {spellingPref, checkFirstPersonFlag, checkLevelFlag} = settings;
  const domStyle=detectSpelling(fullText, spellingPref);
  const allIssues=[];

  // Doc-level spelling consistency
  const spellIssues=checkSpellingConsistency(fullText, domStyle, segments);
  allIssues.push(...spellIssues);

  for(const seg of segments){
    allIssues.push(...checkWrongName(seg, roster));
    allIssues.push(...checkPronouns(seg));
    allIssues.push(...checkTypos(seg));
    allIssues.push(...checkGrammar(seg));
    allIssues.push(...checkPunctuation(seg));
    allIssues.push(...checkTone(seg));
    if(checkFirstPersonFlag) allIssues.push(...checkFirstPerson(seg));
    allIssues.push(...checkWordiness(seg));
    allIssues.push(...checkDuplication(seg));
    if(checkLevelFlag) allIssues.push(...checkLevelAlignment(seg));
  }

  return { allIssues, domStyle };
}

/* ═══════════════════════════════════════════════════════════════
   RENDER
═══════════════════════════════════════════════════════════════ */
function h(s){ return escH(s); }

function makeFeedbackSection(title, icon, rows, emptyMsg){
  const el=document.createElement('div');
  el.className='feedback-section';
  const count=rows.length;
  if(count===0){
    el.innerHTML=`
      <div class="section-heading">${icon} ${h(title)}</div>
      <div class="section-ok">&#10003; ${h(emptyMsg)}</div>`;
    return el;
  }
  el.innerHTML=`<div class="section-heading">${icon} ${h(title)} <span class="section-count">${count}</span></div>`;
  return el;
}

function renderNameSection(issues){
  const el=document.createElement('div');
  el.className='feedback-section';
  if(issues.length===0){
    el.innerHTML=`<div class="section-heading">&#128101; Name and pronoun consistency</div><div class="section-ok">&#10003; No name or pronoun issues found.</div>`;
    return el;
  }
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td class="td-issue">${h(i.col1)}</td>
    <td class="td-why">${h(i.col2)}</td>
    <td class="td-fix">${h(i.col3)}</td>
  </tr>`).join('');
  el.innerHTML=`
    <div class="section-heading">&#128101; Name and pronoun consistency <span class="section-count">${issues.length}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Student / Area</th><th>Issue</th><th>Why it matters</th><th>Suggested fix</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  return el;
}

function renderSpellingSection(issues){
  const el=document.createElement('div');
  el.className='feedback-section';
  if(issues.length===0){
    el.innerHTML=`<div class="section-heading">&#128221; Spelling and UK/US consistency</div><div class="section-ok">&#10003; No spelling issues found.</div>`;
    return el;
  }
  const rows=issues.map(i=>`<tr>
    <td><span class="td-word">${h(i.word)}</span></td>
    <td class="td-current">${h(i.usage)}</td>
    <td class="td-suggest">${h(i.rec)}</td>
  </tr>`).join('');
  el.innerHTML=`
    <div class="section-heading">&#128221; Spelling and UK/US consistency <span class="section-count">${issues.length}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Word / phrase</th><th>Current usage</th><th>Recommendation</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  return el;
}

function renderGrammarSection(issues){
  const el=document.createElement('div');
  el.className='feedback-section';
  if(issues.length===0){
    el.innerHTML=`<div class="section-heading">&#9998; Grammar, punctuation and spacing</div><div class="section-ok">&#10003; No grammar or punctuation issues found.</div>`;
    return el;
  }
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td class="td-issue">${h(i.col1)}</td>
    <td class="td-why">${h(i.col2)}</td>
    <td class="td-fix">${h(i.col3)}</td>
  </tr>`).join('');
  el.innerHTML=`
    <div class="section-heading">&#9998; Grammar, punctuation and spacing <span class="section-count">${issues.length}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Student / Area</th><th>Issue</th><th>Why it matters</th><th>Suggested fix</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  return el;
}

function renderToneSection(issues){
  const el=document.createElement('div');
  el.className='feedback-section';
  if(issues.length===0){
    el.innerHTML=`<div class="section-heading">&#128172; Tone comments to soften</div><div class="section-ok">&#10003; No sensitive or negative tone issues found.</div>`;
    return el;
  }
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td class="td-current">${h(i.current||i.col1)}</td>
    <td class="td-concern">${h(i.concern||i.col2)}</td>
    <td class="td-suggest">${h(i.suggest||i.col3)}</td>
  </tr>`).join('');
  el.innerHTML=`
    <div class="section-heading">&#128172; Tone comments to soften <span class="section-count">${issues.length}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Student / Area</th><th>Current wording</th><th>Concern</th><th>Suggested wording</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  return el;
}

function renderWordySection(issues){
  const el=document.createElement('div');
  el.className='feedback-section';
  if(issues.length===0){
    el.innerHTML=`<div class="section-heading">&#128196; Wordiness / informal wording / parent-friendly clarity</div><div class="section-ok">&#10003; No wordiness or clarity issues found.</div>`;
    return el;
  }
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td class="td-current">${h(i.current)}</td>
    <td class="td-concern">${h(i.concern)}</td>
    <td class="td-suggest">${h(i.suggest)}</td>
  </tr>`).join('');
  el.innerHTML=`
    <div class="section-heading">&#128196; Wordiness / informal wording / parent-friendly clarity <span class="section-count">${issues.length}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Student / Area</th><th>Current wording</th><th>Concern</th><th>Suggested wording</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  return el;
}

function renderDupSection(issues){
  const el=document.createElement('div');
  el.className='feedback-section';
  if(issues.length===0){
    el.innerHTML=`<div class="section-heading">&#128260; Duplication or contradiction</div><div class="section-ok">&#10003; No duplication or contradiction issues found.</div>`;
    return el;
  }
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td class="td-issue">${h(i.col1)}</td>
    <td class="td-why">${h(i.col2)}</td>
    <td class="td-fix">${h(i.col3)}</td>
  </tr>`).join('');
  el.innerHTML=`
    <div class="section-heading">&#128260; Duplication or contradiction <span class="section-count">${issues.length}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Student / Area</th><th>Issue</th><th>Why it matters</th><th>Suggested fix</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  return el;
}

function renderLevelSection(issues){
  if(issues.length===0) return null;
  const el=document.createElement('div');
  el.className='feedback-section';
  const rows=issues.map(i=>`<tr>
    <td class="td-student">${h(i.student)}</td>
    <td>${h(i.level)}</td>
    <td class="td-concern">${h(i.concern)}</td>
    <td class="td-suggest">${h(i.action)}</td>
  </tr>`).join('');
  el.innerHTML=`
    <div class="section-heading">&#127919; Comment and level alignment <span class="section-count">${issues.length}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Student / Area</th><th>Level</th><th>Comment concern</th><th>Possible action</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  return el;
}

function renderBiggestFixes(allIssues){
  // Biggest fixes = name issues + typos + any grammar issues flagged
  const big=allIssues.filter(i=>
    i.section==='names' ||
    (i.section==='spelling'&&i.type==='error') ||
    (i.section==='grammar'&&(i.col1||'').startsWith('Missing space'))
  );
  const el=document.createElement('div');
  el.className='feedback-section';
  if(big.length===0){
    el.innerHTML=`<div class="section-heading" style="background:#15803d;">&#128276; Biggest fixes needed</div><div class="section-ok" style="color:#15803d;">&#10003; No major issues found. See the sections below for smaller checks.</div>`;
    return el;
  }
  const rows=big.map(i=>{
    const stu=i.student||'—';
    const issue=i.col1||i.word||'—';
    const why=i.col2||i.usage||'—';
    const fix=i.col3||i.rec||'—';
    return `<tr>
      <td class="td-student">${h(stu)}</td>
      <td class="td-issue">${h(issue)}</td>
      <td class="td-why">${h(why)}</td>
      <td class="td-fix">${h(fix)}</td>
    </tr>`;
  }).join('');
  el.innerHTML=`
    <div class="section-heading" style="background:#b91c1c;">&#128276; Biggest fixes needed <span class="section-count">${big.length}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Student / Area</th><th>Issue</th><th>Why it matters</th><th>Suggested fix</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  return el;
}

function buildPriority(allIssues){
  const items=[];
  const nameIssues=allIssues.filter(i=>i.section==='names'&&i.col1&&i.col1.includes('wrong')||i.section==='names'&&i.col1&&i.col1.includes('name'));
  if(nameIssues.length) items.push(`Fix ${nameIssues.length} possible wrong-name or pronoun issue${nameIssues.length>1?'s':''}.`);
  const typos=allIssues.filter(i=>i.section==='spelling'&&i.type==='error');
  if(typos.length) items.push(`Correct ${typos.length} spelling error${typos.length>1?'s':''}: ${typos.slice(0,3).map(i=>i.word).join(', ')}${typos.length>3?'…':''}.`);
  const consist=allIssues.filter(i=>i.section==='spelling'&&i.type==='consistency');
  if(consist.length) items.push(`Resolve UK/US spelling inconsistency (${consist.slice(0,2).map(i=>i.word).join(', ')}${consist.length>2?'…':''}).`);
  const gram=allIssues.filter(i=>i.section==='grammar');
  if(gram.length) items.push(`Review ${gram.length} grammar/punctuation item${gram.length>1?'s':''}.`);
  const tone=allIssues.filter(i=>i.section==='tone'&&i._label);
  if(tone.length){
    const labels=[...new Set(tone.slice(0,3).map(i=>i._label))];
    items.push(`Soften sensitive wording: ${labels.join(', ')}.`);
  }
  const dup=allIssues.filter(i=>i.section==='duplication');
  if(dup.length) items.push(`Fix ${dup.length} duplication or contradiction item${dup.length>1?'s':''}.`);
  const level=allIssues.filter(i=>i.section==='level');
  if(level.length) items.push(`Review comment/level alignment for ${level.map(i=>i.student).join(', ')}.`);
  return items;
}

function renderResults(allIssues, warnings, domStyle, fileName, className){
  // Title
  const title = className
    ? `${className} Report Card Feedback`
    : (fileName ? `${fileName.replace(/\.[^.]+$/,'')} Report Card Feedback` : 'Report Card Feedback');
  document.getElementById('resultsTitle').textContent=title;

  // Warnings
  const warnBox=document.getElementById('extractionWarning');
  const warnList=document.getElementById('warningList');
  if(warnings.length>0){
    warnList.innerHTML=warnings.map(w=>`<li>${h(w)}</li>`).join('');
    warnBox.hidden=false;
  } else { warnBox.hidden=true; }

  // Summary bar
  const totalIssues=allIssues.length;
  const nameCount=allIssues.filter(i=>i.section==='names').length;
  const spellCount=allIssues.filter(i=>i.section==='spelling').length;
  const gramCount=allIssues.filter(i=>i.section==='grammar').length;
  const toneCount=allIssues.filter(i=>i.section==='tone').length;
  document.getElementById('summaryBar').innerHTML=`
    <div class="summary-pill ${totalIssues>10?'red':totalIssues>4?'amber':'green'}">
      <span class="pill-count">${totalIssues}</span> total items to review
    </div>
    ${nameCount>0?`<div class="summary-pill red"><span class="pill-count">${nameCount}</span> name/pronoun</div>`:''}
    ${spellCount>0?`<div class="summary-pill amber"><span class="pill-count">${spellCount}</span> spelling</div>`:''}
    ${gramCount>0?`<div class="summary-pill amber"><span class="pill-count">${gramCount}</span> grammar/punctuation</div>`:''}
    ${toneCount>0?`<div class="summary-pill amber"><span class="pill-count">${toneCount}</span> tone</div>`:''}
  `;

  // Body
  const body=document.getElementById('feedbackBody');
  body.innerHTML='';

  body.appendChild(renderBiggestFixes(allIssues));
  body.appendChild(renderNameSection(allIssues.filter(i=>i.section==='names')));
  body.appendChild(renderSpellingSection(allIssues.filter(i=>i.section==='spelling')));
  body.appendChild(renderGrammarSection(allIssues.filter(i=>i.section==='grammar')));
  body.appendChild(renderToneSection(allIssues.filter(i=>i.section==='tone')));
  body.appendChild(renderWordySection(allIssues.filter(i=>i.section==='wordy')));
  body.appendChild(renderDupSection(allIssues.filter(i=>i.section==='duplication')));
  const levelEl=renderLevelSection(allIssues.filter(i=>i.section==='level'));
  if(levelEl) body.appendChild(levelEl);

  // Priority list
  const items=buildPriority(allIssues);
  const pBox=document.getElementById('priorityBox');
  if(items.length>0){
    document.getElementById('priorityList').innerHTML=items.map((it,i)=>`<li><strong>Priority ${i+1}:</strong> ${h(it)}</li>`).join('');
    pBox.hidden=false;
  } else { pBox.hidden=true; }

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

function flatIssues(allIssues){
  return allIssues.map(i=>({
    section:i.section,
    student:i.student||'—',
    col1:i.col1||i.word||i.current||'—',
    col2:i.col2||i.usage||i.concern||'—',
    col3:i.col3||i.rec||i.suggest||i.action||'—',
  }));
}

function downloadCsv(allIssues, titleStr){
  const flat=flatIssues(allIssues);
  const hdr=['Section','Student / Area','Issue / Word / Current wording','Why it matters / Usage','Suggested fix / Recommendation'];
  const rows=flat.map(r=>[r.section,r.student,r.col1,r.col2,r.col3]);
  const csv=[hdr,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  dlBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}), titleStr.replace(/\s+/g,'_')+'_feedback.csv');
}

function downloadHtml(allIssues, titleStr, subtitleStr){
  const flat=flatIssues(allIssues);
  const rows=flat.map(r=>`<tr><td>${escH(r.section)}</td><td>${escH(r.student)}</td><td>${escH(r.col1)}</td><td>${escH(r.col2)}</td><td style="color:#166534">${escH(r.col3)}</td></tr>`).join('');
  const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${escH(titleStr)}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;font-size:13px;color:#1a2332}h1{color:#1a3a5c}p.sub{color:#6b7280;margin-bottom:24px}
table{width:100%;border-collapse:collapse}thead th{background:#1a3a5c;color:#fff;padding:8px 12px;text-align:left;font-size:12px}
tbody td{padding:9px 12px;border-bottom:1px solid #f0f4f8;vertical-align:top}
.note{color:#6b7280;font-style:italic;font-size:12px;margin-top:24px}</style></head>
<body><h1>${escH(titleStr)}</h1><p class="sub">${escH(subtitleStr)}</p>
<table><thead><tr><th>Section</th><th>Student / Area</th><th>Issue</th><th>Why it matters</th><th>Suggested fix</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="note">&#9888; High-confidence suggestions only. Please review all changes before submitting reports.</p>
</body></html>`;
  dlBlob(new Blob([html],{type:'text/html;charset=utf-8'}), titleStr.replace(/\s+/g,'_')+'_feedback.html');
}

function downloadPdf(allIssues, titleStr, subtitleStr){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const flat=flatIssues(allIssues);
  const date=new Date().toLocaleDateString('en-GB');

  doc.setFontSize(16); doc.setTextColor(26,58,92);
  doc.text(titleStr,14,16);
  doc.setFontSize(8.5); doc.setTextColor(100,100,100);
  doc.text(subtitleStr,14,23);
  doc.setFontSize(7.5); doc.setTextColor(120,120,120);
  doc.text(`Generated: ${date}`,14,29);

  doc.autoTable({
    startY:34,
    head:[['Section','Student / Area','Issue / Current wording','Why it matters','Suggested fix / Recommendation']],
    body:flat.map(r=>[r.section,r.student,r.col1,r.col2,r.col3]),
    theme:'striped',
    headStyles:{fillColor:[26,58,92],fontSize:7,fontStyle:'bold',cellPadding:3},
    bodyStyles:{fontSize:7,cellPadding:3,valign:'top'},
    columnStyles:{0:{cellWidth:22},1:{cellWidth:36},2:{cellWidth:50},3:{cellWidth:60},4:{cellWidth:60}},
    didParseCell: d=>{
      if(d.section==='body'&&d.column.index===4) d.cell.styles.textColor=[22,101,52];
    }
  });

  doc.setFontSize(7); doc.setTextColor(150,150,150);
  doc.text('High-confidence suggestions only. Please review all changes before submitting reports.',14,doc.lastAutoTable.finalY+8);
  doc.save(titleStr.replace(/\s+/g,'_')+'_feedback.pdf');
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
async function processFile(file){
  const ext=file.name.split('.').pop().toLowerCase();

  if(ext==='doc'){
    alert('Please convert this file to .docx first.\n\nOpen it in Microsoft Word or Google Docs, then save/download it as .docx and try again.');
    return;
  }
  if(ext!=='docx'&&ext!=='pdf'){
    alert('Please upload a .pdf or .docx file.');
    return;
  }

  let fullText;
  try{
    if(ext==='docx') fullText=await readDocx(file);
    else fullText=await readPdf(file);
  } catch(err){
    alert('Could not read this file. Make sure it is not password-protected.\n\nError: '+err.message);
    return;
  }

  if(ext==='pdf'){
    const quality=checkPdfQuality(fullText);
    if(quality==='empty'){
      alert('No text could be extracted from this PDF.\n\nThis is likely a scanned (image-only) PDF. Please export as a text-based PDF or upload the .docx version.');
      return;
    }
    if(quality==='garbled'){
      alert('This file could not be read clearly enough to check accurately.\n\nThe extracted text looks garbled or mixed up — this often happens with scanned PDFs or PDFs exported from table-heavy layouts.\n\nPlease upload the .docx version for accurate results.');
      return;
    }
  }

  const className=document.getElementById('classNameInput').value.trim();
  const classListRaw=document.getElementById('classListInput').value.trim();
  const manualRoster=classListRaw?new Set(classListRaw.split('\n').map(s=>s.trim()).filter(s=>s.length>=2)):new Set();
  const spellingPref=document.querySelector('input[name="spelling"]:checked')?.value||'auto';
  const checkFirstPersonFlag=document.getElementById('chkFirstPerson').checked;
  const checkLevelFlag=document.getElementById('chkLevel').checked;

  const {segments, roster}=parseSegments(fullText, manualRoster);

  const warnings=[];
  if(segments.length===0){
    warnings.push('The app could not identify any student sections in this file. For best results, use a .docx file where each student\'s name appears as a clear heading, or paste your class list in the Settings panel.');
  }

  const {allIssues}=runAllChecks(segments, roster, fullText, {
    spellingPref, checkFirstPersonFlag, checkLevelFlag
  });

  const subtitle='Only comments that need attention are included. Main report card comments were checked for name/pronoun consistency, spelling consistency, professional report-card tone, first-person wording/contractions, grammar, punctuation, spacing, duplication, and comment/level alignment.';
  const titleStr=className?`${className} Report Card Feedback`:`Report Card Feedback`;

  renderResults(allIssues, warnings, null, file.name, className);

  // Wire downloads
  function wireDl(id, fn){ const el=document.getElementById(id); if(el) el.onclick=fn; }
  const csvFn=()=>downloadCsv(allIssues,titleStr);
  const htmlFn=()=>downloadHtml(allIssues,titleStr,subtitle);
  const pdfFn=()=>downloadPdf(allIssues,titleStr,subtitle);
  wireDl('dlPdf',pdfFn); wireDl('dlPdf2',pdfFn);
  wireDl('dlHtml',htmlFn); wireDl('dlHtml2',htmlFn);
  wireDl('dlCsv',csvFn); wireDl('dlCsv2',csvFn);
}

/* ═══════════════════════════════════════════════════════════════
   EVENT LISTENERS
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',()=>{
  const fileInput=document.getElementById('fileInput');
  const dropZone=document.getElementById('dropZone');
  const fileNameEl=document.getElementById('fileName');
  const checkBtn=document.getElementById('checkBtn');
  const spinner=document.getElementById('spinner');
  const settingsToggle=document.getElementById('settingsToggle');
  const settingsPanel=document.getElementById('settingsPanel');
  const settingsArrow=document.getElementById('settingsArrow');
  let chosenFile=null;

  function setFile(f){
    chosenFile=f;
    fileNameEl.textContent=f?`Selected: ${f.name}`:'Accepts .pdf and .docx · For .doc files, save as .docx first';
    checkBtn.disabled=!f;
  }

  settingsToggle.addEventListener('click',()=>{
    const open=!settingsPanel.hidden;
    settingsPanel.hidden=open;
    settingsToggle.setAttribute('aria-expanded',String(!open));
    settingsArrow.classList.toggle('open',!open);
  });

  fileInput.addEventListener('change',()=>setFile(fileInput.files[0]||null));
  dropZone.addEventListener('click',()=>fileInput.click());
  dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('drag-over');});
  dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop',e=>{
    e.preventDefault(); dropZone.classList.remove('drag-over');
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
