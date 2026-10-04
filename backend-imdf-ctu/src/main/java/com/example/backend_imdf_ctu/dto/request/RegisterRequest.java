package com.example.backend_imdf_ctu.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterRequest {

    private String email;

    private String password;
}
