package com.example.backend.Repository;

import com.example.backend.Entity.MilkAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MilkAllocationRepository extends JpaRepository<MilkAllocation, Long> {
    
    @Query("SELECT COALESCE(SUM(ma.quantity), 0.0) FROM MilkAllocation ma WHERE ma.milkInventory.id = :inventoryId")
    Double sumAllocationsByInventoryId(@Param("inventoryId") Long inventoryId);
}
