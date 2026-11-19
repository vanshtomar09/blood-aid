package com.bloodaid.repository;

import com.bloodaid.domain.BloodRequest;
import com.bloodaid.domain.RequestStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    List<BloodRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<BloodRequest> findByStatusInOrderByCreatedAtDesc(Collection<RequestStatus> statuses, Pageable pageable);

    List<BloodRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    long countByStatusIn(Collection<RequestStatus> statuses);

    long countByStatusAndUpdatedAtGreaterThanEqual(RequestStatus status, Instant since);
}
