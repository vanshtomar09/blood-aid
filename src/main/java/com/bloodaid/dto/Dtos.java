package com.bloodaid.dto;

import com.bloodaid.domain.RequestStatus;
import com.bloodaid.domain.Role;
import com.bloodaid.domain.Urgency;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** All request/response shapes of the REST API, grouped in one place. */
public final class Dtos {

    private Dtos() {
    }

    // ---------- auth ----------

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotNull Role role,
            @Pattern(regexp = "^(A|B|AB|O)[+-]$", message = "Invalid blood type") String bloodType,
            @Size(max = 40) String phone) {
    }

    public record StaffCodeRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Size(max = 60) String employeeId,
            @NotNull Long bankId,
            @NotBlank @Size(max = 40) String phone,
            @NotBlank @Email @Size(max = 160) String email,
            @NotBlank @Size(min = 8, max = 72) String password) {
    }

    /** Returned after a verification code was issued. demoCode is only set in demo mode (no email configured). */
    public record CodeResponse(String message, String maskedEmail, int expiresInSeconds,
                               int resendAfterSeconds, String demoCode) {
    }

    public record VerifyRequest(
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = "^\\d{6}$", message = "Code must be 6 digits") String code) {
    }

    public record ResendRequest(@NotBlank @Email String email) {
    }

    public record UserDto(
            Long id,
            String fullName,
            String email,
            Role role,
            String bloodType,
            String phone,
            Long bankId,
            String bankName,
            Instant createdAt) {
    }

    public record AuthResponse(String token, UserDto user) {
    }

    // ---------- blood banks ----------

    public record BankDto(
            Long id,
            String name,
            String location,
            double latitude,
            double longitude,
            Double distanceKm,
            boolean distanceFromUser,
            String phone,
            String email,
            String openHours,
            Map<String, Integer> inventory,
            int totalUnits,
            String availability) {
    }

    public record InventoryUpdateRequest(@NotNull Map<String, Integer> inventory) {
    }

    // ---------- blood requests ----------

    public record CreateBloodRequest(
            @NotBlank @Size(min = 3, max = 120) String patientName,
            @NotBlank @Size(min = 10, max = 40) String contactNumber,
            @NotBlank @Pattern(regexp = "^(A|B|AB|O)[+-]$", message = "Invalid blood type") String bloodType,
            @NotNull @Min(1) @Max(50) Integer units,
            @NotNull Urgency urgency,
            @NotBlank @Size(min = 3, max = 200) String hospitalName,
            @Size(max = 1000) String notes) {
    }

    public record StatusUpdateRequest(@NotNull RequestStatus status) {
    }

    /** Full request, only shown to the requester, staff and admins. */
    public record BloodRequestDto(
            Long id,
            String patientName,
            String contactNumber,
            String bloodType,
            int units,
            Urgency urgency,
            String hospitalName,
            String notes,
            RequestStatus status,
            Instant createdAt,
            Instant updatedAt) {
    }

    /** Public view of a request: no patient name or phone number. */
    public record PublicRequestDto(
            Long id,
            String bloodType,
            String hospitalName,
            Urgency urgency,
            RequestStatus status,
            Instant createdAt) {
    }

    // ---------- misc public ----------

    public record CampDto(Long id, String name, String location, LocalDate date) {
    }

    public record SearchResponse(List<BankDto> banks, List<PublicRequestDto> requests) {
    }

    public record PublicStats(long totalUnits, long activeDonors, long openRequests, long bankCount) {
    }

    public record PublicConfig(boolean demoAccounts, boolean demoOtp, boolean aiEnabled) {
    }

    // ---------- dashboards ----------

    public record StaffStats(
            Long bankId,
            String bankName,
            long bankTotalUnits,
            List<String> lowStockTypes,
            long openRequests,
            long fulfilledThisMonth) {
    }

    public record AdminStats(
            long totalUnits,
            long activeDonors,
            long openRequests,
            long fulfilledThisMonth,
            long bankCount,
            Map<String, Long> usersByRole) {
    }

    // ---------- AI ----------

    public record ChatTurn(String role, String content) {
    }

    public record ChatRequest(
            @NotBlank @Size(max = 1000) String message,
            List<ChatTurn> history) {
    }

    public record ChatResponse(String reply, String source) {
    }

    public record PredictRequest(
            @NotBlank @Size(max = 20000) String historicalData,
            @NotBlank @Size(max = 2000) String seasonality,
            @NotBlank @Size(max = 2000) String localEvents) {
    }

    public record PredictResponse(String predictedDemand, String recommendations, String source) {
    }
}
