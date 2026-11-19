package com.bloodaid.service;

import com.bloodaid.domain.Role;
import com.bloodaid.domain.User;
import com.bloodaid.dto.Dtos;
import com.bloodaid.repository.BloodBankRepository;
import com.bloodaid.repository.UserRepository;
import com.bloodaid.web.ApiException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Two-step staff sign-up that mirrors the original app's "enter the code we sent you" flow.
 *
 * There is no SMS/email provider wired in. The code is written to the server log and, only when
 * app.staff.demo-otp is true, also returned to the browser so the demo can be completed.
 * Pending registrations live in memory and are lost on restart.
 */
@Service
public class StaffVerificationService {

    private static final Logger log = LoggerFactory.getLogger(StaffVerificationService.class);
    private static final long TTL_SECONDS = 600;
    private static final int MAX_ATTEMPTS = 5;

    private record Pending(String fullName, String employeeId, Long bankId, String phone,
                           String passwordHash, String code, Instant expiresAt, AtomicInteger attempts) {
    }

    private final Map<String, Pending> pending = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    private final UserRepository users;
    private final BloodBankRepository banks;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final boolean demoOtp;

    public StaffVerificationService(UserRepository users, BloodBankRepository banks,
                                    PasswordEncoder passwordEncoder, AuthService authService,
                                    @Value("${app.staff.demo-otp:true}") boolean demoOtp) {
        this.users = users;
        this.banks = banks;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.demoOtp = demoOtp;
    }

    public Dtos.StaffCodeResponse requestCode(Dtos.StaffCodeRequest request) {
        String email = UserService.normalizeEmail(request.email());
        if (users.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        if (!banks.existsById(request.bankId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please choose a valid blood bank.");
        }

        purgeExpired();
        String code = String.format("%06d", random.nextInt(1_000_000));
        pending.put(email, new Pending(
                request.fullName().trim(), request.employeeId().trim(), request.bankId(), request.phone().trim(),
                passwordEncoder.encode(request.password()), code,
                Instant.now().plusSeconds(TTL_SECONDS), new AtomicInteger()));

        log.info("Staff verification code for {} is {} (no SMS provider configured)", email, code);

        String message = demoOtp
                ? "Demo mode: no SMS is sent. Use the code shown below."
                : "A 6-digit verification code was generated. Ask your administrator for it.";
        return new Dtos.StaffCodeResponse(message, (int) TTL_SECONDS, demoOtp ? code : null);
    }

    @Transactional
    public Dtos.AuthResponse verify(Dtos.StaffVerifyRequest request) {
        String email = UserService.normalizeEmail(request.email());
        Pending p = pending.get(email);
        if (p == null || Instant.now().isAfter(p.expiresAt())) {
            pending.remove(email);
            throw new ApiException(HttpStatus.BAD_REQUEST, "The verification code expired. Please request a new one.");
        }
        if (p.attempts().incrementAndGet() > MAX_ATTEMPTS) {
            pending.remove(email);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Please request a new code.");
        }
        boolean match = MessageDigest.isEqual(
                p.code().getBytes(StandardCharsets.UTF_8), request.code().getBytes(StandardCharsets.UTF_8));
        if (!match) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Incorrect verification code.");
        }
        if (users.existsByEmail(email)) {
            pending.remove(email);
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        User user = new User();
        user.setFullName(p.fullName());
        user.setEmail(email);
        user.setPasswordHash(p.passwordHash());
        user.setRole(Role.STAFF);
        user.setPhone(p.phone());
        user.setEmployeeId(p.employeeId());
        user.setBankId(p.bankId());
        users.save(user);
        pending.remove(email);
        return authService.issueToken(user);
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        pending.values().removeIf(p -> now.isAfter(p.expiresAt()));
    }
}
