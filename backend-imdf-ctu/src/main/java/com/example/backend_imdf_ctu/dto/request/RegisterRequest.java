package com.example.backend_imdf_ctu.dto.request;

import com.example.backend_imdf_ctu.enums.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterRequest {

    private String email;

    private String password;

    private Role role;
}
