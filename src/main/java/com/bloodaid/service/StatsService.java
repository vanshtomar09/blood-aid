package com.bloodaid.service;

import com.bloodaid.domain.BloodBank;
import com.bloodaid.domain.BloodTypes;
import com.bloodaid.domain.InventoryItem;
import com.bloodaid.domain.RequestStatus;
import com.bloodaid.domain.Role;
import com.bloodaid.domain.User;
import com.bloodaid.dto.Dtos;
import com.bloodaid.repository.BloodBankRepository;
import com.bloodaid.repository.BloodRequestRepository;
import com.bloodaid.repository.InventoryItemRepository;
import com.bloodaid.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatsService {

    /** A blood type with fewer units than this at a bank is reported as low stock. */
    static final int LOW_STOCK_BELOW = 10;

    private final BloodBankRepository banks;
    private final InventoryItemRepository inventory;
    private final UserRepository users;
    private final BloodRequestRepository requests;
    private final UserService userService;

    public StatsService(BloodBankRepository banks, InventoryItemRepository inventory, UserRepository users,
                        BloodRequestRepository requests, UserService userService) {
        this.banks = banks;
        this.inventory = inventory;
        this.users = users;
        this.requests = requests;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public Dtos.PublicStats publicStats() {
        return new Dtos.PublicStats(totalUnits(), users.countByRole(Role.DONOR), openRequests(), banks.count());
    }

    @Transactional(readOnly = true)
    public Dtos.AdminStats adminStats() {
        Map<String, Long> byRole = new LinkedHashMap<>();
        for (Role role : Role.values()) {
            byRole.put(role.name(), users.countByRole(role));
        }
        return new Dtos.AdminStats(totalUnits(), users.countByRole(Role.DONOR), openRequests(),
                fulfilledThisMonth(), banks.count(), byRole);
    }

    @Transactional(readOnly = true)
    public Dtos.StaffStats staffStats(String email) {
        User user = userService.requireByEmail(email);
        Long bankId = user.getBankId();
        String bankName = null;
        long bankTotal = 0;
        List<String> low = new ArrayList<>();

        if (bankId != null) {
            bankName = banks.findById(bankId).map(BloodBank::getName).orElse(null);
            Map<String, Integer> units = new HashMap<>();
            for (InventoryItem item : inventory.findByBankId(bankId)) {
                units.put(item.getBloodType(), item.getUnits());
                bankTotal += item.getUnits();
            }
            for (String type : BloodTypes.ALL) {
                if (units.getOrDefault(type, 0) < LOW_STOCK_BELOW) {
                    low.add(type);
                }
            }
        }
        return new Dtos.StaffStats(bankId, bankName, bankTotal, low, openRequests(), fulfilledThisMonth());
    }

    private long totalUnits() {
        long total = 0;
        for (InventoryItem item : inventory.findAll()) {
            total += item.getUnits();
        }
        return total;
    }

    private long openRequests() {
        return requests.countByStatusIn(RequestService.OPEN_STATUSES);
    }

    private long fulfilledThisMonth() {
        Instant startOfMonth = LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        return requests.countByStatusAndUpdatedAtGreaterThanEqual(RequestStatus.FULFILLED, startOfMonth);
    }
}
