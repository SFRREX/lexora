/**
 * textRules.js — Local demonstration text-processing rules.
 *
 * These rules are intentionally limited and clearly scoped.
 * They handle common patterns reliably but do NOT claim to be
 * comprehensive grammar checking or AI-powered.
 */

// ── Grammar rules ──────────────────────────────────────────────
const grammarRules = [
  // Subject-verb agreement
  { pattern: /\b(I|we|they|you)\s+is\b/gi, replacement: (m, subj) => `${subj} are` },
  { pattern: /\b(he|she|it)\s+are\b/gi, replacement: (m, subj) => `${subj} is` },
  { pattern: /\b(he|she|it)\s+have\b/gi, replacement: (m, subj) => `${subj} has` },
  { pattern: /\b(I|we|they|you)\s+has\b/gi, replacement: (m, subj) => `${subj} have` },
  { pattern: /\b(he|she|it)\s+were\b/gi, replacement: (m, subj) => `${subj} was` },
  { pattern: /\b(I|we|they|you)\s+was\b/gi, replacement: (m, subj) => `${subj} were` },
  { pattern: /\b(he|she|it)\s+don't\b/gi, replacement: (m, subj) => `${subj} doesn't` },
  { pattern: /\b(he|she|it)\s+dont\b/gi, replacement: (m, subj) => `${subj} doesn't` },

  // Standalone 'i'
  { pattern: /(^|[\s(])i([\s),.!?])/g, replacement: '$1I$2' },

  // Common errors
  { pattern: /\btheir\s+is\b/gi, replacement: 'there is' },
  { pattern: /\btheir\s+are\b/gi, replacement: 'there are' },
  { pattern: /\bthey're\s+is\b/gi, replacement: 'there is' },
  { pattern: /\bthey're\s+are\b/gi, replacement: 'there are' },
  { pattern: /\byour\s+welcome\b/gi, replacement: "you're welcome" },
  { pattern: /\bits\s+a\s+pleasure\b/gi, replacement: "it's a pleasure" },
  { pattern: /\bshould\s+of\b/gi, replacement: 'should have' },
  { pattern: /\bcould\s+of\b/gi, replacement: 'could have' },
  { pattern: /\bwould\s+of\b/gi, replacement: 'would have' },
  { pattern: /\bmust\s+of\b/gi, replacement: 'must have' },
  { pattern: /\bmight\s+of\b/gi, replacement: 'might have' },
  { pattern: /\bdoes\s+not\s+has\b/gi, replacement: 'does not have' },
  { pattern: /\bdo\s+not\s+has\b/gi, replacement: 'do not have' },
  { pattern: /\bcan\s+not\b/g, replacement: 'cannot' },

  // Double negatives (simple cases)
  { pattern: /\bdon't\s+got\s+no\b/gi, replacement: "don't have any" },
  { pattern: /\bdon't\s+have\s+no\b/gi, replacement: "don't have any" },

  // "a" vs "an"
  { pattern: /\ba\s+([aeiou])/gi, replacement: (m, vowel) => `an ${vowel}` },
  { pattern: /\ban\s+([bcdfghjklmnpqrstvwxyz])/gi, replacement: (m, cons) => `a ${cons}` },
];

// ── Spelling corrections ───────────────────────────────────────
const spellingMap = {
  'recieve': 'receive',
  'recieves': 'receives',
  'recieved': 'received',
  'recieving': 'receiving',
  'occured': 'occurred',
  'occurence': 'occurrence',
  'occuring': 'occurring',
  'seperate': 'separate',
  'seperately': 'separately',
  'definately': 'definitely',
  'definitly': 'definitely',
  'accomodate': 'accommodate',
  'acommodate': 'accommodate',
  'neccessary': 'necessary',
  'necesary': 'necessary',
  'succesful': 'successful',
  'successfull': 'successful',
  'goverment': 'government',
  'enviroment': 'environment',
  'occassion': 'occasion',
  'occurrance': 'occurrence',
  'wierd': 'weird',
  'acheive': 'achieve',
  'beleive': 'believe',
  'belive': 'believe',
  'calender': 'calendar',
  'committment': 'commitment',
  'concious': 'conscious',
  'dissapear': 'disappear',
  'dissapoint': 'disappoint',
  'existance': 'existence',
  'foriegn': 'foreign',
  'grammer': 'grammar',
  'harrass': 'harass',
  'independant': 'independent',
  'knowlege': 'knowledge',
  'occassionally': 'occasionally',
  'perseverence': 'perseverance',
  'priviledge': 'privilege',
  'publically': 'publicly',
  'recomend': 'recommend',
  'refered': 'referred',
  'relevent': 'relevant',
  'restarant': 'restaurant',
  'rythm': 'rhythm',
  'sieze': 'seize',
  'suprise': 'surprise',
  'tommorrow': 'tomorrow',
  'tommorow': 'tomorrow',
  'tomorow': 'tomorrow',
  'untill': 'until',
  'writting': 'writing',
  'alot': 'a lot',
  'thier': 'their',
  'teh': 'the',
  'misteak': 'mistake',
  'misteaks': 'mistakes',
  'experiance': 'experience',
  'truely': 'truly',
  'compleatly': 'completely',
};

// ── Punctuation / whitespace rules ─────────────────────────────
const punctuationRules = [
  // Multiple spaces → single space (preserve newlines)
  { pattern: /[^\S\n]{2,}/g, replacement: ' ' },
  // Space before punctuation
  { pattern: / +([.,!?;:])/g, replacement: '$1' },
  // No space after opening or before closing brackets
  { pattern: /\(\s+/g, replacement: '(' },
  { pattern: /\s+\)/g, replacement: ')' },
  // Repeated punctuation (e.g. !! → !)
  { pattern: /([!?.])\1{2,}/g, replacement: '$1' },
  // Capitalize first letter of sentences
  {
    pattern: /([.!?]\s+)([a-z])/g,
    replacement: (m, sep, letter) => `${sep}${letter.toUpperCase()}`,
  },
];

// ── Repeated-word detector ─────────────────────────────────────
const repeatedWordRule = {
  pattern: /\b(\w+)\s+\1\b/gi,
  replacement: '$1',
};

// ── Simplification replacements ────────────────────────────────
const simplificationMap = [
  { from: /\bin order to\b/gi, to: 'to' },
  { from: /\bdue to the fact that\b/gi, to: 'because' },
  { from: /\bin the event that\b/gi, to: 'if' },
  { from: /\bat this point in time\b/gi, to: 'now' },
  { from: /\bfor the purpose of\b/gi, to: 'to' },
  { from: /\bin spite of the fact that\b/gi, to: 'although' },
  { from: /\bwith regard to\b/gi, to: 'about' },
  { from: /\bin the near future\b/gi, to: 'soon' },
  { from: /\bat the present time\b/gi, to: 'now' },
  { from: /\bhas the ability to\b/gi, to: 'can' },
  { from: /\bis able to\b/gi, to: 'can' },
  { from: /\bprior to\b/gi, to: 'before' },
  { from: /\bsubsequent to\b/gi, to: 'after' },
  { from: /\bin close proximity to\b/gi, to: 'near' },
  { from: /\ba large number of\b/gi, to: 'many' },
  { from: /\ba small number of\b/gi, to: 'few' },
  { from: /\bin light of the fact that\b/gi, to: 'because' },
  { from: /\bgive consideration to\b/gi, to: 'consider' },
  { from: /\bgave consideration to\b/gi, to: 'considered' },
  { from: /\bmake a decision\b/gi, to: 'decide' },
  { from: /\bmade a decision\b/gi, to: 'decided' },
  { from: /\btake into consideration\b/gi, to: 'consider' },
  { from: /\btook into consideration\b/gi, to: 'considered' },
  { from: /\btaken into consideration\b/gi, to: 'considered' },
  { from: /\btaking into consideration\b/gi, to: 'considering' },
  { from: /\b(take|takes)\s+(\w+)\s+into consideration\b/gi, to: 'consider $2' },
  { from: /\btook\s+(\w+)\s+into consideration\b/gi, to: 'considered $1' },
  { from: /\btaking\s+(\w+)\s+into consideration\b/gi, to: 'considering $1' },
  { from: /\btaken\s+(\w+)\s+into consideration\b/gi, to: 'considered $1' },
  { from: /\bcome to the conclusion\b/gi, to: 'conclude' },
  { from: /\bcame to the conclusion\b/gi, to: 'concluded' },
];

// ── Shortening rules ───────────────────────────────────────────
const shorteningMap = [
  { from: /\bI am writing this email to tell you that\b/gi, to: '' },
  { from: /\bI am writing to inform you that\b/gi, to: '' },
  { from: /\bI wanted to let you know that\b/gi, to: '' },
  { from: /\bI just wanted to say that\b/gi, to: '' },
  { from: /\bplease do not hesitate to\b/gi, to: 'please' },
  { from: /\bplease feel free to\b/gi, to: 'please' },
  { from: /\bin my opinion,?\s*I think\b/gi, to: 'I think' },
  { from: /\bbasically,?\s*/gi, to: '' },
  { from: /\bactually,?\s*/gi, to: '' },
  { from: /\bas a matter of fact,?\s*/gi, to: '' },
  { from: /\bneedless to say,?\s*/gi, to: '' },
  { from: /\bit goes without saying that\b/gi, to: '' },
  { from: /\beach and every\b/gi, to: 'every' },
  { from: /\bfirst and foremost\b/gi, to: 'first' },
  { from: /\bany and all\b/gi, to: 'all' },
  { from: /\bvery\s+/gi, to: '' },
  { from: /\breally\s+/gi, to: '' },
  ...simplificationMap,
];

// ── Professional tone ──────────────────────────────────────────
const professionalToneMap = [
  { from: /\bgonna\b/gi, to: 'going to' },
  { from: /\bwanna\b/gi, to: 'want to' },
  { from: /\bgotta\b/gi, to: 'have to' },
  { from: /\bkinda\b/gi, to: 'somewhat' },
  { from: /\bsorta\b/gi, to: 'somewhat' },
  { from: /\byeah\b/gi, to: 'yes' },
  { from: /\bnope\b/gi, to: 'no' },
  { from: /\byep\b/gi, to: 'yes' },
  { from: /\bcuz\b/gi, to: 'because' },
  { from: /\bcause\b/gi, to: 'because' },
  { from: /\bthx\b/gi, to: 'thank you' },
  { from: /\bthanks\b/gi, to: 'thank you' },
  { from: /\bhi\b/gi, to: 'Hello' },
  { from: /\bhey\b/gi, to: 'Hello' },
  { from: /\bthis stuff\b/gi, to: 'this matter' },
  { from: /\bstuff\b/gi, to: 'materials' },
  { from: /\bguys\b/gi, to: 'everyone' },
  { from: /\bkids\b/gi, to: 'children' },
  { from: /\bbig\b/gi, to: 'significant' },
  { from: /\bbad\b/gi, to: 'unfavorable' },
  { from: /\bgood\b/gi, to: 'satisfactory' },
  { from: /\bget\b/gi, to: 'obtain' },
  { from: /\bfix\b/gi, to: 'resolve' },
  { from: /\bhelp\b/gi, to: 'assist' },
  { from: /\bneed\b/gi, to: 'require' },
  { from: /\buse\b/gi, to: 'utilize' },
  { from: /\btry\b/gi, to: 'attempt' },
  { from: /\bstart\b/gi, to: 'commence' },
  { from: /\bend\b/gi, to: 'conclude' },
  { from: /\bbuy\b/gi, to: 'purchase' },
  { from: /\bask\b/gi, to: 'inquire' },
];

// ── Casual tone ────────────────────────────────────────────────
const casualToneMap = [
  { from: /\bgoing to\b/gi, to: 'gonna' },
  { from: /\bwant to\b/gi, to: 'wanna' },
  { from: /\bhave to\b/gi, to: 'gotta' },
  { from: /\bdo not\b/gi, to: "don't" },
  { from: /\bcannot\b/gi, to: "can't" },
  { from: /\bwill not\b/gi, to: "won't" },
  { from: /\bit is\b/gi, to: "it's" },
  { from: /\bthat is\b/gi, to: "that's" },
  { from: /\bI am\b/gi, to: "I'm" },
  { from: /\bthey are\b/gi, to: "they're" },
  { from: /\bwe are\b/gi, to: "we're" },
  { from: /\byou are\b/gi, to: "you're" },
  { from: /\bHello\b/g, to: 'Hey' },
  { from: /\bpurchase\b/gi, to: 'buy' },
  { from: /\butilize\b/gi, to: 'use' },
  { from: /\battempt\b/gi, to: 'try' },
  { from: /\bcommence\b/gi, to: 'start' },
  { from: /\binquire\b/gi, to: 'ask' },
  { from: /\bassist\b/gi, to: 'help' },
  { from: /\brequire\b/gi, to: 'need' },
  { from: /\bobtain\b/gi, to: 'get' },
  { from: /\btherefore\b/gi, to: 'so' },
  { from: /\bhowever\b/gi, to: 'but' },
  { from: /\bfurthermore\b/gi, to: 'also' },
  { from: /\bconsequently\b/gi, to: 'so' },
  { from: /\bnevertheless\b/gi, to: 'still' },
  { from: /\bsufficient\b/gi, to: 'enough' },
];

// ── Word Enhancer thesaurus ────────────────────────────────────
const wordAlternatives = {
  good: {
    professional: ['excellent', 'outstanding', 'commendable', 'exemplary'],
    casual: ['great', 'awesome', 'nice', 'solid'],
    stronger: ['exceptional', 'remarkable', 'superb', 'superior'],
    simpler: ['fine', 'okay', 'decent', 'satisfactory'],
  },
  bad: {
    professional: ['unfavorable', 'adverse', 'detrimental', 'inadequate'],
    casual: ['rough', 'lousy', 'crummy', 'not great'],
    stronger: ['terrible', 'dreadful', 'abysmal', 'atrocious'],
    simpler: ['poor', 'weak', 'wrong', 'not good'],
  },
  happy: {
    professional: ['pleased', 'gratified', 'content', 'fulfilled'],
    casual: ['glad', 'stoked', 'thrilled', 'pumped'],
    stronger: ['elated', 'euphoric', 'overjoyed', 'ecstatic'],
    simpler: ['glad', 'cheerful', 'joyful', 'delighted'],
  },
  sad: {
    professional: ['disheartened', 'dismayed', 'despondent', 'discontented'],
    casual: ['bummed', 'down', 'blue', 'low'],
    stronger: ['devastated', 'heartbroken', 'miserable', 'grief-stricken'],
    simpler: ['unhappy', 'upset', 'gloomy', 'sorrowful'],
  },
  big: {
    professional: ['substantial', 'significant', 'considerable', 'extensive'],
    casual: ['huge', 'massive', 'giant', 'enormous'],
    stronger: ['colossal', 'monumental', 'immense', 'vast'],
    simpler: ['large', 'sizable', 'broad', 'wide'],
  },
  small: {
    professional: ['minimal', 'modest', 'compact', 'diminutive'],
    casual: ['tiny', 'little', 'mini', 'itty-bitty'],
    stronger: ['minuscule', 'microscopic', 'infinitesimal', 'negligible'],
    simpler: ['little', 'slight', 'minor', 'short'],
  },
  important: {
    professional: ['significant', 'critical', 'paramount', 'pivotal'],
    casual: ['key', 'major', 'big deal', 'crucial'],
    stronger: ['vital', 'essential', 'indispensable', 'imperative'],
    simpler: ['needed', 'main', 'chief', 'central'],
  },
  fast: {
    professional: ['expedient', 'swift', 'efficient', 'prompt'],
    casual: ['quick', 'speedy', 'snappy', 'zippy'],
    stronger: ['rapid', 'lightning-fast', 'instantaneous', 'breakneck'],
    simpler: ['quick', 'hasty', 'brisk', 'hurried'],
  },
  help: {
    professional: ['assist', 'facilitate', 'support', 'aid'],
    casual: ['lend a hand', 'pitch in', 'back up', 'give a hand'],
    stronger: ['empower', 'bolster', 'champion', 'fortify'],
    simpler: ['aid', 'guide', 'serve', 'back'],
  },
  think: {
    professional: ['consider', 'evaluate', 'assess', 'contemplate'],
    casual: ['figure', 'reckon', 'guess', 'suppose'],
    stronger: ['analyze', 'deliberate', 'reason', 'examine'],
    simpler: ['believe', 'feel', 'suppose', 'expect'],
  },
  said: {
    professional: ['stated', 'indicated', 'remarked', 'noted'],
    casual: ['mentioned', 'told', 'went', 'shared'],
    stronger: ['declared', 'asserted', 'proclaimed', 'affirmed'],
    simpler: ['spoke', 'talked', 'told', 'replied'],
  },
  nice: {
    professional: ['agreeable', 'pleasant', 'courteous', 'admirable'],
    casual: ['cool', 'sweet', 'lovely', 'neat'],
    stronger: ['magnificent', 'splendid', 'exquisite', 'delightful'],
    simpler: ['kind', 'good', 'fine', 'warm'],
  },
  difficult: {
    professional: ['challenging', 'complex', 'demanding', 'rigorous'],
    casual: ['tough', 'hard', 'tricky', 'rough'],
    stronger: ['formidable', 'arduous', 'grueling', 'strenuous'],
    simpler: ['hard', 'tough', 'not easy', 'rough'],
  },
  easy: {
    professional: ['straightforward', 'manageable', 'uncomplicated', 'attainable'],
    casual: ['simple', 'no-brainer', 'a breeze', 'piece of cake'],
    stronger: ['effortless', 'elementary', 'trivial', 'painless'],
    simpler: ['simple', 'clear', 'plain', 'basic'],
  },
  beautiful: {
    professional: ['elegant', 'refined', 'exquisite', 'aesthetic'],
    casual: ['gorgeous', 'stunning', 'pretty', 'lovely'],
    stronger: ['breathtaking', 'magnificent', 'resplendent', 'sublime'],
    simpler: ['pretty', 'nice', 'attractive', 'pleasing'],
  },
  interesting: {
    professional: ['compelling', 'noteworthy', 'engaging', 'intriguing'],
    casual: ['cool', 'neat', 'fun', 'fascinating'],
    stronger: ['captivating', 'riveting', 'enthralling', 'absorbing'],
    simpler: ['fun', 'curious', 'appealing', 'lively'],
  },
  problem: {
    professional: ['issue', 'concern', 'matter', 'challenge'],
    casual: ['snag', 'hiccup', 'glitch', 'hassle'],
    stronger: ['crisis', 'dilemma', 'obstacle', 'predicament'],
    simpler: ['trouble', 'issue', 'worry', 'setback'],
  },
  show: {
    professional: ['demonstrate', 'present', 'illustrate', 'exhibit'],
    casual: ['point out', 'display', 'highlight', 'flash'],
    stronger: ['reveal', 'manifest', 'expose', 'unveil'],
    simpler: ['let see', 'display', 'give', 'present'],
  },
  make: {
    professional: ['produce', 'construct', 'develop', 'establish'],
    casual: ['put together', 'whip up', 'build', 'craft'],
    stronger: ['forge', 'fabricate', 'engineer', 'generate'],
    simpler: ['build', 'do', 'form', 'create'],
  },
  change: {
    professional: ['modify', 'adjust', 'revise', 'amend'],
    casual: ['switch up', 'shake up', 'tweak', 'flip'],
    stronger: ['transform', 'overhaul', 'revolutionize', 'restructure'],
    simpler: ['alter', 'shift', 'update', 'fix'],
  },
};

// ── Apply helpers ──────────────────────────────────────────────

function applyRuleList(text, rules) {
  let result = text;
  for (const rule of rules) {
    result = result.replace(rule.pattern, rule.replacement);
  }
  return result;
}

function applyMappingList(text, mappings) {
  let result = text;
  for (const { from, to } of mappings) {
    result = result.replace(from, to);
  }
  return result;
}

function fixSpelling(text) {
  let result = text;
  for (const [wrong, right] of Object.entries(spellingMap)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      // Preserve original capitalisation of first letter
      if (match[0] === match[0].toUpperCase()) {
        return right.charAt(0).toUpperCase() + right.slice(1);
      }
      return right;
    });
  }
  return result;
}

function capitalizeFirstLetter(text) {
  return text.replace(/^(\s*)([a-z])/, (m, ws, ch) => `${ws}${ch.toUpperCase()}`);
}

// ── Public API ─────────────────────────────────────────────────

export function fixGrammar(text) {
  let result = text;
  result = fixSpelling(result);
  result = applyRuleList(result, grammarRules);
  result = applyRuleList(result, punctuationRules);
  result = result.replace(repeatedWordRule.pattern, repeatedWordRule.replacement);
  result = capitalizeFirstLetter(result);
  return result;
}

export function improveWriting(text) {
  let result = fixGrammar(text);
  result = applyMappingList(result, simplificationMap);
  result = capitalizeFirstLetter(result);
  return result;
}

export function replaceWords(text) {
  // Swap common weak/overused words for slightly stronger alternatives
  const weakWords = [
    { from: /\bgood\b/gi, to: 'excellent' },
    { from: /\bbad\b/gi, to: 'poor' },
    { from: /\bbig\b/gi, to: 'substantial' },
    { from: /\bsmall\b/gi, to: 'compact' },
    { from: /\bnice\b/gi, to: 'pleasant' },
    { from: /\bhappy\b/gi, to: 'delighted' },
    { from: /\bsad\b/gi, to: 'disheartened' },
    { from: /\bvery\b/gi, to: 'highly' },
    { from: /\breally\b/gi, to: 'truly' },
    { from: /\bthing\b/gi, to: 'element' },
    { from: /\bthings\b/gi, to: 'elements' },
    { from: /\bget\b/gi, to: 'obtain' },
    { from: /\bgot\b/gi, to: 'obtained' },
    { from: /\bmake\b/gi, to: 'create' },
    { from: /\bshow\b/gi, to: 'demonstrate' },
    { from: /\bhelp\b/gi, to: 'assist' },
  ];
  let result = text;
  result = applyMappingList(result, weakWords);
  result = applyRuleList(result, punctuationRules);
  return result;
}

export function simplifyText(text) {
  let result = text;
  result = applyMappingList(result, simplificationMap);
  result = applyRuleList(result, punctuationRules);
  result = capitalizeFirstLetter(result);
  return result;
}

export function professionalTone(text) {
  let result = fixGrammar(text);
  result = applyMappingList(result, professionalToneMap);
  result = capitalizeFirstLetter(result);
  return result;
}

export function casualTone(text) {
  let result = text;
  result = applyMappingList(result, casualToneMap);
  result = applyRuleList(result, punctuationRules);
  result = capitalizeFirstLetter(result);
  return result;
}

export function shortenText(text) {
  let result = text;
  result = applyMappingList(result, shorteningMap);
  // Clean up double-spaces introduced by removal
  result = result.replace(/\s{2,}/g, ' ').trim();
  result = capitalizeFirstLetter(result);
  return result;
}

export function getWordAlternatives(word) {
  const key = word.toLowerCase().trim();
  return wordAlternatives[key] || null;
}

export const CONTRACTIONS = [
  { from: /\bwon['’]t\b/gi, to: 'will not' },
  { from: /\bcan['’]t\b/gi, to: 'cannot' },
  { from: /\bshan['’]t\b/gi, to: 'shall not' },
  { from: /\blet['’]s\b/gi, to: 'let us' },
  { from: /\bain['’]t\b/gi, to: 'is not' },
  { from: /\bdon['’]t\b/gi, to: 'do not' },
  { from: /\bdoesn['’]t\b/gi, to: 'does not' },
  { from: /\bdidn['’]t\b/gi, to: 'did not' },
  { from: /\bisn['’]t\b/gi, to: 'is not' },
  { from: /\baren['’]t\b/gi, to: 'are not' },
  { from: /\bwasn['’]t\b/gi, to: 'was not' },
  { from: /\bweren['’]t\b/gi, to: 'were not' },
  { from: /\bhaven['’]t\b/gi, to: 'have not' },
  { from: /\bhasn['’]t\b/gi, to: 'has not' },
  { from: /\bhadn['’]t\b/gi, to: 'had not' },
  { from: /\bwouldn['’]t\b/gi, to: 'would not' },
  { from: /\bshouldn['’]t\b/gi, to: 'should not' },
  { from: /\bcouldn['’]t\b/gi, to: 'could not' },
  { from: /\b(they|we|you)['’]re\b/gi, to: '$1 are' },
  { from: /\b(i|they|we|you)['’]ve\b/gi, to: '$1 have' },
  { from: /\b(i|he|she|it|they|we|you)['’]ll\b/gi, to: '$1 will' },
  { from: /\b(i|he|she|it|they|we|you)['’]d\b/gi, to: '$1 would' },
  { from: /\bi['’]m\b/gi, to: 'I am' },
  { from: /\bit['’]s\b/gi, to: 'it is' },
  { from: /\bthat['’]s\b/gi, to: 'that is' },
  { from: /\bthere['’]s\b/gi, to: 'there is' },
];

export function expandContractions(text) {
  let result = text;
  result = applyMappingList(result, CONTRACTIONS);
  result = capitalizeFirstLetter(result);
  return result;
}

/**
 * Extracts citations matching common academic formats
 */
export function extractCitations(text) {
  if (!text) return [];
  const bracketMatches = text.match(/\[\d+(?:[-, ]+\d+)*\]/g) || [];
  const authorYearMatches =
    text.match(/\(\s*[A-Za-z&,\-.\s]+(?:et al\.\s*)?,?\s*(?:19|20)\d{2}[a-z]?(?:,\s*(?:pp?\.?\s*\d+(?:[–-]\d+)?))?(?:;\s*[A-Za-z&,\-.\s]+(?:et al\.\s*)?,?\s*(?:19|20)\d{2}[a-z]?(?:,\s*(?:pp?\.?\s*\d+(?:[–-]\d+)?))?)*\s*\)/g) || [];
  const doiMatches = text.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/g) || [];
  return [...new Set([...bracketMatches, ...authorYearMatches, ...doiMatches])];
}

/**
 * Masks citations with unique index placeholders
 */
export function maskCitationsWithPlaceholders(text) {
  if (!text) return { text: '', mapping: {} };
  const citations = extractCitations(text);
  if (citations.length === 0) return { text, mapping: {} };

  const mapping = {};
  let masked = text;
  citations.forEach((cit, idx) => {
    const placeholder = `[[REF_${idx + 1}]]`;
    mapping[placeholder] = cit;
    masked = masked.split(cit).join(placeholder);
  });
  return { text: masked, mapping };
}

/**
 * Restores original citations from placeholder tokens
 */
export function unmaskCitationsFromPlaceholders(text, mapping) {
  if (!text || !mapping || Object.keys(mapping).length === 0) return text;
  let restored = text;
  for (const [placeholder, originalCitation] of Object.entries(mapping)) {
    restored = restored.split(placeholder).join(originalCitation);
  }
  return restored;
}

/**
 * Extract granular, non-overlapping rule-based grammar and spelling correction spans
 * from source text for instant zero-latency feedback and offline fallback.
 */
export function extractRuleBasedGrammarSpans(text) {
  if (!text || typeof text !== 'string') return [];
  const rawSpans = [];

  // 1. Spelling checks
  for (const [wrong, right] of Object.entries(spellingMap)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    let m;
    while ((m = regex.exec(text)) !== null) {
      const original = m[0];
      const replacement =
        original[0] === original[0].toUpperCase()
          ? right.charAt(0).toUpperCase() + right.slice(1)
          : right;
      rawSpans.push({
        original,
        replacement,
        explanation: `Spelling correction for "${original}"`,
        type: 'spelling',
        startIndex: m.index,
        endIndex: m.index + original.length,
      });
    }
  }

  // 2. Grammar rules
  for (const rule of grammarRules) {
    const regex = new RegExp(
      rule.pattern.source,
      rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g'
    );
    let m;
    while ((m = regex.exec(text)) !== null) {
      const original = m[0];
      let replacement = '';
      if (typeof rule.replacement === 'function') {
        replacement = rule.replacement(original, m[1], m[2]);
      } else {
        replacement = original.replace(rule.pattern, rule.replacement);
      }
      if (replacement && replacement !== original) {
        rawSpans.push({
          original,
          replacement,
          explanation: `Grammar rule: "${original}" → "${replacement}"`,
          type: 'grammar',
          startIndex: m.index,
          endIndex: m.index + original.length,
        });
      }
    }
  }

  // 3. Repeated word detector
  const repRegex = new RegExp(repeatedWordRule.pattern.source, 'gi');
  let rm;
  while ((rm = repRegex.exec(text)) !== null) {
    const original = rm[0];
    const replacement = rm[1];
    rawSpans.push({
      original,
      replacement,
      explanation: 'Repeated word removal',
      type: 'grammar',
      startIndex: rm.index,
      endIndex: rm.index + original.length,
    });
  }

  // Sort by start index and eliminate overlapping spans
  rawSpans.sort((a, b) => a.startIndex - b.startIndex);
  const nonOverlapping = [];
  let lastEnd = -1;
  for (const span of rawSpans) {
    if (span.startIndex >= lastEnd) {
      nonOverlapping.push(span);
      lastEnd = span.endIndex;
    }
  }

  return nonOverlapping;
}

export const EXAMPLE_TEXT = `I am writing this email to tell you that I cannot come to the meeting because I have some important work to do. Their is alot of stuff I gotta finish before tommorrow. I should of started earlier but I was real busy with other things. In order to make sure everything is done on time, I will need to work late. I hope you understand and I will definately try to attend the next one. It would be a good idea to reschedule if their are other people who can not make it. Thanks for your understanding, I recieve your message and will respond as soon as possible.`;
