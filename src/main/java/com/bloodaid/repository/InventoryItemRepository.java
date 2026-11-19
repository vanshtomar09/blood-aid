package com.bloodaid.repository;

import com.bloodaid.domain.InventoryItem;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByBankId(Long bankId);

    List<InventoryItem> findByBankIdIn(Collection<Long> bankIds);
}
