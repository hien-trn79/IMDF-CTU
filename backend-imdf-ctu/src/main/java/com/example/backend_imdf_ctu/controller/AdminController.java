package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.UserRequest;
import com.example.backend_imdf_ctu.dto.response.UserResponse;
import com.example.backend_imdf_ctu.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@CrossOrigin
@RequiredArgsConstructor
public class AdminController {


    private final UserService service;

    // [GET] /users/me
    @GetMapping("/me")
    public UserResponse getMe() {
        return service.getMe();
    }

    // [PUT] /users
    @PutMapping("/me")
    public UserResponse update(@RequestBody UserRequest request) {
        return service.update(request);
    }
}
