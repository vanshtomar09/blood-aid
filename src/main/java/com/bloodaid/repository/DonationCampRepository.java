package com.bloodaid.repository;

import com.bloodaid.domain.DonationCamp;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DonationCampRepository extends JpaRepository<DonationCamp, Long> {

    List<DonationCamp> findByCampDateGreaterThanEqualOrderByCampDateAsc(LocalDate date);
}
