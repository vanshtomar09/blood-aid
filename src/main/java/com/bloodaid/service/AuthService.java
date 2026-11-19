package com.bloodaid.service;

import com.bloodaid.domain.Role;
import com.bloodaid.domain.User;
import com.bloodaid.dto.Dtos;
import com.bloodaid.repository.UserRepository;
import com.bloodaid.security.JwtService;
import com.bloodaid.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, UserService userService,
                       PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public Dtos.AuthResponse register(Dtos.RegisterRequest request) {
        if (request.role() != Role.DONOR && request.role() != Role.RECIPIENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only donor or recipient accounts can be created here.");
        }
        if (request.role() == Role.DONOR && (request.bloodType() == null || request.bloodType().isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Blood type is required for donors.");
        }
        String email = UserService.normalizeEmail(request.email());
        if (users.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setBloodType(request.bloodType() == null || request.bloodType().isBlank() ? null : request.bloodType());
        user.setPhone(request.phone() == null || request.phone().isBlank() ? null : request.phone().trim());
        users.save(user);
        return issueToken(user);
    }

    @Transactional(readOnly = true)
    public Dtos.AuthResponse login(Dtos.LoginRequest request) {
        User user = users.findByEmail(UserService.normalizeEmail(request.email()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
        return issueToken(user);
    }

    public Dtos.AuthResponse issueToken(User user) {
        String token = jwtService.createToken(user.getId(), user.getEmail(), user.getRole().name());
        return new Dtos.AuthResponse(token, userService.toDto(user));
    }
}
