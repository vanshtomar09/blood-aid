package com.bloodaid.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-0123456789-abcdefghijklmnop";

    @Test
    void createdTokenCanBeParsed() {
        JwtService service = new JwtService(SECRET, 5);
        String token = service.createToken(7L, "staff@example.com", "STAFF");

        Optional<JwtService.TokenClaims> claims = service.parse(token);

        assertTrue(claims.isPresent());
        assertEquals(7L, claims.get().userId());
        assertEquals("staff@example.com", claims.get().email());
        assertEquals("STAFF", claims.get().role());
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        JwtService issuer = new JwtService(SECRET, 5);
        JwtService other = new JwtService("a-completely-different-secret-0123456789-xyz", 5);

        assertFalse(other.parse(issuer.createToken(1L, "a@example.com", "ADMIN")).isPresent());
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService service = new JwtService(SECRET, -1);

        assertFalse(service.parse(service.createToken(1L, "a@example.com", "DONOR")).isPresent());
    }

    @Test
    void garbageIsRejected() {
        JwtService service = new JwtService(SECRET, 5);

        assertFalse(service.parse("not-a-jwt").isPresent());
        assertFalse(service.parse("").isPresent());
    }

    @Test
    void shortSecretIsRefused() {
        assertThrows(IllegalStateException.class, () -> new JwtService("too-short", 5));
    }
}
