// ===== GIẢM THÊM CHO ĐẠI LÝ (1–9%) – chỉ TÀI KHOẢN ĐẶC BIỆT =====
// Nhân viên đặc biệt nhớ đại lý nào được giảm bao nhiêu %, rồi chọn % ở:
//   - chi tiết sản phẩm (báo giá Zalo + thêm vào đơn theo giá đã giảm)
//   - từng dòng trong giỏ đơn hàng
// % áp lên giá NHẬN KHO và ĐI GIAO (kể cả giá Sale CT1/CT2, xả kho, các mức theo số lượng).
// KHÔNG làm tròn (theo yêu cầu). Giá niêm yết không đổi.
// Quyền: máy chủ báo giamGia=1 khi đăng nhập (admin, hoặc cột "Quyền giảm giá" = Có trong tab Users).
var GG_TOI_DA=9;
var GG_FIELDS=['nhan','giao','nhan2','giao2','nhan3','giao3','ns','gs','ct150nk','ct150gh'];
var GGSEL={};          // mã -> % đang chọn trong chi tiết sản phẩm (chỉ trong lúc mở popup)
var _ggTamThoi=null;   // % kèm theo lần "Thêm vào đơn" từ chi tiết sản phẩm (dùng 1 lần)
var _ggGiu=false;

function ggDuocDung(){
  var s=checkSession();
  return !!(s && s.gg && (s.role==='admin'||s.role==='nv') && !(typeof laBanRieng==='function'&&laBanRieng()));
}
function ggK(pct){ pct=Number(pct)||0; return (pct>0&&pct<=GG_TOI_DA)?(1-pct/100):1; }
function ggSel(ma){ return ggDuocDung()?(Number(GGSEL[ma])||0):0; }
function ggFactorCho(ma){ return ggK(ggSel(ma)); }

// % GIẢM CẢ ĐƠN (nhớ trên máy, bỏ khi xóa đơn). Nhân với % của từng dòng: giá = gốc × (1-%dòng) × (1-%cả đơn)
var ggDonAll=0;
try{ ggDonAll=Number(localStorage.getItem('dt_gg_don_all'))||0; if(ggDonAll<0||ggDonAll>GG_TOI_DA) ggDonAll=0; }catch(e){}
// Chỉ Gạch / Ngói / Keo (theo yêu cầu). Gạch kính, thiết bị vệ sinh... không giảm.
function ggAnhHuong(item){ var l=item&&item.loai||'gach'; return l==='gach'||l==='ngoi'||l==='keo'; }
// Tính lại giá 1 dòng từ giá GỐC (item._goc) theo % của dòng + % cả đơn
function ggTinhItem(item){
  if(!item||!ggAnhHuong(item)) return;
  if(!item._goc){
    item._goc={};
    GG_FIELDS.forEach(function(f){ if(typeof item[f]==='number') item._goc[f]=item[f]; });
  }
  var k=ggK(item.ggDL)*ggK(ggDonAll);
  // Chỉ làm sạch nhiễu số thực của máy tính (182399.99999999997 -> 182400), KHÔNG làm tròn tiền
  GG_FIELDS.forEach(function(f){ if(typeof item._goc[f]==='number') item[f]=Math.round(item._goc[f]*k*1e6)/1e6; });
}
// Đặt % cho 1 dòng đơn hàng
function ggApDung(item, pct){
  if(!item||!ggAnhHuong(item)) return;
  pct=Number(pct)||0;
  if(pct<0||pct>GG_TOI_DA) pct=0;
  item.ggDL=pct>0?pct:0;
  ggTinhItem(item);
}
// Dòng mới thêm vào đơn khi đang có % cả đơn -> áp luôn
function ggSauThem(ma){
  var it=donItems.find(function(x){ return x.ma===ma; });
  if(it && !it._goc && ggDonAll>0 && ggDuocDung()) ggTinhItem(it);
}

// ----- Chi tiết sản phẩm (gạch) -----
function ggVaoSP(ma){
  if(!_ggGiu) GGSEL={};           // mở sản phẩm khác -> bỏ % cũ, tránh báo nhầm giá giảm cho đại lý khác
  ggRenderChips(ma);
}
function ggRenderChips(ma){
  var w=document.getElementById('dp-gg-wrap'); if(!w) return;
  if(!ggDuocDung()){ w.style.display='none'; w.innerHTML=''; return; }
  var cur=ggSel(ma);
  var chip=function(v,txt){
    var on=(cur===v);
    return '<button type="button" onclick="ggChonDP('+v+')" style="min-width:42px;min-height:38px;padding:0 10px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid '+(on?'#6A1B9A':'#CE93D8')+';background:'+(on?'#6A1B9A':'#fff')+';color:'+(on?'#fff':'#6A1B9A')+'">'+txt+'</button>';
  };
  var h='<p class="dp-sec-label" style="color:#6A1B9A">🎯 GIẢM THÊM CHO ĐẠI LÝ <span style="font-weight:400;font-size:10px;color:#888">(tài khoản đặc biệt)</span></p>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">'+chip(0,'Không');
  for(var i=1;i<=GG_TOI_DA;i++) h+=chip(i,i+'%');
  h+='</div>'
    +(cur>0?'<div style="font-size:12px;color:#6A1B9A;background:#F3E5F5;border-radius:8px;padding:6px 10px;margin-bottom:8px">Đang báo giá <b>giảm thêm '+cur+'%</b> trên giá nhận kho / đi giao (kể cả giá Sale). Zalo và "Thêm đơn" dùng giá này.</div>':'');
  w.innerHTML=h; w.style.display='block';
}
function ggChonDP(pct){
  if(!ggDuocDung()||!curP_ma) return;
  var ma=curP_ma, sc=document.getElementById('dp-scroll'), top=sc?sc.scrollTop:0;
  var q=document.getElementById('dp-qty-input'), qv=q?q.value:'1', unit=(typeof dpUnit!=='undefined')?dpUnit:'m2';
  GGSEL[ma]=Number(pct)||0;
  _ggGiu=true; try{ showDP(ma); }finally{ _ggGiu=false; }
  setTimeout(function(){                        // showDP đặt lại số lượng + cuộn về đầu -> trả lại như cũ
    if(unit==='thung' && typeof setDpUnit==='function') setDpUnit('thung');
    var q2=document.getElementById('dp-qty-input'); if(q2){ q2.value=qv; if(typeof calcDpQty==='function') calcDpQty(); }
    var s2=document.getElementById('dp-scroll'); if(s2) s2.scrollTop=top;
  },40);
}
function ggDongDP(){ GGSEL={}; }

// ----- Giỏ đơn hàng: chọn % cho từng dòng -----
function ggHtmlDong(item){
  if(!ggDuocDung()||!ggAnhHuong(item)) return '';
  var cur=Number(item.ggDL)||0, op='<option value="0">Không</option>';
  for(var i=1;i<=GG_TOI_DA;i++) op+='<option value="'+i+'"'+(cur===i?' selected':'')+'>'+i+'%</option>';
  return '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:7px 10px;border-radius:8px;background:'+(cur>0?'#F3E5F5':'var(--bg1)')+';border:1px dashed #CE93D8">'
    +'<span style="font-size:12px;font-weight:700;color:#6A1B9A;flex:1">🎯 Giảm thêm cho đại lý</span>'
    +'<select data-ggdl="'+hoEscGG(item.ma)+'" style="min-height:38px;padding:0 10px;border-radius:8px;border:1.5px solid #CE93D8;font-size:15px;font-weight:700;color:#6A1B9A;background:#fff;font-family:inherit">'+op+'</select></div>';
}
// Khung chọn % GIẢM CẢ ĐƠN (đặt phía trên danh sách sản phẩm trong giỏ)
function ggRenderDonAll(){
  var w=document.getElementById('don-ggdl-all'); if(!w) return;
  if(!ggDuocDung()||!donItems.length){ w.style.display='none'; w.innerHTML=''; return; }
  var chip=function(v,txt){
    var on=(ggDonAll===v);
    return '<button type="button" onclick="ggDatTatCa('+v+')" style="min-width:42px;min-height:38px;padding:0 10px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid '+(on?'#6A1B9A':'#CE93D8')+';background:'+(on?'#6A1B9A':'#fff')+';color:'+(on?'#fff':'#6A1B9A')+'">'+txt+'</button>';
  };
  var h='<div style="font-size:13px;font-weight:800;color:#6A1B9A;margin-bottom:6px">🎯 Giảm thêm cho đại lý — CẢ ĐƠN <span style="font-weight:400;font-size:11px;color:#888">(tài khoản đặc biệt)</span></div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap">'+chip(0,'Không');
  for(var i=1;i<=GG_TOI_DA;i++) h+=chip(i,i+'%');
  h+='</div><div style="font-size:11px;color:#666;margin-top:6px;line-height:1.45">'
    +(ggDonAll>0?'<b style="color:#6A1B9A">Đang giảm thêm '+ggDonAll+'% cho cả đơn.</b> ':'')
    +'Áp cho Gạch, Ngói, Keo (cả giá Sale). Mỗi sản phẩm vẫn chọn % riêng được — hai mức <b>nhân với nhau</b>. Không áp cho gạch kính, thiết bị vệ sinh.</div>';
  w.innerHTML=h; w.style.display='block';
  w.style.cssText='display:block;background:#F8F0FB;border:1.5px solid #CE93D8;border-radius:var(--r8,10px);padding:10px 12px;margin-bottom:10px';
}
function ggDatTatCa(pct){
  if(!ggDuocDung()) return;
  pct=Number(pct)||0; if(pct<0||pct>GG_TOI_DA) pct=0;
  ggDonAll=pct;
  try{ localStorage.setItem('dt_gg_don_all', String(pct)); }catch(e){}
  donItems.forEach(ggTinhItem);
  if(typeof saveDonItemsToStorage==='function') saveDonItemsToStorage();
  renderDon();
  if(typeof calcAndShowTotals==='function') calcAndShowTotals();
}
// Xóa đơn -> bỏ % cả đơn
function ggReset(){ ggDonAll=0; try{ localStorage.removeItem('dt_gg_don_all'); }catch(e){} }
function hoEscGG(s){ return String(s===null||s===undefined?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function ggDatDong(ma, pct){
  var it=donItems.find(function(x){ return x.ma===ma; }); if(!it) return;
  ggApDung(it, pct);
  if(typeof saveDonItemsToStorage==='function') saveDonItemsToStorage();
  renderDon();
  if(typeof calcAndShowTotals==='function') calcAndShowTotals();
}
// Ghi chú cho đơn lưu: "Giảm thêm cho đại lý: 6060A 5%; 6060B 3%"
function ggGhiChuDon(){
  if(!ggDuocDung()) return '';
  var ds=donItems.filter(function(x){ return Number(x.ggDL)>0&&ggAnhHuong(x); });
  if(!ds.length && !(ggDonAll>0)) return '';
  return ' | Giảm thêm cho đại lý:'+(ggDonAll>0?' cả đơn '+ggDonAll+'%':'')+(ds.length?(ggDonAll>0?';':'')+' '+ds.map(function(x){ return x.ma+' '+x.ggDL+'%'; }).join('; '):'');
}
