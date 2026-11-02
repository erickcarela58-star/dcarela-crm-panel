(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DcarelaMosaicos=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Marcos completos sin superposición. La foto se contiene dentro, nunca se
  // estira/recorta para fabricar una distribución. No cambia archivos originales.
  const r=v=>Math.round(v*1000)/1000;
  const frame=(x,y,w,h,z)=>({marco:{x:r(x),y:r(y),w:r(w),h:r(h)},z,rotacion:0,radio:0,borde:null,sombra:0,ajuste:'completa'});
  function catalogo(n,aspecto=1){
    if(!Number.isInteger(n)||n<2||n>9||!Number.isFinite(aspecto)||aspecto<=0)return [];
    const out=[],seen=new Set();
    const add=(id,nombre,familia,frames)=>{
      if(frames.length!==n)return;
      // Principal al frente sin superposición; el orden de las originales no cambia.
      frames.forEach((f,i)=>{f.z=i?i-1:n;});
      const signature=JSON.stringify(frames.map(f=>f.marco));if(seen.has(signature))return;seen.add(signature);
      out.push({id:'m253-'+id,nombre,familia,ajuste:'completa',marcos:frames});
    };
    function rows(counts,margin,gap,weights){
      const total=weights?.reduce((a,b)=>a+b,0)||counts.length,H=100-2*margin-gap*(counts.length-1);let y=margin,z=0;
      return counts.flatMap((count,i)=>{const h=H*(weights?.[i]||1)/total,w=(100-2*margin-gap*(count-1))/count,a=Array.from({length:count},(_,j)=>frame(margin+j*(w+gap),y,w,h,z++));y+=h+gap;return a;});
    }
    const mirror=(frames,axis)=>frames.map(f=>{const m=f.marco;return frame(axis==='x'?100-m.x-m.w:m.x,axis==='y'?100-m.y-m.h:m.y,m.w,m.h,f.z);});
    const transpose=frames=>frames.map(f=>frame(f.marco.y,f.marco.x,f.marco.h,f.marco.w,f.z));
    // Rejillas equilibradas y secuencias: una sola foto por casilla.
    for(const [margin,gap,label,suffix] of [[0,0,'A sangre','sangre'],[2,1.2,'Línea fina','linea'],[5,2,'Paspartú','paspartu']]){
      for(let cols=1;cols<=Math.min(4,n);cols++){
        const nr=Math.ceil(n/cols),counts=Array.from({length:nr},(_,i)=>Math.floor(n/nr)+(i<n%nr?1:0));
        const a=rows(counts,margin,gap);add('rejilla-'+suffix+'-'+cols,label+' · '+cols+(cols===1?' columna':' columnas'),'Rejillas',a);
        add('rejilla-'+suffix+'-'+cols+'-vertical',label+' · bandas verticales '+cols,'Rejillas',transpose(a));
      }
    }
    // Bloque principal y mosaico de apoyo, con balance y posición elegibles.
    for(const [ratio,label] of [[55,'Protagonista'],[70,'Gran retrato'],[40,'Equilibrio']]){
      for(const [margin,gap,finish] of [[0,1,'limpio'],[4,2,'aire']]){
        const extent=100-2*margin,hero=(extent-gap)*ratio/100,side=extent-gap-hero,remaining=n-1,cols=Math.min(remaining,2),nr=Math.ceil(remaining/cols);
        const heroFrame=frame(margin,margin,hero,extent,n),support=[];let p=0;
        for(let row=0;row<nr;row++){
          const count=Math.min(cols,remaining-p),w=(side-gap*(count-1))/count,h=(extent-gap*(nr-1))/nr;
          for(let col=0;col<count;col++,p++)support.push(frame(margin+hero+gap+col*(w+gap),margin+row*(h+gap),w,h,p));
        }
        const a=[heroFrame,...support];
        add('principal-'+ratio+'-'+finish+'-izquierda',label+' · izquierda · '+finish,'Destacadas',a);
        add('principal-'+ratio+'-'+finish+'-derecha',label+' · derecha · '+finish,'Destacadas',mirror(a,'x'));
        add('principal-'+ratio+'-'+finish+'-arriba',label+' · arriba · '+finish,'Destacadas',transpose(a));
        add('principal-'+ratio+'-'+finish+'-abajo',label+' · abajo · '+finish,'Destacadas',mirror(transpose(a),'y'));
      }
    }
    // Ritmos de álbum: líneas desiguales que mantienen las fotos completas.
    for(const first of [1,2,3]){
      if(first>=n)continue;
      const counts=[first,n-first];
      for(const [weight,label] of [[1,'Díptico'],[1.6,'Ritmo editorial'],[2.4,'Doble página']]){
        const a=rows(counts,3,1.5,[weight,1]);add('album-'+first+'-'+weight,label+' · '+first+' arriba','Álbum',a);
        add('album-'+first+'-'+weight+'-columna',label+' · '+first+' a un lado','Álbum',transpose(a));
      }
    }
    // Primera página variada: no esconder las composiciones de álbum detrás
    // de todas las variaciones de rejilla. Misma geometría/IDs, solo curaduría.
    const groups=['Destacadas','Álbum','Rejillas'].map(name=>out.filter(d=>d.familia===name)),ordered=[];
    for(let i=0;groups.some(g=>i<g.length);i++)for(const group of groups)if(group[i])ordered.push(group[i]);
    return ordered;
  }
  return {catalogo};
});
