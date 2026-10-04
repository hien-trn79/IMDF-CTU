package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.entity.User;

public interface JwtService {

    String extractUsername(String token);

    String generateToken(User user);

    boolean isTokenValid(String token, User user);
}
