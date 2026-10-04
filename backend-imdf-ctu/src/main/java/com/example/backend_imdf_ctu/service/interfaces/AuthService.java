package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.LoginRequest;
import com.example.backend_imdf_ctu.dto.request.RegisterRequest;
import com.example.backend_imdf_ctu.dto.response.AuthResponse;

public interface AuthService {
    // Chuc nang Dang ky tai khoan nguoi dung
    AuthResponse register(RegisterRequest request);

    // Chuc nang Dang nhap tai khoan nguoi dung
    AuthResponse login(LoginRequest request);
}
