package com.bloodaid.repository;

import com.bloodaid.domain.BloodBank;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BloodBankRepository extends JpaRepository<BloodBank, Long> {
}
