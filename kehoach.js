// ===== KẾ HOẠCH NHẬP KHO / HÀNG SẮP VỀ =====
// Dữ liệu từ tab "KeHoachNhap" (Sheet phụ), nối với sản phẩm theo MÃ SAP (p.sap).
// Nhân viên + admin: thấy số lượng kế hoạch, đã nhập, nhà máy, lịch nhập.
// Khách hàng/đại lý: CHỈ thấy thời gian dự kiến (máy chủ không gửi số lượng cho họ).
// Người chưa đăng nhập: không có dữ liệu (máy chủ trả need_login).
var KH={bySap:{}, nv:false, ngay:'', loaded:false};

function khDuocDung(){
  var s=checkSession();
  return !!s && !(typeof laBanRieng==='function'&&laBanRieng());
}
function khTai(){
  if(!khDuocDung()||typeof hoGoi!=='function') return;
  hoGoi({action:'getKeHoachNhap'}, function(r){
    if(!r||r.status!=='ok') return;
    var by={};
    (r.data||[]).forEach(function(x){ (by[String(x.sap)]=by[String(x.sap)]||[]).push(x); });
    Object.keys(by).forEach(function(k){ by[k].sort(function(a,b){ return String(a.tu).localeCompare(String(b.tu)); }); });
    var doi=JSON.stringify(by)!==JSON.stringify(KH.bySap);
    KH.bySap=by; KH.nv=!!r.nv; KH.ngay=r.ngay||''; KH.loaded=true;
    if(doi){ try{ if(typeof render==='function') render(); if(typeof renderSale==='function') renderSale(); }catch(e){} }
  });
}
function khKhoiDong(){ khTai(); }

function khHomNay(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
function khCongNgay(iso,n){ var p=iso.split('-'), d=new Date(+p[0],+p[1]-1,+p[2]+n); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
function khDM(iso){ var p=String(iso||'').split('-'); return p.length===3?p[2]+'/'+p[1]:''; }
function khKhoang(r){ return (r.tu&&r.den&&r.tu!==r.den)?khDM(r.tu)+' – '+khDM(r.den):khDM(r.tu||r.den); }
function khSo(n){ return Math.round(n).toLocaleString('vi-VN'); }
// sap: đang nhập kho (trong khoảng ngày) | sap: sắp về | quahan: đã qua dự kiến
function khTrangThai(r){
  var hn=khHomNay();
  if(hn<r.tu) return 'sap';
  if(hn<=r.den) return 'dang';
  return 'quahan';
}
// Các đợt còn hiệu lực của 1 mã SAP: bỏ đợt đã qua dự kiến hơn 7 ngày; khách không thấy đợt "quá hạn"
function khCacDot(sap){
  var hn=khHomNay(), gioiHan=khCongNgay(hn,-7);
  return (KH.bySap[String(sap)]||[]).filter(function(r){
    if(r.den<gioiHan) return false;
    if(!KH.nv && khTrangThai(r)==='quahan') return false;
    return true;
  });
}
function khDotChinh(ds){
  var uuTien={dang:0,sap:1,quahan:2};
  return ds.slice().sort(function(a,b){ return uuTien[khTrangThai(a)]-uuTien[khTrangThai(b)] || String(a.tu).localeCompare(String(b.tu)); })[0];
}

// Dòng nhỏ dưới tồn kho trên thẻ sản phẩm
function htmlKeHoach(p, px){
  if(!KH.loaded||!p||!checkSession()) return '';
  var sap=p.sap;
  if(!sap&&typeof DATA!=='undefined'){ var q=DATA.filter(function(x){ return x&&x.ma===p.ma; })[0]; sap=q&&q.sap; } // thẻ tab Sale không có sẵn sap
  if(!sap) return '';
  var ds=khCacDot(sap); if(!ds.length) return '';
  var r=khDotChinh(ds), tt=khTrangThai(r);
  var hetHang=(typeof tonKhoLoaded!=='undefined'&&tonKhoLoaded&&typeof tonKhoTongCuaMa==='function'&&tonKhoTongCuaMa(p.ma)<=0);
  var txt, mau;
  if(KH.nv){
    var sl=(r.sl>0?khSo(r.sl)+' thùng · ':'');
    txt=(hetHang?'Hết hàng — sắp về ':(tt==='dang'?'Đang nhập kho ':(tt==='quahan'?'Đã qua dự kiến nhập ':'Sắp về ')))+sl+khKhoang(r);
  } else {
    txt=(hetHang?'Hết hàng — dự kiến có hàng ':'Dự kiến nhập kho ')+khKhoang(r);
  }
  if(ds.length>1) txt+=' · +'+(ds.length-1)+' đợt';
  mau=hetHang?'#E65100':(tt==='quahan'?'#999':'#1565C0');
  return '<div style="font-size:'+(px||11)+'px;font-weight:700;color:'+mau+';margin-top:2px;line-height:1.35">🚚 '+txt+'</div>';
}

// Khối chi tiết trong cửa sổ "Tồn kho theo kho/lô"
function htmlKeHoachBlock(ma){
  if(!KH.loaded||!checkSession()) return '';
  var p=(typeof DATA!=='undefined')?DATA.filter(function(x){ return x&&x.ma===ma; })[0]:null;
  if(!p||!p.sap) return '';
  var ds=khCacDot(p.sap); if(!ds.length) return '';
  var chip={dang:['Đang nhập kho','#2E7D32'],sap:['Sắp về','#1565C0'],quahan:['Đã qua dự kiến','#999']};
  var dong=ds.map(function(r){
    var tt=khTrangThai(r), c=chip[tt];
    return '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:7px 0;border-top:1px solid #1565C022">'
      +'<div><div style="font-size:14px;font-weight:800;color:#0D47A1">'+khKhoang(r)+'</div>'
      +(KH.nv?'<div style="font-size:12px;color:var(--t2,#666);margin-top:1px">'+(r.sl>0?'Kế hoạch <b>'+khSo(r.sl)+' thùng</b>':'')+(r.nm?' · '+r.nm:'')+(r.daNhap>0?' · đã nhập '+khSo(r.daNhap):'')+'</div>':'')+'</div>'
      +'<span style="font-size:11px;font-weight:700;color:'+c[1]+';border:1px solid '+c[1]+';border-radius:999px;padding:1px 9px;white-space:nowrap">'+c[0]+'</span></div>';
  }).join('');
  return '<div style="border:1.5px solid #1565C044;background:#1565C00d;border-radius:12px;padding:10px 14px;margin-bottom:10px">'
    +'<div style="font-size:12px;color:#1565C0;font-weight:700;margin-bottom:2px">🚚 Kế hoạch nhập kho — hàng sắp về</div>'
    +dong
    +'<div style="font-size:10px;color:#888;margin-top:4px">'+(KH.ngay?'Số liệu đến '+khDM(KH.ngay)+'/'+KH.ngay.slice(0,4)+'. ':'')+'Lịch dự kiến, có thể thay đổi.</div></div>';
}
