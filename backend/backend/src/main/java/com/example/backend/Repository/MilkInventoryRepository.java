package com.example.backend.Repository;

import com.example.backend.Entity.MilkInventory;
import com.example.backend.Entity.type.MilkSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface MilkInventoryRepository extends JpaRepository<MilkInventory, Long> {

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
