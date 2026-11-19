package com.bloodaid.repository;

import com.bloodaid.domain.PendingRegistration;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, String> {

    @Modifying
    @Query("delete from PendingRegistration p where p.expiresAt < :cutoff and p.email <> :keepEmail")
    int deleteExpiredExcept(@Param("cutoff") Instant cutoff, @Param("keepEmail") String keepEmail);
}
