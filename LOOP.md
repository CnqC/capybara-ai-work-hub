# Quy Trình Vòng Lặp Bảo Trì Dài Hạn (`LOOP.md`)

1. Đọc `STATE.md`, `PRODUCT.md`, `DESIGN.md` và `gate.yaml` trước mọi phiên.
2. Giữ mỗi file `.tsx` / `.ts` trong `src/` gọn dưới `250 dòng`, cấm dùng `any`, cấm import chéo giữa các feature.
3. Chạy `npm run doctor` (`loop-doctor.mjs` + `validate-harness-plugin.mjs`), `npm run typecheck`, `npm test`, và `npm run build` xanh 100% trước khi commit.
