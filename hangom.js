// ===== HÀNG ĐẠI LÝ ÔM (chỉ nhân viên + admin) =====
// Hàng Đồng Tâm đã bán cho đại lý / sale nhưng họ chưa bán ra được. Hiện RIÊNG cạnh tồn kho Đồng Tâm,
// KHÔNG cộng vào tồn kho. Sale đăng -> "Chờ duyệt" -> admin duyệt mới hiện cho người khác.
// Máy chủ chỉ trả dữ liệu này cho role admin/nv (khách, dự án, chưa đăng nhập đều bị chặn ở máy chủ).
var HO={rows:[], admin:false, loaded:false, dm:null, han:30};
var HO_URL='https://script.google.com/macros/s/AKfycbyrO8symCYOkWsGG0nRWPF7gpndC3mzEVUk15UvWrA0O81ZUumW-kX_gEOZhtCJ34bMVQ/exec';
var _hoMa=null, _hoSua=null;

function hoDuocDung(){
  var s=checkSession();
  return !!(s && (s.role==='admin'||s.role==='nv') && !(typeof laBanRieng==='function'&&laBanRieng()));
}
// Khách hàng (tài khoản đại lý) chỉ ĐIỀN thông tin hàng mình ôm + xem/sửa bài của chính mình.
// Họ KHÔNG thấy hàng ôm của ai khác, không thấy dòng "Đại lý ôm" trên danh sách - việc kết nối
// giữa các đại lý chỉ nhân viên làm. (Máy chủ cũng chỉ trả bài của chính họ.)
function hoLaKhach(){ var s=checkSession(); return !!(s && s.role==='khachhang'); }
function hoDuocGhi(){ return hoDuocDung()||hoLaKhach(); }
function hoEsc(s){ return String(s===null||s===undefined?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function hoGoi(params, cb){
  var name='_ho'+Date.now()+Math.floor(Math.random()*1000), xong=false, s=document.createElement('script');
  function ket(r){ if(xong) return; xong=true; try{ delete window[name]; }catch(e){ window[name]=undefined; } if(s.parentNode) s.parentNode.removeChild(s); cb(r); }
  window[name]=ket;
  var q=Object.keys(params).map(function(k){ return k+'='+encodeURIComponent(params[k]); }).join('&');
  s.src=HO_URL+'?'+q+'&k='+encodeURIComponent(APP_KEY)+'&t='+encodeURIComponent(authTok())+'&callback='+name;
  s.onerror=function(){ ket({status:'error', msg:'Không kết nối được máy chủ'}); };
  document.head.appendChild(s);
  setTimeout(function(){ ket({status:'error', msg:'Máy chủ phản hồi quá lâu, thử lại sau'}); }, 30000);
}
function hoTai(cb){
  if(!hoDuocGhi()){ if(cb) cb(); return; }
  hoGoi({action:'getHangOm'}, function(r){
    if(r && r.status==='ok'){
      var doi=JSON.stringify(r.data)!==JSON.stringify(HO.rows);
      HO.rows=r.data||[]; HO.admin=!!r.admin; HO.han=r.hanNgay||30; HO.loaded=true;
      hoChenMenu();
      if(doi){ try{ if(typeof render==='function') render(); if(typeof renderSale==='function') renderSale(); }catch(e){} }
    }
    if(cb) cb(r);
  });
}
function hoTaiDanhMuc(cb){
  if(HO.dm){ cb(HO.dm); return; }
  hoGoi({action:'getDanhMucDaiLy'}, function(r){
    HO.dm=(r&&r.status==='ok')?r:{daiLy:[], sale:[]};
    cb(HO.dm);
  });
}
function hoKhoiDong(){ if(hoDuocGhi()) hoTai(); }

// ----- Dữ liệu theo mã -----
function hoNorm(m){ return String(m||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,''); }
function hoDong(ma){ var n=hoNorm(ma); return HO.rows.filter(function(r){ return hoNorm(r.ma)===n && r.tt==='Đã duyệt' && !r.hetHan; }); }
function hoTong(ma){
  var t={thung:0, vien:0, n:0};
  hoDong(ma).forEach(function(r){ t.thung+=r.thung; t.vien+=r.vien; t.n++; });
  return t;
}
function hoSL(thung, vien){
  var p=[]; if(thung>0) p.push(Math.round(thung).toLocaleString('vi-VN')+' thùng'); if(vien>0) p.push(Math.round(vien).toLocaleString('vi-VN')+' viên lẻ');
  return p.join(' + ')||'0';
}
// ----- Tính giá bán từ % giảm trên giá lẻ -----
function hoPct(txt){ var m=String(txt||'').match(/(\d+(?:[.,]\d+)?)\s*%/); return m?parseFloat(m[1].replace(',','.')):0; }
function hoGiaBan(ma, pct){
  var p=(typeof DATA!=='undefined')?DATA.filter(function(x){ return x&&hoNorm(x.ma)===hoNorm(ma); })[0]:null;
  if(!p||!(p.le>0)||!(pct>0)||pct>=100) return null;
  var m2=p.le*(1-pct/100), qc=(typeof getQuyCach==='function')?getQuyCach(p.kc,p.cat):null;
  var o={le:p.le, pct:pct, m2:Math.round(m2)};
  if(qc&&qc.m2>0){ o.thung=Math.round(m2*qc.m2); if(qc.vien>0) o.vien=Math.round(m2*qc.m2/qc.vien); }
  return o;
}
function hoFmt(n){ return Math.round(n).toLocaleString('vi-VN')+'đ'; }
function hoHtmlGia(ma, giamTxt){
  var g=hoGiaBan(ma, hoPct(giamTxt)); if(!g) return '';
  return '<div style="background:#2E7D3212;border:1px solid #2E7D3244;border-radius:8px;padding:7px 10px;margin:6px 0;font-size:13px;color:#1B5E20;line-height:1.55">'
    +'💰 Giá bán (giảm '+g.pct+'% giá lẻ): <b>'+hoFmt(g.m2)+'/m²</b>'+(g.thung?' · <b>'+hoFmt(g.thung)+'/thùng</b>':'')+(g.vien?' · '+hoFmt(g.vien)+'/viên':'')
    +'<br><span style="font-size:11px;color:#558B2F">Giá lẻ trên app: '+hoFmt(g.le)+'/m²</span></div>';
}
// Dòng nhỏ hiện dưới số tồn kho Đồng Tâm trên thẻ sản phẩm
function htmlHangOm(ma, px){
  if(!hoDuocDung()) return '';
  var t=hoTong(ma); if(!t.n) return '';
  return '<div onclick="event.stopPropagation();moHangOm(\''+String(ma).replace(/'/g,"\\'")+'\')" title="Hàng đại lý đang ôm, chưa bán ra" '
    +'style="font-size:'+(px||11)+'px;font-weight:700;color:#6A1B9A;margin-top:2px;cursor:pointer">🏬 Đại lý ôm: '+hoSL(t.thung,t.vien)+(t.n>1?' · '+t.n+' nơi':'')+'</div>';
}
// Khối trong cửa sổ "Tồn kho theo kho/lô" (cạnh tồn kho Đồng Tâm)
function htmlHangOmBlock(ma){
  if(!hoDuocDung()) return '';
  var t=hoTong(ma);
  return '<div style="border:1.5px solid #6A1B9A44;background:#6A1B9A0d;border-radius:12px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">'
    +'<div><div style="font-size:12px;color:#6A1B9A;font-weight:700">🏬 Tồn kho đại lý đang ôm (không tính vào tồn kho Đồng Tâm)</div>'
    +'<div style="font-size:15px;font-weight:800;color:#6A1B9A;margin-top:2px">'+(t.n?hoSL(t.thung,t.vien)+(t.n>1?' · '+t.n+' nơi':''):'Chưa có')+'</div></div>'
    +'<button type="button" onclick="moHangOm(\''+String(ma).replace(/'/g,"\\'")+'\')" style="border:1.5px solid #6A1B9A;color:#6A1B9A;background:#fff;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">Xem / đăng</button></div>';
}
function hoCapNhatNutDP(ma){
  var b=document.getElementById('dp-ho-btn'); if(!b) return;
  if(hoLaKhach()){ b.style.display=''; b.textContent='📮 Báo hàng đại lý đang ôm'; return; }
  if(!hoDuocDung()){ b.style.display='none'; return; }
  var t=hoTong(ma);
  b.style.display='';
  b.textContent='🏬 Hàng đại lý ôm'+(t.n?' ('+hoSL(t.thung,t.vien)+')':'');
}

// ----- Cửa sổ danh sách -----
var HO_TT_MAU={'Chờ duyệt':'#E65100','Đã duyệt':'#2E7D32','Từ chối':'#C62828','Đã bán hết':'#757575'};
function hoNgay(iso){ var d=new Date(iso); return isNaN(d)?'':d.toLocaleDateString('vi-VN'); }
function hoLienHe(t){
  var m=String(t||'').match(/0[\d .]{8,12}\d/);
  if(!m) return hoEsc(t);
  var so=m[0].replace(/\D/g,'');
  return hoEsc(t).replace(hoEsc(m[0]), '<a href="tel:'+so+'" style="color:#1565C0;font-weight:700">'+hoEsc(m[0])+'</a>');
}
function hoDongHtml(r){
  var mau=HO_TT_MAU[r.tt]||'#555';
  var nut=function(txt,fn,c){ return '<button type="button" onclick="'+fn+'" style="border:1.5px solid '+c+';color:'+c+';background:#fff;border-radius:8px;padding:5px 10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">'+txt+'</button>'; };
  var id=hoEsc(r.id), acts='';
  if(r.own||HO.admin){
    acts+=nut('✏️ Sửa','hoMoForm(\''+id+'\')','#555');
    if(r.tt!=='Đã bán hết') acts+=nut('✅ Đã bán hết','hoDoiTT(\''+id+'\',\'banhet\')','#2E7D32');
    if(r.tt==='Đã duyệt') acts+=nut('🔄 Gia hạn','hoDoiTT(\''+id+'\',\'giahan\')','#1565C0');
    acts+=nut('🗑 Xóa','hoXoa(\''+id+'\')','#C62828');
  }
  if(HO.admin&&r.tt==='Chờ duyệt') acts=nut('✅ Duyệt','hoDoiTT(\''+id+'\',\'duyet\')','#2E7D32')+nut('✖ Từ chối','hoDoiTT(\''+id+'\',\'tuchoi\')','#C62828')+acts;
  return '<div style="border:1px solid var(--bd,#eee);border-radius:12px;padding:10px 12px;margin-bottom:8px">'
    +'<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">'
    +'<div style="font-size:13px;font-weight:800">'+hoEsc(r.daiLy)+'</div>'
    +'<span style="font-size:10px;font-weight:700;color:'+mau+';border:1px solid '+mau+';border-radius:999px;padding:1px 8px;white-space:nowrap">'+hoEsc(r.tt)+(r.hetHan&&r.tt==='Đã duyệt'?' · hết hạn':'')+'</span></div>'
    +'<div style="font-size:16px;font-weight:800;color:#6A1B9A;margin:3px 0">'+hoSL(r.thung,r.vien)+'</div>'
    +'<div style="font-size:12px;color:var(--t2,#666);line-height:1.6">'
    +(r.sale?'Sale phụ trách: <b>'+hoEsc(r.sale)+'</b><br>':'')
    +(r.lo?'Số lô: <b>'+hoEsc(r.lo)+'</b><br>':'')
    +(r.giam?'Giá/giảm: <b>'+hoEsc(r.giam)+'</b><br>':'')
    +'</div>'+hoHtmlGia(r.ma, r.giam)
    +'<div style="font-size:12px;color:var(--t2,#666);line-height:1.6">'
    +(r.lienHe?'Liên hệ: '+hoLienHe(r.lienHe)+'<br>':'')
    +(r.ghiChu?'Ghi chú: '+hoEsc(r.ghiChu)+'<br>':'')
    +'<span style="color:#999">Đăng bởi '+hoEsc(r.nguoi)+' · cập nhật '+hoNgay(r.ngayCN)+'</span></div>'
    +(acts?'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">'+acts+'</div>':'')
    +'</div>';
}
function hoDongModal(){ var m=document.getElementById('modal-hang-om'); if(m) m.remove(); }
function hoKhung(tieuDe, noiDung, chan){
  hoDongModal();
  var phone=((window.innerWidth||0)<600), full=phone&&!!chan;
  var m=document.createElement('div'); m.id='modal-hang-om';
  m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:'+(full?'stretch':'center')+';justify-content:center;padding:'+(full?'0':'16px');
  var box='background:var(--bg1,#fff);display:flex;flex-direction:column;width:100%;'+(full?'height:100%':'max-width:480px;max-height:92vh;border-radius:14px');
  m.innerHTML='<div style="'+box+'">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px 10px;border-bottom:1px solid var(--bd,#eee)">'
    +'<p style="font-size:15px;font-weight:700;margin:0;line-height:1.3">'+tieuDe+'</p>'
    +'<button onclick="hoDongModal()" aria-label="Đóng" style="border:none;background:none;font-size:26px;cursor:pointer;line-height:1;padding:0 4px">×</button></div>'
    +'<div id="ho-cuon" style="flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:6px 16px 14px">'+noiDung+'</div>'
    +(chan?'<div style="padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--bd,#eee);background:var(--bg1,#fff)">'+chan+'</div>':'')
    +'</div>';
  m.addEventListener('click',function(e){ if(e.target===m && !full) hoDongModal(); });
  document.body.appendChild(m);
}
function moHangOm(ma){
  if(hoLaKhach()) return moHangOmKhach(ma);
  if(!hoDuocDung()) return;
  _hoMa=ma;
  var n=hoNorm(ma);
  var rows=HO.rows.filter(function(r){ return hoNorm(r.ma)===n; });
  rows.sort(function(a,b){ return (a.tt==='Đã duyệt'&&!a.hetHan?0:1)-(b.tt==='Đã duyệt'&&!b.hetHan?0:1); });
  var t=hoTong(ma);
  hoKhung('🏬 Hàng đại lý ôm — '+hoEsc(ma),
    '<p style="font-size:11px;color:#888;margin:0 0 10px">Hàng Đồng Tâm đã bán cho đại lý nhưng chưa bán ra được. <b>Không tính vào tồn kho Đồng Tâm.</b> Tự ẩn sau '+HO.han+' ngày không cập nhật.</p>'
    +(t.n?'<div style="background:#6A1B9A0d;border-radius:10px;padding:8px 12px;margin-bottom:10px;font-size:13px;font-weight:800;color:#6A1B9A">Tổng đại lý đang ôm: '+hoSL(t.thung,t.vien)+'</div>':'')
    +(rows.length?rows.map(hoDongHtml).join(''):'<p style="font-size:13px;color:#888;text-align:center;padding:14px 0">Chưa có đại lý nào đăng ôm mã này.</p>')
    +'<button type="button" onclick="hoMoForm()" style="width:100%;margin-top:4px;padding:11px;border:none;border-radius:10px;background:#6A1B9A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">➕ Đăng hàng đại lý ôm</button>'
    +(HO.admin?'':'<p style="font-size:11px;color:#888;margin:8px 0 0;text-align:center">Bài đăng của anh/chị hiện sau khi admin duyệt.</p>'));
}

// Khách hàng: chỉ thấy bài của chính mình cho mã này + nút báo hàng ôm
function moHangOmKhach(ma){
  _hoMa=ma;
  var n=hoNorm(ma);
  var rows=HO.rows.filter(function(r){ return hoNorm(r.ma)===n; });
  hoKhung('📮 Báo hàng đại lý đang ôm — '+hoEsc(ma),
    '<p style="font-size:12px;color:#666;margin:0 0 10px;line-height:1.5">Anh/chị đang còn hàng mã này chưa bán ra được? Điền thông tin để nhân viên Đồng Tâm hỗ trợ kết nối. Thông tin chỉ <b>nhân viên Đồng Tâm</b> xem được, sau khi được duyệt.</p>'
    +(rows.length?'<div style="font-size:12px;font-weight:700;margin:0 0 6px">Bài anh/chị đã gửi</div>'+rows.map(hoDongHtml).join(''):'')
    +'<button type="button" onclick="hoMoForm()" style="width:100%;margin-top:4px;padding:11px;border:none;border-radius:10px;background:#6A1B9A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">➕ Báo hàng đang ôm</button>');
}

// ----- Form đăng / sửa -----
function hoMoForm(id){
  if(!hoDuocGhi()) return;
  var kh=hoLaKhach();
  var r=null; if(id){ r=HO.rows.filter(function(x){ return x.id===id; })[0]||null; }
  _hoSua=r;
  var ma=r?r.ma:_hoMa;
  _hoMa=ma;
  // Khách hàng: không tải danh mục đại lý/sale (máy chủ không trả cho khách), không thấy lô Đồng Tâm
  (kh?function(cb){ cb({daiLy:[],sale:[]}); }:hoTaiDanhMuc)(function(dm){
    var tk=(!kh&&typeof timTonKho==='function')?timTonKho(ma):null;
    var dsLo=(tk&&typeof gomLoTheoMa==='function')?gomLoTheoMa(tk):[];
    var pct0=r?hoPct(r.giam):0;
    var giamRieng0=r?String(r.giam||'').replace(/Giảm\s*[\d.,]+\s*%\s*giá lẻ\s*·?\s*/i,'').trim():'';
    if(pct0 && giamRieng0 && hoPct(giamRieng0)===pct0) giamRieng0=''; // tránh lặp khi sửa bài cũ ghi tay
    var loHienTai=r?r.lo:'';
    var loTrongDS=dsLo.some(function(x){ return String(x.so_lo)===loHienTai; });
    // Chữ 16px: dưới 16px thì iPhone tự phóng to khi chạm vào ô, rất khó dùng
    var inp='width:100%;box-sizing:border-box;padding:11px 12px;min-height:48px;border:1.5px solid var(--bd2,#ccc);border-radius:10px;font-size:16px;font-family:inherit;background:#fff;color:inherit';
    var lb=function(t){ return '<label style="display:block;font-size:13px;font-weight:700;margin:16px 0 6px">'+t+'</label>'; };
    var nho=function(t){ return ' <span style="font-weight:400;color:#888">'+t+'</span>'; };
    // Ô chọn trong danh sách + "Khác - gõ tên" (ô chọn dùng tốt trên điện thoại hơn ô gõ-gợi ý)
    function chon(idc, ds, cur, trong0){
      if(!ds.length) return '<input id="'+idc+'" placeholder="Gõ tên" value="'+hoEsc(cur)+'" style="'+inp+'">';
      var coTrong=ds.indexOf(cur)>=0, khac=!!cur&&!coTrong;
      return '<select id="'+idc+'-sel" onchange="hoDoiChon(\''+idc+'\')" style="'+inp+'"><option value="">'+trong0+'</option>'
        +ds.map(function(x){ return '<option value="'+hoEsc(x)+'"'+(x===cur?' selected':'')+'>'+hoEsc(x)+'</option>'; }).join('')
        +'<option value="__khac"'+(khac?' selected':'')+'>Khác — gõ tên</option></select>'
        +'<input id="'+idc+'" placeholder="Gõ tên" value="'+(khac?hoEsc(cur):'')+'" style="'+inp+';margin-top:8px;display:'+(khac?'block':'none')+'">';
    }
    function buoc(idb, nhan, val){
      var bt='width:52px;flex-shrink:0;border:1.5px solid #6A1B9A;color:#6A1B9A;background:#fff;font-size:24px;font-weight:700;cursor:pointer;font-family:inherit;min-height:48px;';
      return '<div style="flex:1;min-width:0">'+lb(nhan)
        +'<div style="display:flex"><button type="button" onclick="hoBuoc(\''+idb+'\',-1)" aria-label="Giảm" style="'+bt+'border-radius:10px 0 0 10px">−</button>'
        +'<input id="'+idb+'" type="number" inputmode="numeric" min="0" step="1" placeholder="0" value="'+val+'" style="'+inp+';text-align:center;border-radius:0;border-left:none;border-right:none;min-width:0">'
        +'<button type="button" onclick="hoBuoc(\''+idb+'\',1)" aria-label="Tăng" style="'+bt+'border-radius:0 10px 10px 0">+</button></div></div>';
    }
    var loHtml;
    if(dsLo.length){
      loHtml=lb('Số lô'+nho('(lô Đồng Tâm đang còn, hoặc nhập tay)'))
        +'<select id="ho-lo-sel" onchange="hoDoiLo()" style="'+inp+'"><option value="">— Không rõ số lô —</option>'
        +dsLo.map(function(x){ return '<option value="'+hoEsc(x.so_lo)+'"'+(loTrongDS&&String(x.so_lo)===loHienTai?' selected':'')+'>Lô '+hoEsc(x.so_lo||'–')+(x.mau?' · màu '+hoEsc(x.mau):'')+' (Đồng Tâm còn '+Math.round(x.tong)+')</option>'; }).join('')
        +'<option value="__khac"'+(loHienTai&&!loTrongDS?' selected':'')+'>Khác — nhập số lô khác</option></select>'
        +'<input id="ho-lo" placeholder="Nhập số lô" value="'+(loHienTai&&!loTrongDS?hoEsc(loHienTai):'')+'" style="'+inp+';margin-top:8px;display:'+(loHienTai&&!loTrongDS?'block':'none')+'">';
    } else {
      loHtml=lb('Số lô'+nho(kh?'(nếu có, in trên thùng hàng)':'(Đồng Tâm hết lô này, nhập tay)'))
        +'<input id="ho-lo" placeholder="Nhập số lô" value="'+hoEsc(loHienTai)+'" style="'+inp+'">';
    }
    var coThem=!!(giamRieng0||(r&&r.ghiChu));
    var daiLyDS=(dm.daiLy||[]).map(function(d){ return d.ten; }), saleDS=dm.sale||[];
    var noiDung=
      (kh
        ?'<div style="font-size:13px;color:#555;background:#6A1B9A0d;border-radius:10px;padding:10px 12px;margin-top:8px;line-height:1.5">Bài được gửi dưới tên <b>tài khoản đại lý của anh/chị</b> và chỉ nhân viên Đồng Tâm xem được sau khi duyệt.</div>'
        :lb('Đại lý đang ôm *')+chon('ho-dl', daiLyDS, r?r.daiLy:'', '— Chọn đại lý —')
          +lb('Sale phụ trách')+chon('ho-sale', saleDS, r?r.sale:'', '— Chọn sale —'))
      +'<div style="display:flex;gap:10px">'+buoc('ho-thung','Số thùng',(r&&r.thung?r.thung:''))+buoc('ho-vien','Viên lẻ',(r&&r.vien?r.vien:''))+'</div>'
      +loHtml
      +lb('Giảm bao nhiêu % trên giá lẻ'+nho('(app tự tính giá bán)'))
      +'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input id="ho-pct" type="number" inputmode="decimal" min="0" max="95" step="any" placeholder="VD: 40" oninput="hoXemGia()" value="'+(pct0||'')+'" style="'+inp+';width:100px">'
      +[10,15,20,30,40].map(function(v){ return '<button type="button" onclick="document.getElementById(\'ho-pct\').value='+v+';hoXemGia()" style="border:1.5px solid #6A1B9A;color:#6A1B9A;background:#fff;border-radius:999px;padding:0 14px;min-height:44px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">'+v+'%</button>'; }).join('')+'</div>'
      +'<div id="ho-xemgia"></div>'
      +lb('Thông tin liên hệ'+nho('(tên + số điện thoại)'))
      +'<input id="ho-lh" type="text" inputmode="tel" maxlength="120" value="'+hoEsc(r?r.lienHe:'')+'" style="'+inp+'">'
      +'<details'+(coThem?' open':'')+' style="margin-top:16px"><summary style="font-size:13px;font-weight:700;color:#6A1B9A;cursor:pointer;padding:8px 0">＋ Thêm giá khác, ghi chú (không bắt buộc)</summary>'
      +lb('Giá khác / ghi chú giá'+nho('(VD: giá chốt 180.000đ/m²)'))
      +'<input id="ho-giam" maxlength="60" value="'+hoEsc(giamRieng0)+'" style="'+inp+'">'
      +lb('Ghi chú')
      +'<textarea id="ho-gc" maxlength="300" rows="3" style="'+inp+'">'+hoEsc(r?r.ghiChu:'')+'</textarea></details>'
      +'<div id="ho-loi" style="color:#C62828;font-size:13px;margin-top:10px;min-height:18px"></div>';
    var chan='<div style="display:flex;gap:10px">'
      +'<button type="button" onclick="moHangOm(_hoMa)" style="flex:1;min-height:50px;border:1.5px solid var(--bd2,#ccc);border-radius:12px;background:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">Quay lại</button>'
      +'<button type="button" id="ho-luu" onclick="hoLuu()" style="flex:2;min-height:50px;border:none;border-radius:12px;background:#6A1B9A;color:#fff;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit">'+(HO.admin?'Lưu':'Gửi duyệt')+'</button></div>';
    hoKhung((kh?(r?'✏️ Sửa bài báo hàng ôm':'📮 Báo hàng đang ôm'):(r?'✏️ Sửa hàng ôm':'➕ Đăng hàng đại lý ôm'))+' — '+hoEsc(ma), noiDung, chan);
    hoXemGia();
  });
}
// +/- cho số thùng, viên lẻ (gõ số trên điện thoại hay bị lỗi, bấm dễ hơn)
function hoBuoc(idb, d){
  var e=document.getElementById(idb); if(!e) return;
  var v=Math.max(0,(parseInt(e.value,10)||0)+d); e.value=v?v:'';
}
// Ô chọn đại lý/sale: chọn "Khác" thì hiện ô gõ tên; chọn đại lý thì tự điền sale + liên hệ nếu đang trống
function hoDoiChon(idc){
  var sel=document.getElementById(idc+'-sel'), inp=document.getElementById(idc);
  if(sel&&inp) inp.style.display=(sel.value==='__khac')?'block':'none';
  if(idc==='ho-dl'){
    var v=sel?sel.value:'', d=((HO.dm&&HO.dm.daiLy)||[]).filter(function(x){ return x.ten===v; })[0];
    if(!d) return;
    var ss=document.getElementById('ho-sale-sel'), lh=document.getElementById('ho-lh');
    if(ss&&!ss.value&&d.sale&&[].some.call(ss.options,function(o){ return o.value===d.sale; })) ss.value=d.sale;
    if(lh&&!lh.value&&d.sdt) lh.value=d.sdt;
  }
}
function hoGiaTriChon(idc){
  var sel=document.getElementById(idc+'-sel'), inp=document.getElementById(idc);
  if(sel && sel.value!=='__khac') return sel.value;
  return inp?inp.value.trim():'';
}
function hoXemGia(){
  var e=document.getElementById('ho-xemgia'); if(!e) return;
  var p=parseFloat(String((document.getElementById('ho-pct')||{}).value||'').replace(',','.'));
  e.innerHTML=(p>0)?(hoHtmlGia(_hoMa, 'Giảm '+p+'% giá lẻ')||'<div style="font-size:11px;color:#E65100;margin-top:4px">Mã này chưa có giá lẻ nên chưa tính được giá bán.</div>'):'';
}
function hoDoiLo(){
  var sel=document.getElementById('ho-lo-sel'), inp=document.getElementById('ho-lo');
  if(sel&&inp) inp.style.display=(sel.value==='__khac')?'block':'none';
}
function hoLuu(){
  var g=function(id){ var e=document.getElementById(id); return e?e.value.trim():''; };
  var loi=document.getElementById('ho-loi'), btn=document.getElementById('ho-luu');
  var sel=document.getElementById('ho-lo-sel'), lo;
  if(sel) lo=(sel.value==='__khac')?g('ho-lo'):sel.value; else lo=g('ho-lo');
  var pct=parseFloat(g('ho-pct').replace(',','.'))||0;
  if(pct<0||pct>=100){ loi.textContent='% giảm phải từ 0 đến dưới 100.'; return; }
  var giam=(pct>0?'Giảm '+pct+'% giá lẻ':'')+((pct>0&&g('ho-giam'))?' · ':'')+g('ho-giam');
  var d={id:_hoSua?_hoSua.id:'', ma:_hoSua?_hoSua.ma:_hoMa, daiLy:hoGiaTriChon('ho-dl'), sale:hoGiaTriChon('ho-sale'), thung:g('ho-thung'), vien:g('ho-vien'), lo:lo, giam:giam.substring(0,80), lienHe:g('ho-lh'), ghiChu:g('ho-gc')};
  if(!d.daiLy && !hoLaKhach()){ loi.textContent='Chưa chọn đại lý đang ôm hàng.'; return; }
  if(!(Number(d.thung)>0)&&!(Number(d.vien)>0)){ loi.textContent='Nhập số thùng hoặc số viên lẻ.'; return; }
  loi.textContent=''; btn.disabled=true; btn.textContent='Đang gửi...';
  hoGoi({action:'luuHangOm', data:JSON.stringify(d)}, function(r){
    if(r&&r.status==='ok'){
      showToast(r.tt==='Chờ duyệt'?(hoLaKhach()?'✅ Đã gửi — nhân viên Đồng Tâm sẽ xem và liên hệ lại':'✅ Đã gửi — chờ admin duyệt mới hiện cho mọi người'):'✅ Đã lưu');
      hoTai(function(){ moHangOm(d.ma); });
    } else { btn.disabled=false; btn.textContent=HO.admin?'Lưu':'Gửi duyệt'; loi.textContent=(r&&r.msg)||'Không lưu được, thử lại.'; }
  });
}
function hoDoiTT(id, hanh, sauKhi){
  hoGoi({action:'doiTrangThaiHangOm', id:id, hanh:hanh}, function(r){
    if(r&&r.status==='ok'){
      var ten={duyet:'Đã duyệt', tuchoi:'Đã từ chối', banhet:'Đã đánh dấu bán hết', giahan:'Đã gia hạn '+HO.han+' ngày', xoa:'Đã xóa'}[hanh]||'Xong';
      showToast('✅ '+ten);
      hoTai(function(){ if(document.getElementById('modal-hang-om-duyet')) moDuyetHangOm(); else if(_hoMa) moHangOm(_hoMa); });
    } else showToast('⚠️ '+((r&&r.msg)||'Không thực hiện được'));
  });
}
function hoXoa(id){ if(confirm('Xóa dòng này khỏi danh sách hàng đại lý ôm?')) hoDoiTT(id,'xoa'); }

// ----- Admin: danh sách chờ duyệt (mọi mã) -----
function hoChenMenu(){
  var cu=document.getElementById('ho-menu-item'); if(cu) cu.remove();
  if(!hoDuocDung()||!HO.admin) return;
  var menu=document.getElementById('menu-taikhoan'); if(!menu) return;
  var n=HO.rows.filter(function(r){ return r.tt==='Chờ duyệt'; }).length;
  var it=document.createElement('button');
  it.type='button'; it.id='ho-menu-item'; it.className='acct-menu-item';
  it.innerHTML='<span class="acct-menu-icon">🏬</span> Duyệt hàng đại lý ôm'+(n?' ('+n+')':'');
  it.onclick=function(){ if(window.toggleMenuTaiKhoan) toggleMenuTaiKhoan(); moDuyetHangOm(); };
  menu.insertBefore(it, menu.firstChild);
}
function moDuyetHangOm(){
  if(!hoDuocDung()||!HO.admin) return;
  _hoMa=null;
  var ds=HO.rows.filter(function(r){ return r.tt==='Chờ duyệt'; });
  hoKhung('🏬 Hàng đại lý ôm chờ duyệt ('+ds.length+')',
    (ds.length?ds.map(function(r){ return '<div style="font-size:12px;font-weight:800;color:#C0232A;margin:0 0 3px">Mã '+hoEsc(r.ma)+'</div>'+hoDongHtml(r); }).join('')
      :'<p style="font-size:13px;color:#888;text-align:center;padding:16px 0">Không có bài nào chờ duyệt.</p>'));
  var m=document.getElementById('modal-hang-om'); if(m) m.id='modal-hang-om'; // giữ id chung
  var flag=document.createElement('span'); flag.id='modal-hang-om-duyet'; flag.style.display='none'; m.appendChild(flag);
}
