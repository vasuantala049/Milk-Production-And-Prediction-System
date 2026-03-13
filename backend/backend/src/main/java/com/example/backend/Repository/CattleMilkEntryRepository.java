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

    @Query("""
        SELECT COALESCE(SUM(e.milkLiters), 0)
        FROM CattleMilkEntry e
        WHERE e.farm.id = :farmId
          AND e.recordDate = :date
          AND e.session = :session
          AND LOWER(e.cattle.type) = LOWER(:type)
    """)
    Double sumMilkByType(
            @org.springframework.data.repository.query.Param("farmId") Long farmId,
            @org.springframework.data.repository.query.Param("date") LocalDate date,
            @org.springframework.data.repository.query.Param("session") MilkSession session,
            @org.springframework.data.repository.query.Param("type") String type
    );

    java.util.List<CattleMilkEntry> findByFarm_IdAndRecordDate(Long farmId, LocalDate recordDate);

    java.util.List<CattleMilkEntry> findByFarm_IdAndRecordDateAndEnteredBy_Id(
            Long farmId,
            LocalDate recordDate,
            Long enteredById
    );

    java.util.List<CattleMilkEntry> findByFarm_IdAndRecordDateBetween(
            Long farmId,
            LocalDate startDate,
            LocalDate endDate
    );

                @Query("""
                                SELECT e.recordDate,
                                                         UPPER(e.cattle.type),
                                                         COALESCE(SUM(CASE WHEN e.session = com.example.backend.Entity.type.MilkSession.MORNING THEN e.milkLiters ELSE 0 END), 0),
                                                         COALESCE(SUM(CASE WHEN e.session = com.example.backend.Entity.type.MilkSession.EVENING THEN e.milkLiters ELSE 0 END), 0),
                                                         COALESCE(SUM(e.milkLiters), 0)
                                FROM CattleMilkEntry e
                                WHERE e.farm.id = :farmId
                                        AND e.recordDate >= :fromDate
                                GROUP BY e.recordDate, UPPER(e.cattle.type)
                                ORDER BY e.recordDate ASC
                """)
                java.util.List<Object[]> findDailyTypeTotals(
                                                @org.springframework.data.repository.query.Param("farmId") Long farmId,
                                                @org.springframework.data.repository.query.Param("fromDate") LocalDate fromDate
                );

    java.util.List<CattleMilkEntry> findByCattle_Id(Long cattleId);
}
