package com.bloodaid.web;

import com.bloodaid.dto.Dtos;
import com.bloodaid.service.BankService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/banks")
public class BankController {

    private final BankService banks;

    public BankController(BankService banks) {
        this.banks = banks;
    }

    @GetMapping
    public List<Dtos.BankDto> list(@RequestParam(required = false) Double lat,
                                   @RequestParam(required = false) Double lng,
                                   @RequestParam(required = false) String bloodType,
                                   @RequestParam(required = false) String q) {
        return banks.list(lat, lng, bloodType, q);
    }

    @GetMapping("/{id}")
    public Dtos.BankDto get(@PathVariable Long id,
                            @RequestParam(required = false) Double lat,
                            @RequestParam(required = false) Double lng) {
        return banks.get(id, lat, lng);
    }

    @PutMapping("/{id}/inventory")
    public Dtos.BankDto updateInventory(@PathVariable Long id,
                                        @Valid @RequestBody Dtos.InventoryUpdateRequest body,
                                        Principal principal) {
        return banks.updateInventory(id, body.inventory(), principal.getName());
    }
}
