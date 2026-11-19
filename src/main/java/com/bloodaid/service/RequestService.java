package com.bloodaid.service;

import com.bloodaid.domain.BloodRequest;
import com.bloodaid.domain.RequestStatus;
import com.bloodaid.domain.User;
import com.bloodaid.dto.Dtos;
import com.bloodaid.repository.BloodRequestRepository;
import com.bloodaid.web.ApiException;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RequestService {

    static final Set<RequestStatus> OPEN_STATUSES = Set.of(RequestStatus.PENDING, RequestStatus.IN_PROGRESS);

    private final BloodRequestRepository requests;
    private final UserService userService;

    public RequestService(BloodRequestRepository requests, UserService userService) {
        this.requests = requests;
        this.userService = userService;
    }

    @Transactional
    public Dtos.BloodRequestDto create(Dtos.CreateBloodRequest body, String requesterEmail) {
        User requester = userService.requireByEmail(requesterEmail);
        BloodRequest r = new BloodRequest();
        r.setPatientName(body.patientName().trim());
        r.setContactNumber(body.contactNumber().trim());
        r.setBloodType(body.bloodType());
        r.setUnits(body.units());
        r.setUrgency(body.urgency());
        r.setHospitalName(body.hospitalName().trim());
        r.setNotes(body.notes() == null || body.notes().isBlank() ? null : body.notes().trim());
        r.setStatus(RequestStatus.PENDING);
        r.setRequesterId(requester.getId());
        return toDto(requests.save(r));
    }

    @Transactional(readOnly = true)
    public List<Dtos.BloodRequestDto> mine(String requesterEmail) {
        User requester = userService.requireByEmail(requesterEmail);
        return requests.findByRequesterIdOrderByCreatedAtDesc(requester.getId()).stream().map(this::toDto).toList();
    }

    /** Requests for staff and admins (full details). */
    @Transactional(readOnly = true)
    public List<Dtos.BloodRequestDto> recent(int limit) {
        return requests.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit)).stream().map(this::toDto).toList();
    }

    /** Requests for the public dashboard and search (no personal details). */
    @Transactional(readOnly = true)
    public List<Dtos.PublicRequestDto> publicList(int limit, boolean openOnly) {
        List<BloodRequest> list = openOnly
                ? requests.findByStatusInOrderByCreatedAtDesc(OPEN_STATUSES, PageRequest.of(0, limit))
                : requests.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit));
        return list.stream().map(this::toPublic).toList();
    }

    @Transactional(readOnly = true)
    public List<Dtos.PublicRequestDto> searchPublic(String query) {
        String needle = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        if (needle.isEmpty()) {
            return List.of();
        }
        return requests.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 200)).stream()
                .filter(r -> r.getBloodType().toLowerCase(Locale.ROOT).contains(needle)
                        || r.getHospitalName().toLowerCase(Locale.ROOT).contains(needle))
                .map(this::toPublic)
                .toList();
    }

    @Transactional
    public Dtos.BloodRequestDto updateStatus(Long id, RequestStatus status) {
        BloodRequest r = requests.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Request not found."));
        r.setStatus(status);
        r.setUpdatedAt(Instant.now());
        return toDto(requests.save(r));
    }

    private Dtos.BloodRequestDto toDto(BloodRequest r) {
        return new Dtos.BloodRequestDto(r.getId(), r.getPatientName(), r.getContactNumber(), r.getBloodType(),
                r.getUnits(), r.getUrgency(), r.getHospitalName(), r.getNotes(), r.getStatus(),
                r.getCreatedAt(), r.getUpdatedAt());
    }

    private Dtos.PublicRequestDto toPublic(BloodRequest r) {
        return new Dtos.PublicRequestDto(r.getId(), r.getBloodType(), r.getHospitalName(),
                r.getUrgency(), r.getStatus(), r.getCreatedAt());
    }
}
