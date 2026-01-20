package com.example.backend.Repository;

import com.example.backend.Entity.CattleMilkEntry;
import com.example.backend.Entity.type.MilkSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface CattleMilkEntryRepository extends JpaRepository<CattleMilkEntry, Long> {

    boolean existsByCattleIdAndRecordDateAndSession(
            Long cattleId,
            LocalDate date,
            MilkSession session
    );

    @Query("""
        SELECT COALESCE(SUM(e.milkLiters), 0)
        FROM CattleMilkEntry e
        WHERE e.farm.id = :farmId
          AND e.recordDate = :date
          AND e.session = :session
    """)
    Double sumMilkByFarmAndDateAndSession(
            Long farmId,
            LocalDate date,
            MilkSession session
    );

    java.util.List<CattleMilkEntry> findByFarm_IdAndRecordDate(Long farmId, LocalDate recordDate);

    java.util.List<CattleMilkEntry> findByFarm_IdAndRecordDateAndEnteredBy_Id(
            Long farmId,
            LocalDate recordDate,
            Long enteredById
    );

    java.util.List<CattleMilkEntry> findByCattle_Id(Long cattleId);
}
