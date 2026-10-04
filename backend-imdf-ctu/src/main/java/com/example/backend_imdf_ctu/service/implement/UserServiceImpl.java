package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.UserRequest;
import com.example.backend_imdf_ctu.dto.response.UserResponse;
import com.example.backend_imdf_ctu.entity.User;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.UserMapper;
import com.example.backend_imdf_ctu.repository.UserRepository;
import com.example.backend_imdf_ctu.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository repository;
    private final UserMapper mapper;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = repository.findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_NOT_FOUND));

        return user;
    }

    @Override
    public UserResponse getMe() {
        User user = getCurrentUser();
        return mapper.toResponse(user);
    }

    @Override
    public UserResponse update(UserRequest request) {
        User user = getCurrentUser();

        mapper.update(user, request);

        return mapper.toResponse(repository.save(user));
    }
}
