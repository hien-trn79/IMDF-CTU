package com.example.backend_imdf_ctu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserResponse {
    private Integer id;

    private String fullName;

    private String username;

    private String email;

    private String role;

    private boolean isActive;

    private String numberPhone;

    private String createdAt;
}
