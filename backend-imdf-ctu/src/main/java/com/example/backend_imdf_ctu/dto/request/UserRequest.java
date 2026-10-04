package com.example.backend_imdf_ctu.dto.request;

import com.example.backend_imdf_ctu.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRequest {

    private String fullName;

    private String username;

    private String email;

    private Role role;
}
