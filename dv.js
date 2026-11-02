// Module xem bảng giá riêng. Mọi chữ hiển thị (nhãn, tiêu đề) do máy chủ gửi
// sau khi đăng nhập; chỉ tài khoản được cấp quyền mới có dữ liệu.
(function(){
  var URL_GAS='https://script.google.com/macros/s/AKfycbyrO8symCYOkWsGG0nRWPF7gpndC3mzEVUk15UvWrA0O81ZUumW-kX_gEOZhtCJ34bMVQ/exec';
  var rows=[], nhan='', tai=false, loc={q:'',qc:'',men:''}, moRoi=false;
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function vnd(n){ return (n||0).toLocaleString('vi-VN')+'đ'; }
  function phien(){ var s=checkSession(); return (s&&s.dl)?s:null; }

  function manChuyen(txt){
    var m=document.createElement('div');
    m.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(192,35,42,.94);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-weight:800;font-size:18px';
    m.innerHTML='<div style="width:38px;height:38px;border:4px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:dvq .8s linear infinite"></div><div>'+txt+'</div><style>@keyframes dvq{to{transform:rotate(360deg)}}</style>';
    document.body.appendChild(m);
  }
  function doiKenh(bat){
    try{ if(bat) sessionStorage.removeItem('dt_ban_rieng'); else sessionStorage.setItem('dt_ban_rieng','1'); }catch(x){}
    manChuyen(bat?'Đang về kênh đại lý…':'Đang chuyển sang '+nhan+'…');
    setTimeout(function(){ location.reload(); },60);
  }
  window.dvInit=function(){
    ['dv-chip','dv-bar','dv-menu-item'].forEach(function(id){ var o=document.getElementById(id); if(o) o.remove(); });
    var s=phien(); if(!s) return;
    nhan=s.dl;
    var t=document.querySelector('.topbar-title'); if(!t) return;
    var bat=laBanRieng(), duocDoi=!s.rg;
    // 1. Nhãn cạnh tên app (máy tính / điện thoại rộng)
    var chip=document.createElement('span');
    chip.id='dv-chip'; chip.textContent=bat?'↩ Đại lý':nhan;
    chip.setAttribute('role','button');
    chip.style.cssText='display:inline-block;margin-left:8px;padding:2px 10px;border-radius:12px;background:'+(bat?'#FFD54F':'#fff')+';color:'+(bat?'#5D4037':'#C0232A')+';font-size:12px;font-weight:800;font-style:normal;vertical-align:middle;cursor:'+(duocDoi?'pointer':'default');
    if(duocDoi) chip.onclick=function(e){ e.stopPropagation(); doiKenh(bat); };
    t.appendChild(chip);
    if(!duocDoi) return;
    // 2. Mục trong menu tài khoản (luôn thấy được trên điện thoại)
    var menu=document.getElementById('menu-taikhoan');
    if(menu){
      var it=document.createElement('button');
      it.type='button'; it.id='dv-menu-item'; it.className='acct-menu-item';
      it.innerHTML='<span class="acct-menu-icon">'+(bat?'↩':'🔀')+'</span> '+(bat?'Về kênh đại lý':'Chuyển sang '+esc(nhan));
      it.onclick=function(){ if(window.toggleMenuTaiKhoan) toggleMenuTaiKhoan(); doiKenh(bat); };
      menu.insertBefore(it,menu.firstChild);
    }
    // 3. Dải thông báo khi đang xem kênh riêng: có nút quay về to, rõ
    if(bat){
      var tb=document.querySelector('.topbar');
      if(tb&&tb.parentNode){
        var bar=document.createElement('div');
        bar.id='dv-bar';
        bar.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;background:#FFF3CD;border-bottom:1px solid #FFD54F;padding:7px 12px;font-size:13px;color:#5D4037;font-weight:700';
        bar.innerHTML='<span>Đang xem kênh '+esc(nhan)+'</span>';
        var b=document.createElement('button');
        b.type='button'; b.textContent='↩ Về kênh đại lý';
        b.style.cssText='background:#C0232A;color:#fff;border:0;border-radius:14px;padding:6px 12px;font-size:13px;font-weight:800;white-space:nowrap';
        b.onclick=function(){ doiKenh(true); };
        bar.appendChild(b);
        tb.parentNode.insertBefore(bar,tb.nextSibling);
      }
    }
  };

  function tai_(cb){
    if(tai){ cb(); return; }
    var s=phien(); if(!s) return;
    var name='_dv_'+Date.now(), sc=document.createElement('script');
    window[name]=function(res){
      delete window[name]; if(sc.parentNode) sc.parentNode.removeChild(sc);
      if(res && res.status==='ok'){ rows=res.data||[]; nhan=res.label||nhan; tai=true; cb(); }
      else khung('<div style="padding:30px;text-align:center;color:#666">Không tải được bảng giá. Đăng xuất rồi đăng nhập lại thử nhé.</div>');
    };
    sc.onerror=function(){ khung('<div style="padding:30px;text-align:center;color:#666">Mất kết nối, thử lại sau.</div>'); };
    sc.src=URL_GAS+'?action=getGiaDuAn&k='+encodeURIComponent(APP_KEY)+'&t='+encodeURIComponent(s.token||'')+'&callback='+name;
    document.head.appendChild(sc);
  }

  function khung(noiDung){
    var ov=document.getElementById('dv-ov');
    if(!ov){
      ov=document.createElement('div'); ov.id='dv-ov';
      ov.style.cssText='position:fixed;inset:0;z-index:9000;background:#F4F5F7;display:flex;flex-direction:column;font-family:inherit';
      document.body.appendChild(ov);
    }
    ov.innerHTML='<div style="background:#C0232A;color:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px">'
      +'<div style="font-weight:900;font-size:17px;flex:1">'+esc(nhan)+' · Đồng Tâm</div>'
      +'<button type="button" onclick="dvDong()" style="background:rgba(255,255,255,.2);color:#fff;border:0;border-radius:8px;padding:6px 12px;font-weight:700;font-size:14px">Đóng</button></div>'
      +'<div id="dv-body" style="flex:1;overflow:auto;-webkit-overflow-scrolling:touch">'+noiDung+'</div>';
  }
  window.dvDong=function(){ var ov=document.getElementById('dv-ov'); if(ov) ov.remove(); };

  window.dvMo=function(){
    khung('<div style="padding:30px;text-align:center;color:#666">⏳ Đang tải...</div>');
    tai_(ve);
  };

  function uniq(k){ var o={}; rows.forEach(function(r){ if(r[k]) o[r[k]]=1; }); return Object.keys(o).sort(); }
  function chipLoc(k,val,ds){
    return '<button type="button" onclick="dvLoc(\''+k+'\',\''+esc(val)+'\')" style="border:1px solid '+(loc[k]===val?'#C0232A':'#ccc')+';background:'+(loc[k]===val?'#C0232A':'#fff')+';color:'+(loc[k]===val?'#fff':'#333')+';border-radius:16px;padding:5px 12px;font-size:13px;font-weight:700;white-space:nowrap">'+esc(ds||val)+'</button>';
  }
  window.dvLoc=function(k,v){ loc[k]=(loc[k]===v)?'':v; ve(); };
  window.dvTim=function(v){ loc.q=v; veDS(); };

  function ve(){
    var h='<div style="padding:10px 12px;background:#fff;position:sticky;top:0;z-index:2;border-bottom:1px solid #e5e5e5">'
      +'<input id="dv-q" type="search" placeholder="Tìm mã (vd 3060MNDA001)" value="'+esc(loc.q)+'" oninput="dvTim(this.value)" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #ccc;border-radius:10px;font-size:16px">'
      +'<div style="display:flex;gap:6px;overflow-x:auto;margin-top:8px;padding-bottom:2px">'
      +uniq('qc').map(function(v){return chipLoc('qc',v);}).join('')
      +uniq('men').map(function(v){return chipLoc('men',v);}).join('')
      +'</div></div><div id="dv-ds" style="padding:10px 12px;display:grid;gap:10px"></div>';
    var b=document.getElementById('dv-body'); if(b) b.innerHTML=h;
    veDS();
  }

  function veDS(){
    var q=loc.q.trim().toLowerCase();
    var ds=rows.filter(function(r){
      return (!q||r.ma.toLowerCase().indexOf(q)>=0) && (!loc.qc||r.qc===loc.qc) && (!loc.men||r.men===loc.men);
    });
    var el=document.getElementById('dv-ds'); if(!el) return;
    if(!ds.length){ el.innerHTML='<div style="text-align:center;color:#888;padding:30px">Không có mã phù hợp</div>'; return; }
    el.innerHTML=ds.map(function(r,i){
      var img=''; try{ var a=timAnh(r.ma); if(a) img=Array.isArray(a)?a[0]:a; }catch(e){}
      return '<div style="background:#fff;border-radius:12px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.08)">'
        +'<div style="display:flex;gap:10px;align-items:center">'
        +(img?'<img src="'+esc(img)+'" loading="lazy" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0">':'')
        +'<div style="min-width:0"><div style="font-weight:900;font-size:16px">'+esc(r.ma)+'</div>'
        +'<div style="color:#666;font-size:13px">'+esc(r.qc)+' · '+esc(r.men)+(r.loai?' · '+esc(r.loai):'')+'</div></div></div>'
        +'<div style="display:flex;gap:8px;margin-top:10px">'
        +'<div style="flex:1;background:#FFF4F4;border-radius:8px;padding:8px"><div style="font-size:12px;color:#888">Giá / m²</div><div style="font-weight:900;font-size:17px;color:#C0232A">'+vnd(r.m2)+'</div></div>'
        +'<div style="flex:1;background:#FFF4F4;border-radius:8px;padding:8px"><div style="font-size:12px;color:#888">Giá / thùng'+(r.m2thung?' ('+r.m2thung+' m²)':'')+'</div><div style="font-weight:900;font-size:17px;color:#C0232A">'+vnd(r.thung)+'</div></div></div>'
        +'<div style="margin-top:8px;display:flex;gap:8px;align-items:center;font-size:14px">'
        +'<input type="number" inputmode="decimal" min="0" placeholder="Nhập m²" oninput="dvTinh('+i+',this)" data-ma="'+esc(r.ma)+'" style="width:100px;padding:7px;border:1px solid #ccc;border-radius:8px;font-size:15px">'
        +'<span id="dv-kq-'+i+'" style="color:#333"></span></div></div>';
    }).join('');
    el._ds=ds;
  }

  window.dvTinh=function(i,inp){
    var el=document.getElementById('dv-ds'); var r=el&&el._ds&&el._ds[i]; var kq=document.getElementById('dv-kq-'+i);
    if(!r||!kq) return;
    var m2=parseFloat(String(inp.value).replace(',','.'))||0;
    if(!m2||!r.m2thung){ kq.textContent=''; return; }
    var th=Math.ceil(m2/r.m2thung-1e-9);
    kq.innerHTML='= <b>'+th+' thùng</b> ('+(th*r.m2thung).toFixed(2)+' m²) · <b>'+vnd(th*r.thung)+'</b>';
  };
  try{ window.dvInit(); }catch(e){}
})();
