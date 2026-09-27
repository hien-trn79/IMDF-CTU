package com.example.backend_imdf_ctu.exception;

public enum ErrorCode {

    // ===== COMMON =====
    INVALID_REQUEST(400, "Yêu cầu không hợp lệ"),
    UNAUTHORIZED(401, "Bạn chưa đăng nhập"),
    FORBIDDEN(403, "Bạn không có quyền thực hiện thao tác này"),
    RESOURCE_NOT_FOUND(404, "Không tìm thấy tài nguyên"),
    INTERNAL_SERVER_ERROR(500, "Đã xảy ra lỗi hệ thống"),

    // ===== BUILDING =====
    BUILDING_NOT_FOUND(404, "Không tìm thấy tòa nhà"),
    BUILDING_ALREADY_EXISTS(409, "Tòa nhà đã tồn tại"),

    // ===== ROOM =====
    ROOM_NOT_FOUND(404, "Không tìm thấy phòng"),
    ROOM_ALREADY_EXISTS(409, "Phòng đã tồn tại"),

    // ===== LEVEL =====
    LEVEL_NOT_FOUND(404, "Không tìm thấy tầng"),

    // ===== ROUTING =====
    ROUTE_NOT_FOUND(404, "Không tìm thấy đường đi"),
    INVALID_ROUTE_POINT(400, "Điểm bắt đầu hoặc điểm kết thúc không hợp lệ"),

    //    ===== GRID LINE =====
    GRID_LINE_NOT_FOUND(404, "Không tìm thấy topology line"),
    GRID_LINE_ALREADY_EXISTS(409, "Topology line đã tồn tại"),

    // ===== USER =====
    USER_NOT_FOUND(404, "Không tìm thấy người dùng"),
    USER_ALREADY_EXISTS(409, "Người dùng đã tồn tại");

    private final int status;
    private final String message;

    ErrorCode(int status, String message) {
        this.status = status;
        this.message = message;
    }

    public int getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}
