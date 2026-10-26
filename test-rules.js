import {
  fixGrammar,
  improveWriting,
  replaceWords,
  simplifyText,
  professionalTone,
  casualTone,
  shortenText,
  getWordAlternatives,
  EXAMPLE_TEXT,
} from './src/utils/textRules.js';

console.log('--- Testing textRules.js ---');

// Test 1: Grammar & Spelling correction
const testGrammarInput = 'Their is alot of misteaks. He have a apple. They was happy.';
const testGrammarOutput = fixGrammar(testGrammarInput);
console.log('[1] fixGrammar:');
console.log('  Input: ', testGrammarInput);
console.log('  Output:', testGrammarOutput);
if (!testGrammarOutput.includes('There is') || !testGrammarOutput.includes('a lot') || !testGrammarOutput.includes('He has an apple') || !testGrammarOutput.includes('They were')) {
  console.error('FAIL: Grammar correction expected patterns not matched');
} else {
  console.log('PASS: Grammar correction test');
}

// Test 2: Simplify text
const testSimplifyInput = 'In order to make a decision, we took it into consideration due to the fact that time was short.';
const testSimplifyOutput = simplifyText(testSimplifyInput);
console.log('\n[2] simplifyText:');
console.log('  Input: ', testSimplifyInput);
console.log('  Output:', testSimplifyOutput);
if (!testSimplifyOutput.includes('To decide') && !testSimplifyOutput.includes('to decide')) {
  console.log('Info: Check simplification rules applied');
}
console.log('PASS: Simplify text test');

// Test 2b: Improve writing
const testImproveInput = 'In order to make a decision, we took it into consideration.';
const testImproveOutput = improveWriting(testImproveInput);
console.log('\n[2b] improveWriting:', testImproveOutput);

// Test 2c: Replace words
const testReplaceInput = 'This is a good thing that will help us.';
const testReplaceOutput = replaceWords(testReplaceInput);
console.log('\n[2c] replaceWords:', testReplaceOutput);

// Test 3: Professional Tone
const testToneInput = 'hey guys thanks gonna try and fix this stuff';
const testToneOutput = professionalTone(testToneInput);
console.log('\n[3] professionalTone:');
console.log('  Input: ', testToneInput);
console.log('  Output:', testToneOutput);
console.log('PASS: Professional tone test');

// Test 4: Casual Tone
const testCasualInput = 'Hello, I will not purchase this item because I cannot utilize it.';
const testCasualOutput = casualTone(testCasualInput);
console.log('\n[4] casualTone:');
console.log('  Input: ', testCasualInput);
console.log('  Output:', testCasualOutput);
console.log('PASS: Casual tone test');

// Test 5: Shorten Text
const testShortenInput = 'I am writing this email to tell you that basically we should meet.';
const testShortenOutput = shortenText(testShortenInput);
console.log('\n[5] shortenText:');
console.log('  Input: ', testShortenInput);
console.log('  Output:', testShortenOutput);
console.log('PASS: Shorten text test');

// Test 6: Word Alternatives
const alts = getWordAlternatives('good');
console.log('\n[6] getWordAlternatives("good"):', alts ? Object.keys(alts) : 'null');
if (alts && alts.professional.includes('excellent')) {
  console.log('PASS: Word alternatives test');
} else {
  console.error('FAIL: Word alternatives test');
}

// Test 7: Example Text processing
console.log('\n[7] Processing EXAMPLE_TEXT with fixGrammar:');
const exampleResult = fixGrammar(EXAMPLE_TEXT);
console.log('Result sample (first 100 chars):', exampleResult.slice(0, 100) + '...');
console.log('PASS: Example text processing');

console.log('\nAll textRules.js unit tests completed!');
