package com.example.backend.Repository;

import com.example.backend.Entity.Orders;
import com.example.backend.Entity.type.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.Entity.User;

import java.time.LocalDate;
import java.util.List;
import com.example.backend.Entity.type.MilkSession;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface OrdersRepository extends JpaRepository<Orders, Long> {
    List<Orders> findByBuyer(User buyer);
    List<Orders> findByBuyerOrderByOrderDateDescIdDesc(User buyer);
    long countByFarm_Id(Long farmId);
    Orders findTopByFarm_IdAndDisplayCodeIsNotNullOrderByDisplayCodeDesc(Long farmId);
    boolean existsByFarm_IdAndDisplayCode(Long farmId, String displayCode);
    List<Orders> findBySubscription_IdAndOrderDateAndStatus(Long subscriptionId, LocalDate orderDate, OrderStatus status);

    // Farm-based queries for owner/worker access
    List<Orders> findByFarm_IdOrderByOrderDateDesc(Long farmId);

    Page<Orders> findByFarm_Id(Long farmId, Pageable pageable);

    List<Orders> findByFarm_IdAndOrderDateBetween(Long farmId, LocalDate startDate, LocalDate endDate);

    // Status-based queries
    List<Orders> findByFarm_IdAndStatus(Long farmId, OrderStatus status);

    @Query("""
        SELECT COALESCE(SUM(o.quantity), 0)
        FROM Orders o
        WHERE o.farm.id = :farmId
          AND o.orderDate = :date
          AND o.session = :session
          AND LOWER(o.animalType) = LOWER(:type)
          AND o.status IN (com.example.backend.Entity.type.OrderStatus.PENDING, com.example.backend.Entity.type.OrderStatus.CONFIRMED)
    """)
    Double sumAllocatedByType(
            @Param("farmId") Long farmId,
            @Param("date") LocalDate date,
            @Param("session") MilkSession session,
            @Param("type") String type
    );
}
