package com.bloodaid.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bloodaid.domain.Role;
import com.bloodaid.domain.User;
import com.bloodaid.dto.Dtos;
import com.bloodaid.repository.BloodBankRepository;
import com.bloodaid.repository.UserRepository;
import com.bloodaid.web.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

class StaffVerificationServiceTest {

    private UserRepository users;
    private BloodBankRepository banks;
    private PasswordEncoder encoder;
    private AuthService authService;

    private static Dtos.StaffCodeRequest request(String email) {
        return new Dtos.StaffCodeRequest("Asha Rao", "EMP-7", 1L, "9999999999", email, "password123");
    }

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        banks = mock(BloodBankRepository.class);
        encoder = mock(PasswordEncoder.class);
        authService = mock(AuthService.class);
        when(users.existsByEmail(any())).thenReturn(false);
        when(banks.existsById(1L)).thenReturn(true);
        when(encoder.encode(any())).thenReturn("hashed");
    }

    private StaffVerificationService service(boolean demoOtp) {
        return new StaffVerificationService(users, banks, encoder, authService, demoOtp);
    }

    @Test
    void demoModeReturnsSixDigitCode() {
        Dtos.StaffCodeResponse res = service(true).requestCode(request("a@example.com"));

        assertNotNull(res.demoCode());
        assertTrue(res.demoCode().matches("\\d{6}"));
    }

    @Test
    void nonDemoModeDoesNotLeakTheCode() {
        assertNull(service(false).requestCode(request("a@example.com")).demoCode());
    }

    @Test
    void unknownBankIsRejected() {
        when(banks.existsById(1L)).thenReturn(false);

        ApiException ex = assertThrows(ApiException.class, () -> service(true).requestCode(request("a@example.com")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void existingEmailIsRejected() {
        when(users.existsByEmail("a@example.com")).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> service(true).requestCode(request("a@example.com")));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void wrongCodeIsRejectedAndRightCodeCreatesStaffUser() {
        StaffVerificationService service = service(true);
        String code = service.requestCode(request("a@example.com")).demoCode();
        String wrong = code.equals("000000") ? "111111" : "000000";

        ApiException ex = assertThrows(ApiException.class,
                () -> service.verify(new Dtos.StaffVerifyRequest("a@example.com", wrong)));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());

        service.verify(new Dtos.StaffVerifyRequest("a@example.com", code));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertEquals(Role.STAFF, saved.getValue().getRole());
        assertEquals("a@example.com", saved.getValue().getEmail());
        assertEquals(Long.valueOf(1L), saved.getValue().getBankId());
        assertEquals("hashed", saved.getValue().getPasswordHash());
    }

    @Test
    void verifyWithoutPendingRegistrationFails() {
        ApiException ex = assertThrows(ApiException.class,
                () -> service(true).verify(new Dtos.StaffVerifyRequest("nobody@example.com", "123456")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }
}
