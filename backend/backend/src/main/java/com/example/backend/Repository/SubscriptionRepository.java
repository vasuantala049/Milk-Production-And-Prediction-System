package com.example.backend.Repository;

import com.example.backend.Entity.Subscription;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.SubscriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByBuyer(User buyer);
    List<Subscription> findAllByStatus(SubscriptionStatus status);
    
    // Farm-based queries for owner access
    List<Subscription> findByFarm_Id(Long farmId);
    Page<Subscription> findByFarm_Id(Long farmId, Pageable pageable);
    List<Subscription> findByFarm_IdAndStatus(Long farmId, SubscriptionStatus status);
}
