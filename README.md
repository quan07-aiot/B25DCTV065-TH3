# Sổ chi tiêu cá nhân

- Họ và tên: Hoàng Mạnh Quân 
- Mã sinh viên: B25DCTV065

## Phần A - Class Component

```bash
cd part-a-class
npm install
npm run dev
```

## Phần B - Hooks

MockAPI cần các trường `content`, `amount`, `category`, `date`. Xem [4 dữ liệu mẫu](./part-b-hooks/mockapi-sample-data.json). Hãy thay các bản ghi cũ thiếu trường bằng dữ liệu này.

```bash
cd part-b-hooks
npm install
npm run dev
```

## Hooks đã dùng

- `useState`: lưu dữ liệu và nội dung form.
- `useEffect`: chạy đồng hồ, tải dữ liệu và tìm kiếm có độ trễ.
- `useRef`: focus ô nhập sau khi thêm khoản chi.
- `useContext`: đổi giao diện sáng/tối.
- `useFetch`, `useClock`: dùng lại logic lấy dữ liệu và đồng hồ.

Hooks giúp gom logic liên quan vào cùng một chỗ, thay vì chia qua nhiều lifecycle như trong Class Component.
