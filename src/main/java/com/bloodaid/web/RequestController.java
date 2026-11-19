package com.bloodaid.web;

import com.bloodaid.dto.Dtos;
import com.bloodaid.service.RequestService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RequestController {

    private final RequestService requests;

    public RequestController(RequestService requests) {
        this.requests = requests;
    }

    /** Any signed-in user can request blood. */
    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public Dtos.BloodRequestDto create(@Valid @RequestBody Dtos.CreateBloodRequest body, Principal principal) {
        return requests.create(body, principal.getName());
    }

    @GetMapping("/requests/mine")
    public List<Dtos.BloodRequestDto> mine(Principal principal) {
        return requests.mine(principal.getName());
    }

    /** Staff and admins see full request details. */
    @GetMapping("/staff/requests")
    public List<Dtos.BloodRequestDto> staffRequests(@RequestParam(defaultValue = "50") int limit) {
        return requests.recent(Math.max(1, Math.min(limit, 200)));
    }

    @PatchMapping("/staff/requests/{id}/status")
    public Dtos.BloodRequestDto updateStatus(@PathVariable Long id,
                                             @Valid @RequestBody Dtos.StatusUpdateRequest body) {
        return requests.updateStatus(id, body.status());
    }
}
