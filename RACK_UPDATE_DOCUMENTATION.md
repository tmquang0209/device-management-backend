# Device Location - Rack Management Updates

## Ngày cập nhật: 13/12/2025

## Tổng quan thay đổi

Cập nhật hệ thống quản lý kệ (rack) với các tính năng mới bao gồm tự động tạo mã, quản lý kích thước kệ, và sơ đồ bố trí thiết bị.

## Chi tiết thay đổi

### 1. Backend Changes

#### 1.1. Rack Entity (`rack.entity.ts`)

- **Thêm fields mới:**

  - `rows`: Số hàng trong kệ (INTEGER, default: 1)
  - `cols`: Số cột trong kệ (INTEGER, default: 1)

- **Tự động tạo mã kệ:**
  - Thêm `@BeforeCreate` decorator để tự động generate mã kệ
  - Format mã: `DDMMYY_XX` (ví dụ: `131225_01`, `131225_02`)
  - XX là số thứ tự kệ được tạo trong ngày
  - Mã được tạo tự động khi tạo rack mới

#### 1.2. Rack DTOs (`rack.dto.ts`)

- **CreateRackDto:**

  - `code`: Chuyển từ required → optional (vì sẽ tự động tạo)
  - `rows`: Required, minimum: 1, maximum: 100
  - `cols`: Required, minimum: 1, maximum: 100
  - `status`: Optional

- **UpdateRackDto:**

  - Thêm `rows`: Optional
  - Thêm `cols`: Optional

- **RackResponseDto:**
  - Thêm `rows: number`
  - Thêm `cols: number`

#### 1.3. Device Controller (`device.controller.ts`)

- **Endpoint mới:** `GET /devices/unassigned/list`
  - Lấy danh sách thiết bị chưa được gán vào kệ nào
  - Dùng cho việc chọn thiết bị khi bố trí sơ đồ kệ

#### 1.4. Device Service (`device.service.ts`)

- **Method mới:** `getUnassignedDevices()`
  - Trả về danh sách thiết bị có `rackId = null`
  - Bao gồm thông tin device type

#### 1.5. Database Migration

- File: `migrations/20251213_add_rows_cols_to_rack.sql`
- Thêm cột `rows` và `cols` vào bảng `rack`
- Cho phép `code` column nullable để hỗ trợ auto-generation

### 2. Frontend Changes

#### 2.1. Rack Interface (`rack.interface.ts`)

- **IRack:** Thêm `rows: number` và `cols: number`
- **IRackCreate:**
  - `code`: Optional
  - Thêm `rows: number` (required)
  - Thêm `cols: number` (required)
- **IRackUpdate:** Kế thừa các thay đổi từ IRackCreate

#### 2.2. Rack Schema (`rack.schema.ts`)

- **createRackSchema:**

  - Bỏ validation cho `code` (vì auto-generated)
  - Thêm validation cho `rows` và `cols`:
    - Kiểu: number
    - Min: 1
    - Max: 100

- **updateRackSchema:**
  - `code`: Optional, readonly (chỉ xem)
  - Thêm `rows` và `cols` optional

#### 2.3. Rack Tab Component (`rack-tab.tsx`)

- **Columns cập nhật:**

  - Thêm cột "Số Hàng" (rows)
  - Thêm cột "Số Cột" (cols)
  - Điều chỉnh kích thước cột để phù hợp

- **Form fields:**

  - **Create form:** Chỉ hiển thị rows, cols, status (không có code)
  - **Edit form:** Hiển thị code (readonly), rows, cols, status

- **Actions mới:**
  - Thêm action "Xem Sơ Đồ" với icon LayoutGrid
  - Mở dialog RackDiagram khi click

#### 2.4. Rack Diagram Component (`rack-diagram.tsx`) - MỚI

Component mới để hiển thị và quản lý sơ đồ kệ:

**Features:**

- Hiển thị lưới (grid) theo kích thước rows × cols
- Mỗi ô hiển thị:

  - Tọa độ [row, col]
  - Tên thiết bị (nếu có)
  - Serial number (nếu có)
  - Trạng thái: trống/có thiết bị

- **Tương tác:**

  - Click vào ô để chọn
  - Select dropdown để chọn thiết bị chưa gán
  - Có thể xóa thiết bị khỏi ô
  - Lưu toàn bộ sơ đồ khi hoàn thành

- **State management:**

  - Fetch unassigned devices từ API
  - Fetch current rack devices
  - Map devices vào cells theo device_location
  - Update cả device.rackId và device_location khi save

- **UI/UX:**
  - Responsive grid layout
  - Color coding:
    - Trống: white/gray
    - Có thiết bị: green
    - Đang chọn: blue
  - Hover effects
  - Loading states

## API Endpoints

### Existing (Updated)

- `POST /racks` - Tạo rack mới (không cần gửi code)
- `PUT /racks/:id` - Cập nhật rack (code readonly)
- `GET /racks` - Danh sách racks
- `GET /racks/:id` - Chi tiết rack
- `DELETE /racks/:id` - Xóa rack

### New

- `GET /devices/unassigned/list` - Lấy thiết bị chưa gán vào kệ

## Database Schema Changes

```sql
-- rack table
ALTER TABLE rack ADD COLUMN rows INTEGER NOT NULL DEFAULT 1;
ALTER TABLE rack ADD COLUMN cols INTEGER NOT NULL DEFAULT 1;
ALTER TABLE rack ALTER COLUMN code DROP NOT NULL;
```

## Cách sử dụng

### 1. Tạo Rack mới

1. Vào tab "Quản Lý Rack"
2. Click nút "+" để tạo mới
3. Nhập:
   - Số hàng (1-100)
   - Số cột (1-100)
   - Trạng thái
4. Mã rack sẽ tự động tạo khi submit

### 2. Xem/Chỉnh sửa sơ đồ kệ

1. Trong danh sách rack, click menu "..." của rack cần xem
2. Chọn "Xem Sơ Đồ"
3. Dialog hiển thị:
   - Lưới kệ với tất cả ô
   - Thiết bị hiện tại (nếu có)
4. Click vào ô trống để gán thiết bị
5. Chọn thiết bị từ dropdown (chỉ hiển thị thiết bị chưa gán)
6. Click "Lưu Sơ Đồ" để cập nhật

### 3. Gỡ thiết bị khỏi kệ

1. Mở sơ đồ kệ
2. Click vào ô có thiết bị
3. Chọn "Xóa thiết bị" từ dropdown
4. Lưu thay đổi

## Migration Steps

### Backend

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Run migration
psql -U username -d database_name -f migrations/20251213_add_rows_cols_to_rack.sql

# 3. Restart server
npm run start:dev
```

### Frontend

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Build
npm run build

# 3. Start dev server
npm run dev
```

## Breaking Changes

⚠️ **IMPORTANT:**

1. **API Request Changes:**

   - `POST /racks` không còn yêu cầu field `code`
   - Thêm required fields: `rows`, `cols`

2. **Response Changes:**

   - Rack responses bây giờ bao gồm `rows` và `cols`

3. **Database Schema:**
   - Cần chạy migration để thêm columns mới
   - Existing racks sẽ có rows=1, cols=1 mặc định

## Testing Checklist

- [ ] Tạo rack mới không cần nhập mã
- [ ] Mã rack được tạo theo format DDMMYY_XX
- [ ] Tạo nhiều rack trong cùng 1 ngày, số thứ tự tăng dần
- [ ] Edit rack, mã hiển thị readonly
- [ ] Update rows/cols của rack
- [ ] Xem sơ đồ rack hiển thị đúng kích thước
- [ ] Gán thiết bị vào ô trong sơ đồ
- [ ] Chỉ hiển thị thiết bị chưa có trên kệ khác
- [ ] Lưu sơ đồ cập nhật đúng device.rackId
- [ ] Lưu sơ đồ tạo device_location đúng vị trí
- [ ] Xóa thiết bị khỏi ô
- [ ] API /devices/unassigned/list trả về đúng dữ liệu

## Notes

- Auto-generation của code sử dụng `@BeforeCreate` hook trong Sequelize
- Code format dựa trên ngày hiện tại và số thứ tự trong ngày
- Rack diagram sử dụng CSS Grid để responsive layout
- Device selection chỉ hiển thị devices có rackId = null
- Khi save diagram, cập nhật cả 2 bảng: device và device_location

## Support

Nếu gặp vấn đề, kiểm tra:

1. Database migration đã chạy chưa
2. Backend server đã restart chưa
3. Console logs cho errors
4. Network requests trong DevTools
