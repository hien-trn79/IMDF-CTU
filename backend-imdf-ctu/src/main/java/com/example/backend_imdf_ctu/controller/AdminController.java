package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.UserRequest;
import com.example.backend_imdf_ctu.dto.response.UserResponse;
import com.example.backend_imdf_ctu.service.interfaces.AdminService;
import com.example.backend_imdf_ctu.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@CrossOrigin
@RequiredArgsConstructor
public class AdminController {


    private final UserService service;
    private final AdminService adminService;

    // [GET] /users/me
    @GetMapping("/me")
    public UserResponse getMe() {
        return service.getMe();
    }

    // [GET] /users
    @GetMapping("/users")
    public List<UserResponse> getAllUsers() {
        return adminService.getAllUsers();
    }

    // [POST] /users
    @PostMapping("/users")
    public UserResponse create(@RequestBody UserRequest request) {
        return adminService.create(request);
    }

    // [PUT] /users/{id}
    @PutMapping("/users/{id}")
    public UserResponse update(
        @PathVariable Integer id,
        @RequestBody UserRequest request) {
        return adminService.update(id, request);
    }
    // [GET] /users/{id}
    @GetMapping("/users/{id}")
    public UserResponse getUserById(@PathVariable Integer id) {
        return adminService.getUserById(id);
    }

    // [DELETE] /users/{id}
    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Integer id) {
        adminService.delete(id);
    }

    // [PUT] /users
    @PutMapping("/me")
    public UserResponse update(@RequestBody UserRequest request) {
        return service.update(request);
    }
}
