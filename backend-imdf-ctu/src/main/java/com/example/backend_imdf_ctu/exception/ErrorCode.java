package com.example.backend_imdf_ctu.exception;

public enum ErrorCode {
    ANCHOR_NOT_FOUND(404, "Không tìm thấy anchor"),

    OPENING_CATEGORY_NOT_FOUND(404, "Không tìm thấy loại opening"),
    OPENING_NOT_FOUND(404, "Không tìm thấy lối vào - opening"),

    VENUE_NOT_FOUND(404, "Không tìm thấy địa điểm"),
    VENUE_CATEGORY_NOT_FOUND(404, "Không tìm thấy loại địa điểm"),
    ADDRESS_NOT_FOUND(404, "Không tìm thấy địa chỉ"),

    FEATURE_NOT_FOUND(404, "Không tìm thấy feature"),
    RESTRICTION_CATEGORY_NOT_FOUND(404, "Không tìm thấy restriction category"),

    BUILDING_NOT_FOUND(404, "Không tìm thấy building"),
    BUILDING_CATEGORY_NOT_FOUND(404, "Không tìm thấy building category"),

    LEVEL_CATEGORY_NOT_FOUND(404, "Không tìm thấy level category"),

    LEVEL_NOT_FOUND(404, "Không tìm thấy level"),

    UNIT_CATEGORY_NOT_FOUND(404, "Không tìm thấy unit category"),
    UNIT_NOT_FOUND(404, "Không tìm thấy unit"),

    SECTION_CATEGORY_NOT_FOUND(404, "Không tìm thấy section category"),
    SECTION_NOT_FOUND(404, "Không tìm thấy section"),

    RELATIONSHIP_CATEGORY_NOT_FOUND(404, "Không tìm thấy relationship category"),
    RELATIONSHIP_NOT_FOUND(404, "Không tìm thấy relationship"),
    // ===== ROUTING =====
    ROUTE_NOT_FOUND(404, "Không tìm thấy đường đi"),

    //    ===== GRID LINE =====
    GRID_LINE_NOT_FOUND(404, "Không tìm thấy topology line"),

    // ==== NETWORK NODES ====
    NETWORK_NODES_NOT_FOUND(404, "Không tìm thấy network node"),

    // ==== NETWORK EDGES ====
    NETWORK_EDGES_NOT_FOUND(404, "Không tìm thấy network edge"),

    // ===== USER =====
    USER_NOT_FOUND(404, "Không tìm thấy người dùng"),

    EMAIL_ALREADY_EXISTS(409, "Email đã tồn tại"),
    EMAIL_NOT_FOUND(404, "Không tìm thấy người dùng với email"),
    INVALID_CREDENTIALS(401, "Email hoặc mật khẩu không đúng"),

    INVALID_GEOMETRY(400, "Hình học không hợp lệ"),
    ;

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
