package com.bloodaid.web;

import com.bloodaid.dto.Dtos;
import com.bloodaid.service.AuthService;
import com.bloodaid.service.EmailVerificationService;
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
    private final EmailVerificationService verification;
    private final UserService userService;

    public AuthController(AuthService authService, EmailVerificationService verification, UserService userService) {
        this.authService = authService;
        this.verification = verification;
        this.userService = userService;
    }

    /** Step 1 for donors and recipients: validates, stores the sign-up and emails a code. */
    @PostMapping("/auth/register")
    public Dtos.CodeResponse register(@Valid @RequestBody Dtos.RegisterRequest request) {
        return verification.startRegistration(request);
    }

    @PostMapping("/auth/login")
    public Dtos.AuthResponse login(@Valid @RequestBody Dtos.LoginRequest request) {
        return authService.login(request);
    }

    /** Step 1 for blood bank staff. */
    @PostMapping("/auth/staff/code")
    public Dtos.CodeResponse staffCode(@Valid @RequestBody Dtos.StaffCodeRequest request) {
        return verification.startStaffRegistration(request);
    }

    @PostMapping("/auth/resend")
    public Dtos.CodeResponse resend(@Valid @RequestBody Dtos.ResendRequest request) {
        return verification.resend(request);
    }

    /** Step 2 for every role: the right code creates the account and signs the user in. */
    @PostMapping("/auth/verify")
    public Dtos.AuthResponse verify(@Valid @RequestBody Dtos.VerifyRequest request) {
        return verification.verify(request);
    }

    @GetMapping("/me")
    public Dtos.UserDto me(Principal principal) {
        return userService.me(principal.getName());
    }
}
