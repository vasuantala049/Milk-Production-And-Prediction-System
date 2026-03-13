package com.example.backend.Repository;

import com.example.backend.Entity.FarmWorkerShed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FarmWorkerShedRepository extends JpaRepository<FarmWorkerShed, Long> {
    
    List<FarmWorkerShed> findByFarmWorkerId(Long farmWorkerId);

    List<FarmWorkerShed> findByShedId(Long shedId);

    @Modifying
    @Query("DELETE FROM FarmWorkerShed fws WHERE fws.farmWorker.id = :farmWorkerId")
    void deleteByFarmWorkerId(@Param("farmWorkerId") Long farmWorkerId);
}
