package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.UserRequest;
import com.example.backend_imdf_ctu.dto.response.UserResponse;
import com.example.backend_imdf_ctu.entity.User;
import com.example.backend_imdf_ctu.enums.Role;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.mapper.UserMapper;
import com.example.backend_imdf_ctu.repository.UserRepository;
import com.example.backend_imdf_ctu.service.interfaces.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository repository;
    private final UserMapper mapper;

    @Override
    public List<UserResponse> getAllUsers() {
        return repository.findAll()
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public UserResponse create(UserRequest request) {
        User user = mapper.toEntity(request);
        return mapper.toResponse(repository.save(user));
    }

    @Override
    public UserResponse getUserById(Integer id) {
        return repository.findById(id)
            .map(mapper::toResponse)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    public UserResponse update(Integer userId, UserRequest request) {
        User user = repository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        mapper.update(user, request);
        return mapper.toResponse(repository.save(user));
    }

    @Override
    public void delete(Integer id) {
        User user = repository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        repository.delete(user);
    }
}
