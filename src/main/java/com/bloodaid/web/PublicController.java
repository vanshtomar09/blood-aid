package com.bloodaid.web;

import com.bloodaid.domain.DonationCamp;
import com.bloodaid.dto.Dtos;
import com.bloodaid.repository.DonationCampRepository;
import com.bloodaid.service.BankService;
import com.bloodaid.service.RequestService;
import com.bloodaid.service.StatsService;
import com.bloodaid.service.ai.AiService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints anyone can call without signing in. None of them expose personal details. */
@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final StatsService stats;
    private final RequestService requests;
    private final BankService banks;
    private final DonationCampRepository camps;
    private final AiService ai;
    private final boolean demoAccounts;
    private final boolean demoOtp;

    public PublicController(StatsService stats, RequestService requests, BankService banks,
                            DonationCampRepository camps, AiService ai,
                            @Value("${app.seed.enabled:true}") boolean demoAccounts,
                            @Value("${app.otp.demo:true}") boolean demoOtp) {
        this.stats = stats;
        this.requests = requests;
        this.banks = banks;
        this.camps = camps;
        this.ai = ai;
        this.demoAccounts = demoAccounts;
        this.demoOtp = demoOtp;
    }

    @GetMapping("/config")
    public Dtos.PublicConfig config() {
        return new Dtos.PublicConfig(demoAccounts, demoOtp, ai.isAiEnabled());
    }

    @GetMapping("/stats")
    public Dtos.PublicStats stats() {
        return stats.publicStats();
    }

    @GetMapping("/requests")
    public List<Dtos.PublicRequestDto> requests(@RequestParam(defaultValue = "10") int limit,
                                                @RequestParam(defaultValue = "false") boolean openOnly) {
        return requests.publicList(Math.max(1, Math.min(limit, 50)), openOnly);
    }

    @GetMapping("/camps")
    public List<Dtos.CampDto> camps() {
        return camps.findByCampDateGreaterThanEqualOrderByCampDateAsc(LocalDate.now()).stream()
                .map((DonationCamp c) -> new Dtos.CampDto(c.getId(), c.getName(), c.getLocation(), c.getCampDate()))
                .toList();
    }

    @GetMapping("/search")
    public Dtos.SearchResponse search(@RequestParam String q,
                                      @RequestParam(required = false) Double lat,
                                      @RequestParam(required = false) Double lng) {
        return new Dtos.SearchResponse(banks.search(q, lat, lng), requests.searchPublic(q));
    }
}
