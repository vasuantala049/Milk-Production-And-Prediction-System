package com.example.backend.Repository;

import com.example.backend.Entity.Orders;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.Entity.User;

import java.time.LocalDate;
import java.util.List;


@Repository
public interface OrdersRepository extends JpaRepository<Orders, Long> {
    List<Orders> findByBuyer(User buyer);
    
    // Farm-based queries for owner/worker access
    List<Orders> findByFarm_IdOrderByOrderDateDesc(Long farmId);
    Page<Orders> findByFarm_Id(Long farmId, Pageable pageable);
    List<Orders> findByFarm_IdAndOrderDateBetween(Long farmId, LocalDate startDate, LocalDate endDate);
}
