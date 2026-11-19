package com.bloodaid.service;

import com.bloodaid.domain.BloodBank;
import com.bloodaid.domain.BloodTypes;
import com.bloodaid.domain.InventoryItem;
import com.bloodaid.domain.Role;
import com.bloodaid.domain.User;
import com.bloodaid.dto.Dtos;
import com.bloodaid.repository.BloodBankRepository;
import com.bloodaid.repository.InventoryItemRepository;
import com.bloodaid.web.ApiException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BankService {

    private static final int LIMITED_STOCK_BELOW = 50;

    private final BloodBankRepository banks;
    private final InventoryItemRepository inventory;
    private final UserService userService;

    public BankService(BloodBankRepository banks, InventoryItemRepository inventory, UserService userService) {
        this.banks = banks;
        this.inventory = inventory;
        this.userService = userService;
    }

    /** Lists banks, nearest first. Optional filters: blood type in stock, free-text name/location. */
    @Transactional(readOnly = true)
    public List<Dtos.BankDto> list(Double lat, Double lng, String bloodType, String q) {
        if (bloodType != null && !bloodType.isBlank() && !BloodTypes.isValid(bloodType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown blood type.");
        }
        String needle = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        List<Dtos.BankDto> all = toDtos(banks.findAll(), lat, lng);

        return all.stream()
                .filter(b -> bloodType == null || bloodType.isBlank() || b.inventory().get(bloodType) > 0)
                .filter(b -> needle.isEmpty()
                        || b.name().toLowerCase(Locale.ROOT).contains(needle)
                        || b.location().toLowerCase(Locale.ROOT).contains(needle))
                .sorted(byDistance())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Dtos.BankDto get(Long id, Double lat, Double lng) {
        BloodBank bank = banks.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Blood bank not found."));
        return toDtos(List.of(bank), lat, lng).get(0);
    }

    /**
     * Search used by the header search box: bank name, location, or a blood type prefix
     * (for example "o" matches O+ and O-) that the bank has in stock.
     */
    @Transactional(readOnly = true)
    public List<Dtos.BankDto> search(String query, Double lat, Double lng) {
        String needle = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        if (needle.isEmpty()) {
            return List.of();
        }
        List<String> matchingTypes = BloodTypes.ALL.stream()
                .filter(t -> t.toLowerCase(Locale.ROOT).startsWith(needle))
                .toList();

        return toDtos(banks.findAll(), lat, lng).stream()
                .filter(b -> b.name().toLowerCase(Locale.ROOT).contains(needle)
                        || b.location().toLowerCase(Locale.ROOT).contains(needle)
                        || matchingTypes.stream().anyMatch(t -> b.inventory().get(t) > 0))
                .sorted(byDistance())
                .collect(Collectors.toList());
    }

    /** Replaces stock levels for the given blood types. Staff can only edit their own bank. */
    @Transactional
    public Dtos.BankDto updateInventory(Long bankId, Map<String, Integer> values, String actorEmail) {
        User actor = userService.requireByEmail(actorEmail);
        if (actor.getRole() == Role.STAFF && !bankId.equals(actor.getBankId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only update your own blood bank.");
        }
        if (!banks.existsById(bankId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Blood bank not found.");
        }
        for (Map.Entry<String, Integer> e : values.entrySet()) {
            if (!BloodTypes.isValid(e.getKey())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown blood type: " + e.getKey());
            }
            if (e.getValue() == null || e.getValue() < 0 || e.getValue() > 100000) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Units for " + e.getKey() + " must be between 0 and 100000.");
            }
        }

        Map<String, InventoryItem> existing = new HashMap<>();
        for (InventoryItem item : inventory.findByBankId(bankId)) {
            existing.put(item.getBloodType(), item);
        }
        List<InventoryItem> toSave = new ArrayList<>();
        for (Map.Entry<String, Integer> e : values.entrySet()) {
            InventoryItem item = existing.get(e.getKey());
            if (item == null) {
                item = new InventoryItem(bankId, e.getKey(), e.getValue());
            } else {
                item.setUnits(e.getValue());
            }
            toSave.add(item);
        }
        inventory.saveAll(toSave);
        return get(bankId, null, null);
    }

    // ---------- helpers ----------

    private List<Dtos.BankDto> toDtos(List<BloodBank> bankList, Double lat, Double lng) {
        if (bankList.isEmpty()) {
            return List.of();
        }
        List<Long> ids = bankList.stream().map(BloodBank::getId).toList();
        Map<Long, Map<String, Integer>> byBank = new HashMap<>();
        for (InventoryItem item : inventory.findByBankIdIn(ids)) {
            byBank.computeIfAbsent(item.getBankId(), k -> new HashMap<>()).put(item.getBloodType(), item.getUnits());
        }

        List<Dtos.BankDto> result = new ArrayList<>();
        for (BloodBank bank : bankList) {
            Map<String, Integer> raw = byBank.getOrDefault(bank.getId(), Map.of());
            Map<String, Integer> ordered = new LinkedHashMap<>();
            int total = 0;
            for (String type : BloodTypes.ALL) {
                int units = raw.getOrDefault(type, 0);
                ordered.put(type, units);
                total += units;
            }

            Double distance = bank.getDistanceKm();
            boolean fromUser = false;
            if (lat != null && lng != null) {
                distance = Math.round(GeoUtils.haversineKm(lat, lng, bank.getLatitude(), bank.getLongitude()) * 10.0) / 10.0;
                fromUser = true;
            }

            result.add(new Dtos.BankDto(bank.getId(), bank.getName(), bank.getLocation(),
                    bank.getLatitude(), bank.getLongitude(), distance, fromUser,
                    bank.getPhone(), bank.getEmail(), bank.getOpenHours(),
                    ordered, total, availability(total)));
        }
        return result;
    }

    static String availability(int totalUnits) {
        if (totalUnits <= 0) {
            return "UNAVAILABLE";
        }
        return totalUnits < LIMITED_STOCK_BELOW ? "LIMITED" : "AVAILABLE";
    }

    private static Comparator<Dtos.BankDto> byDistance() {
        return Comparator.comparing(Dtos.BankDto::distanceKm, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Dtos.BankDto::id);
    }
}
