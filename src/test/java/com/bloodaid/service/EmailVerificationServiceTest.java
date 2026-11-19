package com.bloodaid.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bloodaid.domain.PendingRegistration;
import com.bloodaid.domain.Role;
import com.bloodaid.domain.User;
import com.bloodaid.dto.Dtos;
import com.bloodaid.repository.BloodBankRepository;
import com.bloodaid.repository.PendingRegistrationRepository;
import com.bloodaid.repository.UserRepository;
import com.bloodaid.web.ApiException;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class EmailVerificationServiceTest {

    private UserRepository users;
    private BloodBankRepository banks;
    private PendingRegistrationRepository pending;
    private PasswordEncoder encoder;
    private EmailSender emailSender;
    private AuthService authService;

    /** The row the service saved, so later calls to findById see it (a tiny in-memory stand-in for the table). */
    private PendingRegistration stored;

    private static Dtos.RegisterRequest donor(String email) {
        return new Dtos.RegisterRequest("Asha Rao", email, "password123", Role.DONOR, "O+", "9999999999");
    }

    private static Dtos.StaffCodeRequest staff(String email) {
        return new Dtos.StaffCodeRequest("Ravi Kumar", "EMP-7", 1L, "9999999999", email, "password123");
    }

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        banks = mock(BloodBankRepository.class);
        pending = mock(PendingRegistrationRepository.class);
        encoder = new BCryptPasswordEncoder(4);
        emailSender = mock(EmailSender.class);
        authService = mock(AuthService.class);
        stored = null;

        when(users.existsByEmail(any())).thenReturn(false);
        when(banks.existsById(1L)).thenReturn(true);
        when(pending.save(any(PendingRegistration.class))).thenAnswer(inv -> {
            stored = inv.getArgument(0);
            return stored;
        });
        when(pending.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(stored));
    }

    private EmailVerificationService service(boolean mailConfigured, boolean demoOtp) {
        when(emailSender.isConfigured()).thenReturn(mailConfigured);
        return new EmailVerificationService(users, banks, pending, encoder, emailSender, authService, demoOtp);
    }

    @Test
    void demoModeShowsCodeAndSendsNoEmail() {
        Dtos.CodeResponse res = service(false, true).startRegistration(donor("Asha@Example.com"));

        assertNotNull(res.demoCode());
        assertTrue(res.demoCode().matches("\\d{6}"));
        assertEquals("a***@example.com", res.maskedEmail());
        assertEquals("asha@example.com", stored.getEmail());
        verify(emailSender, never()).send(anyString(), anyString(), anyString());
    }

    @Test
    void theCodeIsStoredOnlyAsAHash() {
        Dtos.CodeResponse res = service(false, true).startRegistration(donor("a@example.com"));

        assertNotEquals(res.demoCode(), stored.getCodeHash());
        assertTrue(encoder.matches(res.demoCode(), stored.getCodeHash()));
        assertNotEquals("password123", stored.getPasswordHash());
    }

    @Test
    void whenMailIsConfiguredTheCodeIsEmailedAndNeverReturned() {
        Dtos.CodeResponse res = service(true, false).startRegistration(donor("a@example.com"));

        assertNull(res.demoCode());
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(emailSender).send(eq("a@example.com"), anyString(), body.capture());
        assertTrue(body.getValue().matches("(?s).*code is: \\d{6}.*"));
        String code = body.getValue().replaceAll("(?s).*code is: (\\d{6}).*", "$1");
        assertTrue(encoder.matches(code, stored.getCodeHash()));
    }

    @Test
    void refusesToSignUpWhenThereIsNoMailAndNoDemoMode() {
        EmailVerificationService svc = service(false, false);

        ApiException ex = assertThrows(ApiException.class, () -> svc.startRegistration(donor("a@example.com")));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
        verify(pending, never()).save(any());
    }

    @Test
    void emailFailureIsReportedAsBadGateway() {
        EmailVerificationService svc = service(true, false);
        doThrow(new IllegalStateException("smtp down")).when(emailSender).send(anyString(), anyString(), anyString());

        ApiException ex = assertThrows(ApiException.class, () -> svc.startRegistration(donor("a@example.com")));
        assertEquals(HttpStatus.BAD_GATEWAY, ex.getStatus());
    }

    @Test
    void existingAccountIsRejected() {
        when(users.existsByEmail("a@example.com")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class,
                () -> service(false, true).startRegistration(donor("a@example.com")));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void donorNeedsABloodType() {
        Dtos.RegisterRequest noType = new Dtos.RegisterRequest("Asha", "a@example.com", "password123", Role.DONOR, null, null);

        ApiException ex = assertThrows(ApiException.class, () -> service(false, true).startRegistration(noType));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void staffMustPickARealBank() {
        when(banks.existsById(99L)).thenReturn(false);
        Dtos.StaffCodeRequest bad = new Dtos.StaffCodeRequest("Ravi", "E1", 99L, "9999999999", "r@example.com", "password123");

        ApiException ex = assertThrows(ApiException.class, () -> service(false, true).startStaffRegistration(bad));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void rightCodeCreatesTheDonorAndRemovesThePendingRow() {
        EmailVerificationService svc = service(false, true);
        String code = svc.startRegistration(donor("a@example.com")).demoCode();
        Dtos.AuthResponse signedIn = new Dtos.AuthResponse("token", null);
        when(authService.issueToken(any(User.class))).thenReturn(signedIn);

        Dtos.AuthResponse res = svc.verify(new Dtos.VerifyRequest("a@example.com", code));

        assertEquals("token", res.token());
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertEquals(Role.DONOR, saved.getValue().getRole());
        assertEquals("O+", saved.getValue().getBloodType());
        assertEquals("a@example.com", saved.getValue().getEmail());
        verify(pending).delete(stored);
    }

    @Test
    void rightCodeCreatesStaffLinkedToTheirBank() {
        EmailVerificationService svc = service(false, true);
        String code = svc.startStaffRegistration(staff("r@example.com")).demoCode();
        when(authService.issueToken(any(User.class))).thenReturn(new Dtos.AuthResponse("t", null));

        svc.verify(new Dtos.VerifyRequest("r@example.com", code));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertEquals(Role.STAFF, saved.getValue().getRole());
        assertEquals(1L, saved.getValue().getBankId());
        assertEquals("EMP-7", saved.getValue().getEmployeeId());
    }

    @Test
    void wrongCodeIsCountedAndRejected() {
        EmailVerificationService svc = service(false, true);
        String code = svc.startRegistration(donor("a@example.com")).demoCode();
        String wrong = code.equals("000000") ? "111111" : "000000";

        ApiException ex = assertThrows(ApiException.class,
                () -> svc.verify(new Dtos.VerifyRequest("a@example.com", wrong)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals(1, stored.getAttempts());
        verify(users, never()).save(any());
    }

    @Test
    void fiveWrongCodesLockTheSignUp() {
        EmailVerificationService svc = service(false, true);
        String code = svc.startRegistration(donor("a@example.com")).demoCode();
        String wrong = code.equals("000000") ? "111111" : "000000";
        PendingRegistration row = stored;

        for (int i = 0; i < 4; i++) {
            assertThrows(ApiException.class, () -> svc.verify(new Dtos.VerifyRequest("a@example.com", wrong)));
        }
        ApiException last = assertThrows(ApiException.class,
                () -> svc.verify(new Dtos.VerifyRequest("a@example.com", wrong)));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, last.getStatus());
        verify(pending).delete(row);
    }

    @Test
    void expiredCodeIsRejectedAndRemoved() {
        EmailVerificationService svc = service(false, true);
        String code = svc.startRegistration(donor("a@example.com")).demoCode();
        stored.setExpiresAt(Instant.now().minusSeconds(1));

        ApiException ex = assertThrows(ApiException.class,
                () -> svc.verify(new Dtos.VerifyRequest("a@example.com", code)));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(pending).delete(stored);
        verify(users, never()).save(any());
    }

    @Test
    void verifyWithoutASignUpIsRejected() {
        ApiException ex = assertThrows(ApiException.class,
                () -> service(false, true).verify(new Dtos.VerifyRequest("nobody@example.com", "123456")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void resendIsBlockedDuringTheCooldownAndAllowedAfterIt() {
        EmailVerificationService svc = service(false, true);
        String first = svc.startRegistration(donor("a@example.com")).demoCode();

        ApiException ex = assertThrows(ApiException.class,
                () -> svc.resend(new Dtos.ResendRequest("a@example.com")));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());

        stored.setLastSentAt(Instant.now().minusSeconds(60));
        Dtos.CodeResponse again = svc.resend(new Dtos.ResendRequest("a@example.com"));

        assertNotNull(again.demoCode());
        assertEquals(0, stored.getAttempts());
        assertTrue(encoder.matches(again.demoCode(), stored.getCodeHash()));
        assertFalse(first.isEmpty());
    }

    @Test
    void signingUpTwiceInQuickSuccessionIsThrottled() {
        EmailVerificationService svc = service(false, true);
        svc.startRegistration(donor("a@example.com"));

        ApiException ex = assertThrows(ApiException.class, () -> svc.startRegistration(donor("a@example.com")));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
    }

    @Test
    void emailsAreMaskedForDisplay() {
        assertEquals("a***@example.com", EmailVerificationService.maskEmail("asha@example.com"));
        assertEquals("***@x.io", EmailVerificationService.maskEmail("a@x.io"));
    }
}
