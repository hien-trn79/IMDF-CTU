package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.request.LoginRequest;
import com.example.backend_imdf_ctu.dto.request.RegisterRequest;
import com.example.backend_imdf_ctu.dto.response.AuthResponse;
import com.example.backend_imdf_ctu.entity.User;
import com.example.backend_imdf_ctu.enums.Role;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.repository.UserRepository;
import com.example.backend_imdf_ctu.service.interfaces.AuthService;
import com.example.backend_imdf_ctu.service.interfaces.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (repository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email đã tồn tại: " + request.getEmail());
        }

        // Tao User moi tu request va luu vao database
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword())) // MẬT KHẨU ĐƯỢC MÃ HÓA BCRYPT
            .role(request.getRole() != null ? request.getRole() : Role.USER) // Mặc định là ROLE_USER
            .build();

        // Save User
        repository.save(user);

        // Tạo JWT Token cho User mới
        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
            .email(user.getEmail())
            .role(user.getRole().name())
            .token(jwtToken)
            .build();
    }

    // Dang Nhap
    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );
        } catch (BadCredentialsException e) {
            throw new BusinessException(
                ErrorCode.INVALID_CREDENTIALS,
                "Email hoặc mật khẩu không đúng"
            );
        }

        User existingUser = repository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BusinessException(
                ErrorCode.EMAIL_NOT_FOUND,
                "Không tìm thấy người dùng với email: " + request.getEmail()
            ));

        // Tao JWT Token cho User
        String jwtToken = jwtService.generateToken(existingUser);

        return AuthResponse.builder()
            .email(existingUser.getEmail())
            .role(existingUser.getRole().name())
            .token(jwtToken)
            .build();
    }

}
