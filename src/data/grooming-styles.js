// ============================================================
// Dữ liệu các mẫu Grooming & Gói dịch vụ tại SamPet
// Dễ dàng thay thế link ảnh, tên mẫu và giá tiền thực tế
// ============================================================

export const GROOMING_CATEGORIES = [
  { id: "all", label: "Tất Cả Mẫu" },
  { id: "poodle", label: "Poodle" },
  { id: "pomeranian", label: "Phốc Sóc (Pom)" },
  { id: "corgi", label: "Corgi" },
  { id: "cat", label: "Mèo Cưng" },
  { id: "creative", label: "Nhuộm & Spa VIP" }
];

export const GROOMING_STYLES = [
  {
    id: "poodle-teddy",
    name: "Poodle Mặt Gấu Teddy Bear",
    category: "poodle",
    badge: "Hot Trend 2026",
    price: "Từ 250.000 đ",
    duration: "75 - 90 phút",
    description: "Khuôn mặt tròn xoe bầu bĩnh như gấu nhồi bông, tai ngắn bung xòe mềm mại, chân cắt ống bo tròn cưng xỉu.",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80",
    suitableFor: "Poodle Tiny, Toy, Teacup"
  },
  {
    id: "poodle-donut",
    name: "Poodle Tạo Hình Mõm Donut",
    category: "poodle",
    badge: "Thanh Lịch",
    price: "Từ 280.000 đ",
    duration: "80 - 100 phút",
    description: "Phần mõm được tỉa tròn đều như chiếc bánh donut nhỏ nhắn, mắt mở to sáng rõ, hạn chế tối đa dính bẩn khi ăn uống.",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80",
    suitableFor: "Poodle lông dày, xoăn xù"
  },
  {
    id: "pom-boo",
    name: "Phốc Sóc Tròn Xoe Kiểu Gấu Boo",
    category: "pomeranian",
    badge: "Siêu Đáng Yêu",
    price: "Từ 300.000 đ",
    duration: "90 - 120 phút",
    description: "Biến bé Phốc Sóc thành chú gấu mini di động. Toàn thân tỉa tròn vo đều đặn, tai ngắn củn, đuôi xòe bồng bềnh.",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80",
    suitableFor: "Phốc Sóc lông bông, Phốc Sóc lai"
  },
  {
    id: "corgi-peach",
    name: "Corgi Bo Tròn Mông Trái Đào",
    category: "corgi",
    badge: "Bán Chạy Nhất",
    price: "Từ 220.000 đ",
    duration: "60 - 75 phút",
    description: "Điểm nhấn là vòng 3 được bo tròn hình quả đào căng tròn, tỉa gọn chân và ức tôn trọn nét quyến rũ của bé chân ngắn.",
    image: "https://images.unsplash.com/photo-1612536057832-2ff7ead58194?auto=format&fit=crop&w=800&q=80",
    suitableFor: "Corgi Pembroke, Corgi Cardigan"
  },
  {
    id: "cat-lion",
    name: "Mèo Cạo Kiểu Sư Tử Dũng Mãnh",
    category: "cat",
    badge: "Mát Mẻ Mùa Hè",
    price: "Từ 250.000 đ",
    duration: "60 - 80 phút",
    description: "Giải pháp cho mùa nóng và các bé mèo hay bị bết rối. Giữ bờm tròn quanh cổ, 4 bàn chân mang vớ và chỏm bông đuôi đáng yêu.",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
    suitableFor: "Mèo lông dài (Anh lông dài, Ba Tư, Xiêm)"
  },
  {
    id: "bichon-snowball",
    name: "Bichon Frise Đầu Cầu Tuyết Tròn",
    category: "poodle",
    badge: "Sang Chảnh",
    price: "Từ 350.000 đ",
    duration: "90 - 120 phút",
    description: "Form đầu quả cầu tuyết lớn đặc trưng của dòng Bichon, lông bung trắng muốt, kết hợp dưỡng collagen mềm mượt như mây.",
    image: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80",
    suitableFor: "Bichon Frise, Poodle trắng form to"
  },
  {
    id: "dye-creative",
    name: "Nhuộm Tai & Đuôi Màu Pastel Hữu Cơ",
    category: "creative",
    badge: "Độc Bản & Cá Tính",
    price: "Từ 150.000 đ",
    duration: "45 - 60 phút",
    description: "Thuốc nhuộm organic chiết xuất thảo mộc 100% an toàn không độc hại. Các gam màu pastel hot: Hồng đào, Xanh ngọc bích, Tím khói.",
    image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80",
    suitableFor: "Poodle trắng/kem, Phốc sóc, Bichon"
  },
  {
    id: "cat-spa",
    name: "Tắm Dưỡng Spa & Khử Mùi Cho Mèo",
    category: "cat",
    badge: "Thư Giãn 5 Sao",
    price: "Từ 200.000 đ",
    duration: "50 - 70 phút",
    description: "Tắm sấy nhẹ nhàng chuyên biệt không gây hoảng loạn, dưỡng xả khử mùi triệt để, chải loại bỏ 90% lông rụng tích tụ.",
    image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80",
    suitableFor: "Mọi giống mèo cảnh"
  }
];

export const SERVICE_PACKAGES = [
  {
    id: "pkg-basic",
    name: "Gói Tắm Vệ Sinh Cơ Bản",
    price: "Từ 120.000 đ",
    isPopular: false,
    description: "Lựa chọn hoàn hảo để boss luôn sạch sẽ, thơm tho và gọn gàng mỗi tuần.",
    features: [
      "Kiểm tra da lông & ký sinh trùng",
      "Vệ sinh tai & nhổ lông tai sâu",
      "Cắt mài móng bo tròn an toàn",
      "Cạo vệ sinh đệm chân, bụng, hậu môn",
      "Tắm 2 lần sữa tắm chuyên dụng theo loại lông",
      "Sấy đánh bông tơi lông & xịt dưỡng hương hoa"
    ]
  },
  {
    id: "pkg-combo",
    name: "Combo Cắt Tỉa Tạo Kiểu Trọn Gói",
    price: "Từ 280.000 đ",
    isPopular: true,
    badge: "Được Yêu Thích Nhất",
    description: "Gói dịch vụ toàn diện biến hóa boss cưng thành soái ca, tiểu thư sang xịn.",
    features: [
      "Toàn bộ 6 bước của Gói Tắm Vệ Sinh Cơ Bản",
      "Cắt tỉa tạo kiểu theo mẫu yêu cầu (Teddy, Boo, v.v.)",
      "Hấp dầu ủ mượt phục hồi biểu bì lông",
      "Vắt tuyến hôi hạn chế mùi khó chịu",
      "Tặng xịt dưỡng bóng mượt lông Organic",
      "Chụp ảnh check-in xịn sò gửi ba mẹ"
    ]
  },
  {
    id: "pkg-vip",
    name: "Gói Spa VIP Ngâm Bồn Khoáng",
    price: "Từ 420.000 đ",
    isPopular: false,
    description: "Trị liệu cao cấp dành cho da nhạy cảm, viêm ngứa hoặc lông khô xơ gãy rụng.",
    features: [
      "Toàn bộ quy trình Combo Cắt Tỉa Trọn Gói",
      "Ngâm bồn sục Micro Bubble bọt khí CO2 siêu mịn",
      "Đắp mặt nạ bùn khoáng phục hồi da hư tổn",
      "Massage thư giãn toàn thân giảm stress",
      "Sấy lồng tĩnh âm cao cấp hạn chế tiếng ồn",
      "Quà tặng nơ đeo cổ hoặc khăn bandana thời trang"
    ]
  }
];

export const GROOMING_STEPS = [
  { step: "01", title: "Khám Sơ Bộ", desc: "Kiểm tra tình trạng da lông, ve rận, mẩn đỏ trước khi làm." },
  { step: "02", title: "Vệ Sinh Tai", desc: "Nhổ lông tai dơ, rửa sạch bằng dung dịch khử khuẩn chuyên dụng." },
  { step: "03", title: "Cắt Mài Móng", desc: "Cắt sát tủy an toàn, mài nhẵn tránh cào xước ba mẹ." },
  { step: "04", title: "Cạo Vệ Sinh", desc: "Dọn sạch lông đệm bàn chân, vùng bụng và hậu môn chống bám bẩn." },
  { step: "05", title: "Gỡ Rối Lông", desc: "Chải bung tơi các búi rối nhẹ nhàng bằng lược chuyên dụng." },
  { step: "06", title: "Tắm Bọt Tuyết", desc: "Sử dụng dầu tắm hữu cơ dịu nhẹ, massage thư giãn dịu êm." },
  { step: "07", title: "Sấy Đánh Bông", desc: "Sấy khô 100% chân lông, đánh phồng tơi xốp chuẩn form." },
  { step: "08", title: "Cắt Tạo Kiểu", desc: "Groomer tay nghề cao cắt tỉa sắc nét từng chi tiết theo mẫu." },
  { step: "09", title: "Dưỡng & Thơm", desc: "Xịt tinh dầu dưỡng bóng mượt và nước hoa organic lưu hương 5-7 ngày." },
  { step: "10", title: "Bàn Giao & Ảnh", desc: "Chụp ảnh lưu niệm boss và bàn giao tận tay ba mẹ với phiếu đánh giá." }
];
