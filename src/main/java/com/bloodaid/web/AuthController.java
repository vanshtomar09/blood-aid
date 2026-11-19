package com.bloodaid.web;

import com.bloodaid.dto.Dtos;
import com.bloodaid.service.AuthService;
import com.bloodaid.service.StaffVerificationService;
import com.bloodaid.service.UserService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;
    private final StaffVerificationService staffService;
    private final UserService userService;

    public AuthController(AuthService authService, StaffVerificationService staffService, UserService userService) {
        this.authService = authService;
        this.staffService = staffService;
        this.userService = userService;
    }

    @PostMapping("/auth/register")
    public Dtos.AuthResponse register(@Valid @RequestBody Dtos.RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/auth/login")
    public Dtos.AuthResponse login(@Valid @RequestBody Dtos.LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/auth/staff/code")
    public Dtos.StaffCodeResponse staffCode(@Valid @RequestBody Dtos.StaffCodeRequest request) {
        return staffService.requestCode(request);
    }

    @PostMapping("/auth/staff/verify")
    public Dtos.AuthResponse staffVerify(@Valid @RequestBody Dtos.StaffVerifyRequest request) {
        return staffService.verify(request);
    }

    @GetMapping("/me")
    public Dtos.UserDto me(Principal principal) {
        return userService.me(principal.getName());
    }
}
