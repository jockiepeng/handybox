const dialog=document.getElementById('principles-dialog');
const opener=document.getElementById('principles-open');
const closer=document.getElementById('principles-close');

if(dialog&&opener&&closer){
  opener.addEventListener('click',()=>{
    if(dialog.open)return;
    dialog.showModal();
    dialog.scrollTop=0;
    opener.setAttribute('aria-expanded','true');
    document.body.classList.add('principles-visible');
  });
  closer.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    opener.setAttribute('aria-expanded','false');
    document.body.classList.remove('principles-visible');
    opener.focus({preventScroll:true});
  });
  const outside=event=>{
    const box=dialog.getBoundingClientRect();
    return event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom;
  };
  let backdropStart=false;
  dialog.addEventListener('pointerdown',event=>{backdropStart=event.target===dialog&&outside(event);});
  dialog.addEventListener('click',event=>{if(backdropStart&&event.target===dialog&&outside(event))dialog.close();backdropStart=false;});
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=[...dialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(node=>!node.disabled&&!node.hidden);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
}
