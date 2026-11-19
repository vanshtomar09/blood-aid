package com.bloodaid.service;

import com.bloodaid.domain.PendingRegistration;
import com.bloodaid.domain.Role;
import com.bloodaid.domain.User;
import com.bloodaid.dto.Dtos;
import com.bloodaid.repository.BloodBankRepository;
import com.bloodaid.repository.PendingRegistrationRepository;
import com.bloodaid.repository.UserRepository;
import com.bloodaid.web.ApiException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Email verification for every sign-up (donor, recipient, staff).
 *
 * Step 1: the details are checked and stored as a pending registration together with a hash of a 6-digit code,
 * and the code is emailed. Nothing is added to the users table yet.
 * Step 2: the right code turns the pending registration into a real account and signs the user in.
 *
 * Codes expire after 10 minutes, allow 5 wrong tries and can be re-sent every 30 seconds.
 * If no mail server is configured and app.otp.demo is true, the code is returned in the response and logged
 * instead (demo only). With neither, sign-up is refused.
 */
@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    static final long TTL_SECONDS = 600;
    static final int MAX_ATTEMPTS = 5;
    static final long RESEND_AFTER_SECONDS = 30;

    private final SecureRandom random = new SecureRandom();

    private final UserRepository users;
    private final BloodBankRepository banks;
    private final PendingRegistrationRepository pending;
    private final PasswordEncoder passwordEncoder;
    private final EmailSender emailSender;
    private final AuthService authService;
    private final boolean demoOtp;

    public EmailVerificationService(UserRepository users, BloodBankRepository banks,
                                    PendingRegistrationRepository pending, PasswordEncoder passwordEncoder,
                                    EmailSender emailSender, AuthService authService,
                                    @Value("${app.otp.demo:true}") boolean demoOtp) {
        this.users = users;
        this.banks = banks;
        this.pending = pending;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
        this.authService = authService;
        this.demoOtp = demoOtp;
    }

    // ------------------------------------------------------------ step 1

    @Transactional
    public Dtos.CodeResponse startRegistration(Dtos.RegisterRequest request) {
        if (request.role() != Role.DONOR && request.role() != Role.RECIPIENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only donor or recipient accounts can be created here.");
        }
        if (request.role() == Role.DONOR && (request.bloodType() == null || request.bloodType().isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Blood type is required for donors.");
        }
        String email = UserService.normalizeEmail(request.email());
        ensureEmailIsFree(email);
        pending.findById(email).ifPresent(this::enforceResendCooldown);

        PendingRegistration p = new PendingRegistration();
        p.setEmail(email);
        p.setFullName(request.fullName().trim());
        p.setRole(request.role());
        p.setPasswordHash(passwordEncoder.encode(request.password()));
        p.setBloodType(blankToNull(request.bloodType()));
        p.setPhone(blankToNull(request.phone()));
        return issueCode(p);
    }

    @Transactional
    public Dtos.CodeResponse startStaffRegistration(Dtos.StaffCodeRequest request) {
        String email = UserService.normalizeEmail(request.email());
        ensureEmailIsFree(email);
        pending.findById(email).ifPresent(this::enforceResendCooldown);
        if (!banks.existsById(request.bankId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please choose a valid blood bank.");
        }

        PendingRegistration p = new PendingRegistration();
        p.setEmail(email);
        p.setFullName(request.fullName().trim());
        p.setRole(Role.STAFF);
        p.setPasswordHash(passwordEncoder.encode(request.password()));
        p.setPhone(blankToNull(request.phone()));
        p.setEmployeeId(request.employeeId().trim());
        p.setBankId(request.bankId());
        return issueCode(p);
    }

    @Transactional
    public Dtos.CodeResponse resend(Dtos.ResendRequest request) {
        String email = UserService.normalizeEmail(request.email());
        PendingRegistration p = pending.findById(email).orElseThrow(() -> new ApiException(
                HttpStatus.BAD_REQUEST, "No sign-up is waiting for this email. Please start again."));
        enforceResendCooldown(p);
        return issueCode(p);
    }

    // ------------------------------------------------------------ step 2

    /** noRollbackFor: a wrong code must still be counted, and an expired sign-up must still be removed. */
    @Transactional(noRollbackFor = ApiException.class)
    public Dtos.AuthResponse verify(Dtos.VerifyRequest request) {
        String email = UserService.normalizeEmail(request.email());
        PendingRegistration p = pending.findById(email).orElseThrow(() -> new ApiException(
                HttpStatus.BAD_REQUEST, "This code is no longer valid. Please sign up again."));

        if (Instant.now().isAfter(p.getExpiresAt())) {
            pending.delete(p);
            throw new ApiException(HttpStatus.BAD_REQUEST, "The code expired. Please sign up again.");
        }
        if (!passwordEncoder.matches(request.code(), p.getCodeHash())) {
            p.setAttempts(p.getAttempts() + 1);
            if (p.getAttempts() >= MAX_ATTEMPTS) {
                pending.delete(p);
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many wrong codes. Please sign up again.");
            }
            pending.save(p);
            int left = MAX_ATTEMPTS - p.getAttempts();
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Incorrect code. " + left + (left == 1 ? " try" : " tries") + " left.");
        }
        if (users.existsByEmail(email)) {
            pending.delete(p);
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        User user = new User();
        user.setFullName(p.getFullName());
        user.setEmail(email);
        user.setPasswordHash(p.getPasswordHash());
        user.setRole(p.getRole());
        user.setBloodType(p.getBloodType());
        user.setPhone(p.getPhone());
        user.setEmployeeId(p.getEmployeeId());
        user.setBankId(p.getBankId());
        users.save(user);
        pending.delete(p);
        return authService.issueToken(user);
    }

    // ------------------------------------------------------------ helpers

    private Dtos.CodeResponse issueCode(PendingRegistration p) {
        boolean mail = emailSender.isConfigured();
        if (!mail && !demoOtp) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Email delivery is not configured on this server.");
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        Instant now = Instant.now();
        pending.deleteExpiredExcept(now, p.getEmail()); // keep abandoned sign-ups from piling up
        p.setCodeHash(passwordEncoder.encode(code));
        p.setAttempts(0);
        p.setLastSentAt(now);
        p.setExpiresAt(now.plusSeconds(TTL_SECONDS));
        pending.save(p);

        String masked = maskEmail(p.getEmail());
        if (mail) {
            try {
                emailSender.send(p.getEmail(), "Your BloodAid verification code", emailBody(p.getFullName(), code));
            } catch (RuntimeException e) {
                log.warn("Could not send the verification email to {}: {}", masked, e.getMessage());
                throw new ApiException(HttpStatus.BAD_GATEWAY,
                        "We could not send the email. Check the address or try again in a moment.");
            }
            return new Dtos.CodeResponse("We sent a 6-digit code to " + masked + ". It expires in 10 minutes.",
                    masked, (int) TTL_SECONDS, (int) RESEND_AFTER_SECONDS, null);
        }

        log.info("Verification code for {} is {} (demo mode: no mail server configured)", masked, code);
        return new Dtos.CodeResponse(
                "Demo mode: email is not set up, so the code is shown here instead of being emailed.",
                masked, (int) TTL_SECONDS, (int) RESEND_AFTER_SECONDS, code);
    }

    /** One email per 30 seconds per address, so the form cannot be used to flood someone's inbox. */
    private void enforceResendCooldown(PendingRegistration p) {
        long remaining = RESEND_AFTER_SECONDS - Duration.between(p.getLastSentAt(), Instant.now()).getSeconds();
        if (remaining > 0) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Please wait " + remaining + " seconds before asking for another code.");
        }
    }

    private void ensureEmailIsFree(String email) {
        if (users.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
    }

    static String emailBody(String fullName, String code) {
        String first = fullName == null || fullName.isBlank() ? "there" : fullName.trim().split("\\s+")[0];
        return "Hi " + first + ",\n\n"
                + "Your BloodAid verification code is: " + code + "\n\n"
                + "It expires in 10 minutes. If you did not try to sign up, you can ignore this email.\n\n"
                + "BloodAid";
    }

    static String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***" + (at < 0 ? "" : email.substring(at));
        }
        return email.charAt(0) + "***" + email.substring(at);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
