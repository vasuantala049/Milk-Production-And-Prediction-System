package com.example.backend.Repository;

import com.example.backend.Entity.FarmWorker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmWorkerRepository extends JpaRepository<FarmWorker, Long> {
    
    List<FarmWorker> findByFarmId(Long farmId);
    
    List<FarmWorker> findByWorkerId(Long workerId);
    
    Optional<FarmWorker> findByFarmIdAndWorkerId(Long farmId, Long workerId);
    
    void deleteByFarmIdAndWorkerId(Long farmId, Long workerId);
}
