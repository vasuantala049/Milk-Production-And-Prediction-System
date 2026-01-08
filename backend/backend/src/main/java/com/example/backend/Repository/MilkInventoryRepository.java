package com.example.backend.Repository;

import com.example.backend.Entity.MilkInventory;
import com.example.backend.Entity.type.MilkSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface MilkInventoryRepository extends JpaRepository<MilkInventory, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT m FROM MilkInventory m
        WHERE m.farm.id = :farmId
          AND m.recordDate = :date
          AND m.session = :session
    """)
    Optional<MilkInventory> lockInventory(
            @Param("farmId") Long farmId,
            @Param("date") LocalDate date,
            @Param("session") MilkSession session
    );

    boolean existsByFarmIdAndRecordDateAndSession(
            Long farmId,
            LocalDate recordDate,
            MilkSession session
    );

    Optional<MilkInventory> findByFarmIdAndRecordDateAndSession(
            Long farmId,
            LocalDate recordDate,
            MilkSession session
    );

    @Query("SELECT m.recordDate, COALESCE(SUM(m.milkLiters),0) " +
            "FROM MilkInventory m " +
            "WHERE m.farm.id = :farmId AND m.recordDate >= :fromDate " +
            "GROUP BY m.recordDate " +
            "ORDER BY m.recordDate ASC")
    List<Object[]> findDailyTotals(@Param("farmId") Long farmId, @Param("fromDate") LocalDate fromDate);
}
