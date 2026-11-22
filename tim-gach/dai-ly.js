// ===== DANH SÁCH ĐẠI LÝ HỢP TÁC ĐỒNG TÂM =====
// Nguồn: danh sách Google Maps "Đại lý hợp tác Đồng Tâm" (19 điểm, lấy ngày 22/11/2026).
// Dùng chung cho: trang đích tim-gach/index.html và tờ rơi tim-gach/to-roi.html.
//
// Mỗi đại lý có 1 "ma" (mã khách hàng Đồng Tâm) — mã này nằm trên link QR:
//   .../tim-gach/?dl=<ma>
// Muốn thêm/sửa đại lý: sửa trực tiếp danh sách dưới đây.
//   - sdt: để "" nếu chưa có → trang sẽ hiện hotline hỗ trợ thay thế.
//   - lat/lng: toạ độ để tính "đại lý gần nhất" + nút chỉ đường.
//   - ganDung: true = toạ độ ước lượng (Google Maps chưa có toạ độ chính xác).

var HOTLINE_HO_TRO = '0963130240';          // Hotline hỗ trợ kỹ thuật / báo giá công trình
var HOTLINE_HO_TRO_TEN = 'Hỗ trợ kỹ thuật Đồng Tâm';
var LINK_MAP_TAT_CA = 'https://maps.app.goo.gl/N3aaxeVsy6NH9h8F7';

var DAI_LY = [
  { ma:'101290', ten:'Thiên Lộc Home', tenDay:'Cty TNHH VLXD Thiên Lộc', cuaHang:[
      { diaChi:'436 Lê Văn Việt, Tăng Nhơn Phú, TP.HCM', sdt:'0932603133', lat:10.8442751, lng:106.7891714 },
      { diaChi:'730 Lã Xuân Oai, Long Trường, TP.HCM',   sdt:'0906778388', lat:10.8076279, lng:106.8162281 },
      { diaChi:'303 Đường số 442, Tăng Nhơn Phú, TP.HCM', sdt:'',          lat:10.8402564, lng:106.796096 }
  ]},
  { ma:'110198', ten:'Đặng Ngọc Anh', tenDay:'Công ty CP Đặng Ngọc Anh', cuaHang:[
      { diaChi:'221 Hoàng Hữu Nam, Tăng Nhơn Phú, TP.HCM', sdt:'0973609898', lat:10.8591287, lng:106.8134277 } ]},
  { ma:'101291', ten:'Tân Hùng Anh', tenDay:'Cty TM XD Tân Hùng Anh', cuaHang:[
      { diaChi:'646 Nguyễn Xiển, Long Bình, TP.HCM', sdt:'0906607456', lat:10.8449117, lng:106.8299636 } ]},
  { ma:'101842', ten:'Hoàng Lam', tenDay:'Cty CP TM Hoàng Lam', cuaHang:[
      { diaChi:'06 Đường D6, KDC Nam Long, Phước Long, TP.HCM', sdt:'0987959595', lat:10.8121651, lng:106.7821972 } ]},
  { ma:'108318', ten:'Thanh Nhàn', tenDay:'Cty TNHH VLXD và TTNT Thanh Nhàn', cuaHang:[
      { diaChi:'19 Liên Phường, Phước Long, TP.HCM', sdt:'0909707945', lat:10.804697, lng:106.779553 } ]},
  { ma:'109168', ten:'Đức Truyền', tenDay:'Cty TNHH TM Đức Truyền', cuaHang:[
      { diaChi:'4 Hoàng Hữu Nam, Long Bình, TP.HCM', sdt:'0988214567', lat:10.8505928, lng:106.8138125 } ]},
  { ma:'104897', ten:'Việt Mỹ Ceramic', tenDay:'Cty TNHH XD Việt Mỹ (Kho gạch Việt Mỹ)', cuaHang:[
      { diaChi:'128 Bưng Ông Thoàn, Long Trường, TP.HCM', sdt:'0908544705', lat:10.8056691, lng:106.7992883 } ]},
  { ma:'101293', ten:'Tiến Phát', tenDay:'Cty TNHH VLXD và TTNT Tiến Phát', cuaHang:[
      { diaChi:'137 Liên Phường, Phước Long, TP.HCM', sdt:'0909447984', lat:10.8078428, lng:106.785243 } ]},
  { ma:'106439', ten:'Khang Anh Ceramic', tenDay:'Công ty TNHH Khang Anh Ceramic', cuaHang:[
      { diaChi:'1021 Nguyễn Duy Trinh, Long Trường, TP.HCM', sdt:'0933406027', lat:10.796037, lng:106.8075901 } ]},
  { ma:'109640', ten:'Nhật Nam', tenDay:'Cty TNHH VLXD Nhật Nam', cuaHang:[
      { diaChi:'310 Liên Phường, Phước Long, TP.HCM', sdt:'0911074433', lat:10.8065276, lng:106.7836536 } ]},
  { ma:'102487', ten:'Hưng Lộc', tenDay:'Cty TNHH XD SX TM Hưng Lộc', cuaHang:[
      { diaChi:'107 Liên Phường, Phước Long, TP.HCM', sdt:'', lat:10.8066762, lng:106.788783 } ]},
  { ma:'101292', ten:'Thép Bình Nguyên', tenDay:'Ngói Đồng Tâm - Thép Bình Nguyên', cuaHang:[
      { diaChi:'113 Đường số 6, Long Bình, TP.HCM', sdt:'', lat:10.8580754, lng:106.8420843 } ]},
  { ma:'114289', ten:'Hoàng Tiến Phong I', tenDay:'HKD Hoàng Tiến Phong', cuaHang:[
      { diaChi:'570 Nguyễn Xiển, Long Bình, TP.HCM', sdt:'', lat:10.8422531, lng:106.8289357 } ]},
  { ma:'108332', ten:'Long Trường Phát', tenDay:'Cửa hàng TTNT Long Trường Phát', cuaHang:[
      { diaChi:'732 Lã Xuân Oai, Long Trường, TP.HCM', sdt:'', lat:10.8076082, lng:106.8162753 } ]},
  { ma:'111490', ten:'Khang Trang', tenDay:'Cty TNHH TC Khang Trang', cuaHang:[
      { diaChi:'59B Hiệp Bình, Hiệp Bình, TP.HCM', sdt:'', lat:10.847967, lng:106.7207906 } ]},
  { ma:'110205', ten:'Sao Việt SVC', tenDay:'Cty TNHH XD TM Sao Việt SVC', cuaHang:[
      { diaChi:'57 Đường 38, Hiệp Bình, TP.HCM', sdt:'', lat:10.8465, lng:106.7215, ganDung:true } ]},
  { ma:'114306', ten:'Saigon Success', tenDay:'Cty Saigon Success', cuaHang:[
      { diaChi:'57 Hiệp Bình, Khu phố 7, Hiệp Bình, TP.HCM', sdt:'', lat:10.8476, lng:106.7212, ganDung:true } ]}
];

function timDaiLy(ma){
  ma = String(ma||'').trim();
  for(var i=0;i<DAI_LY.length;i++) if(DAI_LY[i].ma===ma) return DAI_LY[i];
  return null;
}
function dinhDangSdt(s){
  s = String(s||'').replace(/\D/g,'');
  if(s.length===10) return s.slice(0,4)+' '+s.slice(4,7)+' '+s.slice(7);
  return s;
}
function linkChiDuong(ch){
  return 'https://www.google.com/maps/dir/?api=1&destination='+ch.lat+','+ch.lng;
}
