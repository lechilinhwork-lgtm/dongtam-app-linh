// Kiểm tra phần HÀNG ĐẠI LÝ ÔM (backend-gs/moi/HangOm.gs.txt) với mock Google
const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const dir=__dirname+'/moi/';
const names=['Auth','Helpers','Orders','DuAn','HangOm','Router'];
const files=names.map(f=>fs.readFileSync(dir+f+'.gs.txt','utf8'));
files.forEach((s,i)=>{ try{ new vm.Script(s); }catch(e){ console.log('LỖI CÚ PHÁP',names[i],e.message); process.exit(1);} });
console.log('cú pháp OK:',names.join(', '));

const store={}, props={};
global.CacheService={getScriptCache:()=>({get:k=>store[k]||null,put:(k,v)=>{store[k]=v;},putAll(){},removeAll(){}})};
global.PropertiesService={getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>{props[k]=v;}})};
let uid=0;
global.Utilities={getUuid:()=>'uuid-'+(++uid)+'-aaaa-bbbb',
  computeDigest:(a,s)=>[...crypto.createHash('sha256').update(s).digest()].map(b=>b>127?b-256:b),
  DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1},newBlob:()=>({getAs:()=>({setName(){}})})};
global.ContentService={MimeType:{JSON:'J',JAVASCRIPT:'JS'},createTextOutput:t=>({t,setMimeType(){return this;}})};
global.LockService={getScriptLock:()=>({waitLock(){},releaseLock(){}})};
global.MailApp={sendEmail(){}}; global.Logger={log(){}};

function sheet(header,rows){ const s={header:header.slice(),rows:rows.map(r=>r.slice())};
  const all=()=>[s.header].concat(s.rows);
  s.getLastColumn=()=>s.header.length; s.getLastRow=()=>s.rows.length+1;
  s.getDataRange=()=>({getValues:()=>all().map(r=>r.slice())});
  s.getRange=(r,c,nr,nc)=>{ nr=nr||1; nc=nc||1; const o={
    getValues:()=>{ const out=[]; for(let i=0;i<nr;i++){ const row=all()[r-1+i]||[]; out.push(row.slice(c-1,c-1+nc)); } return out; },
    setValue:v=>{ const row=all()[r-1]; while(row.length<c) row.push(''); row[c-1]=v; return o; },
    setValues:vs=>{ for(let i=0;i<nr;i++){ const row=all()[r-1+i]; while(row.length<c-1+nc) row.push(''); for(let j=0;j<nc;j++) row[c-1+j]=vs[i][j]; } return o; },
    setFontWeight:()=>o };
    return o; };
  s.appendRow=a=>s.rows.push(a); s.deleteRow=n=>s.rows.splice(n-2,1); s.setFrozenRows=()=>{};
  return s; }

const H=s=>crypto.createHash('sha256').update(s).digest('hex');
const users=sheet(['Username','PasswordHash','Name','Role'],[
  ['linh',H('p1'),'Lê Chí Linh','admin'],['kh',H('p2'),'Đại lý Tiến Phát','khachhang'],
  ['nv1',H('p3'),'NV Một','nv'],['nv2',H('p4'),'NV Hai','nv'],['duan1',H('p5'),'Sale Dự án','duan']]);
const hang=sheet([],[]);   // tab HangDaiLyOm tự tạo
let tabHang=null;
const agencies=sheet(['Tên Đại Lý','Mã','Quản lý','Điện thoại','Địa chỉ','Trạng thái'],[
  ['Cty Thanh Nhàn','DL05','Nguyễn Văn A','0901','', 'Active'],['Cty Cũ','DL99','Ai Đó','','','Inactive'],['Cty Việt Mỹ','DL15','Trần B','0902','','Active']]);
const nguoidung=sheet(['Username','MatKhau','Họ tên','Vai trò','Token'],[['u1','MATKHAUBIMAT','Lê Sale','Sale','TOKENBIMAT'],['u2','MK2','Nguyễn Văn A','Quản lý','T2']]);
global.SpreadsheetApp={openById:(id)=>({
  getSheetByName:n=>{ if(id==='QLMAU'){ return n==='Agencies'?agencies:n==='NguoiDung'?nguoidung:null; }
    return n==='Users'?users:(n==='HangDaiLyOm'?tabHang:null); },
  insertSheet:(n)=>{ tabHang=sheet([],[]); return tabHang; } })};
vm.runInThisContext("var SHEET_ID='MAIN',SHEET_ID_PHU='p',EMAIL_TO='x@x',TAB={don:'Đơn hàng',users:'Users'};"
 +"function upsertKhachHang(){} function getKhachHang(){return {status:'ok',data:[]};} function themUser(){return {status:'ok'};}");
files.forEach(s=>vm.runInThisContext(s));
vm.runInThisContext("SHEET_ID_QLMAU='QLMAU';");
const APP='QDy3MCObF1FLdoBexB9XO3dECy64';
const call=(p)=>JSON.parse(doGet({parameter:Object.assign({k:APP},p)}).t);
const login=(u,pw)=>call({action:'login',username:u,password:pw});
const A=login('linh','p1'), K=login('kh','p2'), N1=login('nv1','p3'), N2=login('nv2','p4'), D=login('duan1','p5');
let fail=0; const ok=(c,m)=>{ console.log((c?'  ✔ ':'  ✘ ')+m); if(!c) fail++; };

console.log('\n--- QUYỀN XEM/GHI ---');
for(const [ten,t] of [['khách',K],['dự án',D],['chưa đăng nhập',{token:''}]]){
  ok(call({action:'getHangOm',t:t.token}).msg==='forbidden',ten+' không xem được hàng ôm');
  ok(call({action:'luuHangOm',t:t.token,data:'{"ma":"A","daiLy":"X","thung":1}'}).msg==='forbidden',ten+' không đăng được');
  ok(call({action:'getDanhMucDaiLy',t:t.token}).msg==='forbidden',ten+' không xem được danh mục đại lý');
}

console.log('\n--- ĐĂNG + DUYỆT ---');
const d1=JSON.stringify({ma:'6060ABC001',daiLy:'Cty Thanh Nhàn',sale:'Nguyễn Văn A',thung:35,vien:12,lo:'3052107131',giam:'giảm 15%',lienHe:'Anh A 0901',ghiChu:'=CMD()'});
const r1=call({action:'luuHangOm',t:N1.token,data:d1});
ok(r1.status==='ok'&&r1.tt==='Chờ duyệt','nv1 đăng -> Chờ duyệt');
const dong=tabHang.rows[0];
ok(dong[9]==="'=CMD()",'chặn công thức trong ghi chú: '+dong[9]);
ok(call({action:'getHangOm',t:N2.token}).data.length===0,'nv2 CHƯA thấy dòng chờ duyệt');
ok(call({action:'getHangOm',t:N1.token}).data.length===1,'nv1 thấy dòng của chính mình');
ok(call({action:'getHangOm',t:A.token}).data.length===1,'admin thấy dòng chờ duyệt');
ok(call({action:'doiTrangThaiHangOm',t:N1.token,id:r1.id,hanh:'duyet'}).msg==='Chỉ admin được duyệt','nv không tự duyệt được');
ok(call({action:'doiTrangThaiHangOm',t:A.token,id:r1.id,hanh:'duyet'}).status==='ok','admin duyệt');
const v2=call({action:'getHangOm',t:N2.token});
ok(v2.data.length===1&&v2.data[0].thung===35&&v2.data[0].vien===12&&v2.data[0].own===false,'nv2 giờ thấy (35 thùng + 12 viên)');
ok(call({action:'getHangOm',t:K.token}).msg==='forbidden','khách vẫn không thấy sau khi duyệt');

console.log('\n--- SỬA / BÁN HẾT / NGƯỜI KHÁC ---');
ok(call({action:'luuHangOm',t:N2.token,data:JSON.stringify({id:r1.id,ma:'6060ABC001',daiLy:'X',thung:1})}).msg.indexOf('Chỉ người đăng')===0,'nv2 không sửa được dòng của nv1');
ok(call({action:'doiTrangThaiHangOm',t:N2.token,id:r1.id,hanh:'banhet'}).status==='error','nv2 không đánh dấu bán hết dòng của nv1');
const sua=call({action:'luuHangOm',t:N1.token,data:JSON.stringify({id:r1.id,ma:'6060ABC001',daiLy:'Cty Thanh Nhàn',thung:20,vien:0})});
ok(sua.tt==='Chờ duyệt'&&call({action:'getHangOm',t:N2.token}).data.length===0,'nv1 sửa -> quay lại Chờ duyệt, nv2 không thấy nữa');
call({action:'doiTrangThaiHangOm',t:A.token,id:r1.id,hanh:'duyet'});
ok(call({action:'doiTrangThaiHangOm',t:N1.token,id:r1.id,hanh:'banhet'}).status==='ok'&&call({action:'getHangOm',t:N2.token}).data.length===0,'nv1 bấm Đã bán hết -> biến mất với người khác');

console.log('\n--- HẾT HẠN 30 NGÀY ---');
const r3=call({action:'luuHangOm',t:A.token,data:JSON.stringify({ma:'M3',daiLy:'Cty Việt Mỹ',thung:5})});
ok(r3.tt==='Đã duyệt','admin đăng -> tự Đã duyệt');
const dong3=tabHang.rows.find(r=>r[0]===r3.id); dong3[13]=new Date(Date.now()-31*86400000).toISOString();
ok(call({action:'getHangOm',t:N2.token}).data.every(o=>o.id!==r3.id),'quá 30 ngày -> nv khác không thấy');
ok(call({action:'getHangOm',t:A.token}).data.find(o=>o.id===r3.id).hetHan===true,'admin thấy, gắn cờ hết hạn');
ok(call({action:'doiTrangThaiHangOm',t:A.token,id:r3.id,hanh:'giahan'}).status==='ok'&&call({action:'getHangOm',t:N2.token}).data.some(o=>o.id===r3.id),'gia hạn -> hiện lại');

console.log('\n--- KIỂM TRA DỮ LIỆU VÀO ---');
ok(call({action:'luuHangOm',t:N1.token,data:'{"ma":"A","daiLy":"","thung":1}'}).status==='error','thiếu đại lý bị chặn');
ok(call({action:'luuHangOm',t:N1.token,data:'{"ma":"A","daiLy":"X","thung":0,"vien":0}'}).status==='error','không nhập số lượng bị chặn');
ok(call({action:'luuHangOm',t:N1.token,data:'{xxx'}).status==='error','JSON hỏng bị chặn');

console.log('\n--- DANH MỤC ĐẠI LÝ + SALE ---');
const dm=call({action:'getDanhMucDaiLy',t:N1.token});
ok(dm.daiLy.length===2&&dm.daiLy.every(x=>x.ten!=='Cty Cũ'),'chỉ đại lý Active ('+dm.daiLy.length+')');
ok(dm.sale.indexOf('Nguyễn Văn A')>=0&&dm.sale.indexOf('Lê Sale')>=0&&dm.sale.length===3,'sale gồm Quản lý + Họ tên NguoiDung, không trùng: '+dm.sale.join(', '));
const raw=JSON.stringify(dm);
ok(raw.indexOf('MATKHAUBIMAT')<0&&raw.indexOf('TOKENBIMAT')<0,'KHÔNG lộ mật khẩu/token của app quản lý mẫu');

console.log('\n'+(fail?('CÓ '+fail+' LỖI'):'TẤT CẢ ĐẠT'));
process.exit(fail?1:0);
