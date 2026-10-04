package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.UserRequest;
import com.example.backend_imdf_ctu.dto.response.UserResponse;

public interface UserService {

    UserResponse getMe();

    UserResponse update(UserRequest request);
}
