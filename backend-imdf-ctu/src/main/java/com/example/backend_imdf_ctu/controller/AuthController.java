package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.LoginRequest;
import com.example.backend_imdf_ctu.dto.request.RegisterRequest;
import com.example.backend_imdf_ctu.dto.response.AuthResponse;
import com.example.backend_imdf_ctu.service.interfaces.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@CrossOrigin
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    // Dang ky tai khoan nguoi dung
    @PostMapping("/register")
    public AuthResponse register(RegisterRequest request) {
        return service.register(request);
    }

    // Dang nhap tai khoan nguoi dung
    @PostMapping("/login")
    public AuthResponse login(LoginRequest request) {
        return service.login(request);
    }
}
