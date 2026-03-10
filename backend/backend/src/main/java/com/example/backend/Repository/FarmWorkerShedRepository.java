package com.example.backend.Repository;

import com.example.backend.Entity.FarmWorkerShed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FarmWorkerShedRepository extends JpaRepository<FarmWorkerShed, Long> {
    
    List<FarmWorkerShed> findByFarmWorkerId(Long farmWorkerId);
    
    void deleteByFarmWorkerId(Long farmWorkerId);
}
