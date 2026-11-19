package com.bloodaid.service;

import com.bloodaid.domain.BloodBank;
import com.bloodaid.domain.User;
import com.bloodaid.dto.Dtos;
import com.bloodaid.repository.BloodBankRepository;
import com.bloodaid.repository.UserRepository;
import com.bloodaid.web.ApiException;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository users;
    private final BloodBankRepository banks;

    public UserService(UserRepository users, BloodBankRepository banks) {
        this.users = users;
        this.banks = banks;
    }

    public static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public User requireByEmail(String email) {
        return users.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in again."));
    }

    @Transactional(readOnly = true)
    public Dtos.UserDto toDto(User user) {
        String bankName = null;
        if (user.getBankId() != null) {
            bankName = banks.findById(user.getBankId()).map(BloodBank::getName).orElse(null);
        }
        return new Dtos.UserDto(user.getId(), user.getFullName(), user.getEmail(), user.getRole(),
                user.getBloodType(), user.getPhone(), user.getBankId(), bankName, user.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public Dtos.UserDto me(String email) {
        return toDto(requireByEmail(email));
    }

    @Transactional(readOnly = true)
    public List<Dtos.UserDto> recentUsers(int limit) {
        return users.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit)).stream().map(this::toDto).toList();
    }
}
