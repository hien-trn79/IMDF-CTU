package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.UserRequest;
import com.example.backend_imdf_ctu.dto.response.UserResponse;
import com.example.backend_imdf_ctu.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(UserRequest request) {
        return User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .email(request.getEmail())
                .role(request.getRole())
                .isActive(request.isActive())
                .build();
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getUserId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .isActive(user.isActive())
                .build();
    }

    public void update(User user, UserRequest request) {
        user.setFullName(request.getFullName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setActive(request.isActive());
    }
}
