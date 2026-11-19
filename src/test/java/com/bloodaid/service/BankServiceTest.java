package com.bloodaid.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.bloodaid.domain.BloodBank;
import com.bloodaid.domain.InventoryItem;
import com.bloodaid.dto.Dtos;
import com.bloodaid.repository.BloodBankRepository;
import com.bloodaid.repository.InventoryItemRepository;
import com.bloodaid.web.ApiException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class BankServiceTest {

    private BankService service;

    private static BloodBank bank(long id, String name, String location, double distanceKm) {
        BloodBank b = mock(BloodBank.class);
        when(b.getId()).thenReturn(id);
        when(b.getName()).thenReturn(name);
        when(b.getLocation()).thenReturn(location);
        when(b.getLatitude()).thenReturn(28.0);
        when(b.getLongitude()).thenReturn(77.0);
        when(b.getDistanceKm()).thenReturn(distanceKm);
        return b;
    }

    @BeforeEach
    void setUp() {
        BloodBankRepository banks = mock(BloodBankRepository.class);
        InventoryItemRepository inventory = mock(InventoryItemRepository.class);

        BloodBank far = bank(1, "Far Bank", "Noida", 9.0);
        BloodBank near = bank(2, "Near Bank", "Delhi", 2.0);
        when(banks.findAll()).thenReturn(List.of(far, near));
        when(inventory.findByBankIdIn(anyCollection())).thenReturn(List.of(
                new InventoryItem(1L, "AB-", 4),
                new InventoryItem(1L, "O+", 30),
                new InventoryItem(2L, "O+", 80),
                new InventoryItem(2L, "A+", 25)));

        service = new BankService(banks, inventory, mock(UserService.class));
    }

    @Test
    void availabilityThresholds() {
        assertEquals("UNAVAILABLE", BankService.availability(0));
        assertEquals("LIMITED", BankService.availability(1));
        assertEquals("LIMITED", BankService.availability(49));
        assertEquals("AVAILABLE", BankService.availability(50));
    }

    @Test
    void listIsSortedNearestFirstAndFillsMissingTypesWithZero() {
        List<Dtos.BankDto> result = service.list(null, null, null, null);

        assertEquals(2, result.size());
        assertEquals("Near Bank", result.get(0).name());
        assertEquals(0, result.get(0).inventory().get("AB-"));
        assertEquals(8, result.get(0).inventory().size());
        assertEquals(105, result.get(0).totalUnits());
        assertEquals("AVAILABLE", result.get(0).availability());
        assertEquals("LIMITED", result.get(1).availability());
    }

    @Test
    void listFiltersByBloodTypeInStock() {
        List<Dtos.BankDto> result = service.list(null, null, "AB-", null);

        assertEquals(1, result.size());
        assertEquals("Far Bank", result.get(0).name());
    }

    @Test
    void listRejectsUnknownBloodType() {
        ApiException ex = assertThrows(ApiException.class, () -> service.list(null, null, "Z+", null));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void searchMatchesNameLocationAndBloodTypePrefix() {
        assertEquals(1, service.search("delhi", null, null).size());
        assertEquals(1, service.search("far", null, null).size());
        // "ab" matches no bank name or city, but it is a prefix of AB+ and AB-, which only Far Bank stocks.
        List<Dtos.BankDto> byType = service.search("ab", null, null);
        assertEquals(1, byType.size());
        assertEquals("Far Bank", byType.get(0).name());
        assertEquals(0, service.search("zzz", null, null).size());
        assertEquals(0, service.search("  ", null, null).size());
    }
}
