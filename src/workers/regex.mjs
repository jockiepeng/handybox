export function evaluateRegex({pattern,flags='',input='',replacement=''}) {
  if(pattern.length>1000||input.length>200000||replacement.length>10000)throw new Error('正则或文本过大 | Pattern or text exceeds the limit');
  const regex=new RegExp(pattern,flags),matches=[];let match;
  while((match=regex.exec(input))!==null) {
    matches.push({text:match[0],index:match.index,groups:match.slice(1),named:match.groups||{}});
    if(!regex.global||matches.length>=1000)break;
    if(match[0]==='') {const point=input.codePointAt(regex.lastIndex);regex.lastIndex+=((regex.unicode||regex.unicodeSets)&&point>65535)?2:1;}
  }
  let outputSize=input.length;
  const replaced=input.replace(new RegExp(pattern,flags),(...args)=>{
    const named=typeof args.at(-1)==='object'?args.pop():null;
    const source=args.pop(),offset=args.pop(),full=args[0],captures=args.slice(1);
    const token=/\$(\$|&|`|'|<[^>]*>|\d{1,2})/g,chunks=[];let last=0,size=0,m;
    const append=value=>{size+=value.length;if(size>4_000_000)throw new Error('替换输出过大（上限 400 万字符） | Replacement output exceeds 4 million characters');chunks.push(value);};
    while((m=token.exec(replacement))){append(replacement.slice(last,m.index));const key=m[1];let text=m[0];
      if(key==='$')text='$';else if(key==='&')text=full;else if(key==='`')text=source.slice(0,offset);else if(key==="'")text=source.slice(offset+full.length);
      else if(key[0]==='<'){if(named)text=named[key.slice(1,-1)]??'';}
      else {let n=+key;if(n>0&&n<=captures.length)text=captures[n-1]??'';else if(key.length===2&&+key[0]>0&&+key[0]<=captures.length)text=(captures[+key[0]-1]??'')+key[1];}
      append(text);last=token.lastIndex;
    }
    append(replacement.slice(last));outputSize+=size-full.length;if(outputSize>4_000_000)throw new Error('替换输出过大（上限 400 万字符） | Replacement output exceeds 4 million characters');return chunks.join('');
  });
  return {matches,truncated:matches.length>=1000,replaced};
}
if(typeof self!=='undefined'&&typeof self.postMessage==='function') self.onmessage=({data})=>{try{self.postMessage({result:evaluateRegex(data)});}catch(error){self.postMessage({error:error.message});}};
