package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.UserRequest;
import com.example.backend_imdf_ctu.dto.response.UserResponse;
import com.example.backend_imdf_ctu.enums.Role;

import java.util.List;

public interface AdminService {

    List<UserResponse> getAllUsers();

    UserResponse create(UserRequest request);

    UserResponse getUserById(Integer id);

    UserResponse update(Integer userId, UserRequest request);

    void delete(Integer id);

}
