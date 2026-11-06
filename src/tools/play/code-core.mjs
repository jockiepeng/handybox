import Prism from 'prismjs';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-typescript.js';

export function prepareCode(text){
  const normalized=String(text).replace(/\r\n|\r/g,'\n').replace(/\t/g,'  ');
  if(normalized.length>12000)throw new Error('Use at most 12,000 characters');
  if(normalized.split('\n').length>200)throw new Error('Use at most 200 lines');
  return normalized;
}

export function highlightCode(text,language){
  const grammar=Prism.languages[language];
  if(!grammar||language==='plain')return [{text,type:'plain'}];
  const output=[];
  function flatten(items,type='plain'){
    for(const token of Array.isArray(items)?items:[items]){
      if(typeof token==='string')output.push({text:token,type});
      else flatten(token.content,token.type);
    }
  }
  flatten(Prism.tokenize(text,grammar));return output;
}

export function wrapTokens(tokens,maxWidth,measure){
  const rows=[{tokens:[],number:1}];let width=0,line=1;
  const segmenter=new Intl.Segmenter(undefined,{granularity:'grapheme'});
  for(const token of tokens){
    for(const {segment} of segmenter.segment(token.text)){
      if(segment==='\n'){rows.push({tokens:[],number:++line});width=0;continue;}
      const size=measure(segment);
      if(width>0&&width+size>maxWidth){rows.push({tokens:[],number:null});width=0;}
      const row=rows.at(-1),last=row.tokens.at(-1);
      if(last?.type===token.type)last.text+=segment;else row.tokens.push({text:segment,type:token.type});
      width+=size;
    }
  }
  return rows;
}
