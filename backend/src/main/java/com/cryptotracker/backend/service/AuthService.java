package com.cryptotracker.backend.service;

import com.cryptotracker.backend.dto.AuthResponse;
import com.cryptotracker.backend.dto.LoginRequest;
import com.cryptotracker.backend.dto.RegisterRequest;
import com.cryptotracker.backend.entity.User;
import com.cryptotracker.backend.repository.UserRepository;
import com.cryptotracker.backend.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Bu e-posta zaten kayıtlı.");
        }
        User user = new User();
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        userRepository.save(user);
        String token = jwtUtil.generateToken(req.email());
        return new AuthResponse(token, req.email());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new IllegalArgumentException("E-posta veya şifre hatalı."));
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new IllegalArgumentException("E-posta veya şifre hatalı.");
        }
        String token = jwtUtil.generateToken(req.email());
        return new AuthResponse(token, req.email());
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalStateException("Kullanıcı bulunamadı"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Mevcut şifre hatalı.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
