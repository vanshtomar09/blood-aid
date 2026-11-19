package com.bloodaid.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String DEV_SECRET_PREFIX = "dev-only-secret";

    public record TokenClaims(Long userId, String email, String role) {
    }

    private final SecretKey key;
    private final long expirationMinutes;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-minutes:1440}") long expirationMinutes) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret (JWT_SECRET) must be at least 32 characters long");
        }
        if (secret.startsWith(DEV_SECRET_PREFIX)) {
            log.warn("Using the built-in development JWT secret. Set JWT_SECRET before deploying anywhere real.");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMinutes = expirationMinutes;
    }

    public String createToken(Long userId, String email, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(email)
                .claim("uid", userId)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    /** Returns the claims of a valid, unexpired token, or empty if the token is invalid in any way. */
    public Optional<TokenClaims> parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            Object uid = claims.get("uid");
            Object role = claims.get("role");
            if (claims.getSubject() == null || !(role instanceof String)) {
                return Optional.empty();
            }
            Long userId = uid instanceof Number ? Long.valueOf(((Number) uid).longValue()) : null;
            return Optional.of(new TokenClaims(userId, claims.getSubject(), (String) role));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
