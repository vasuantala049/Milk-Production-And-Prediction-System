package com.example.backend.Repository;

import com.example.backend.Entity.MilkInventory;
import com.example.backend.Entity.type.MilkSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface MilkInventoryRepository extends JpaRepository<MilkInventory, Long> {

    boolean existsByFarmIdAndRecordDateAndSession(
            Long farmId,
            LocalDate recordDate,
            MilkSession session
    );
}
