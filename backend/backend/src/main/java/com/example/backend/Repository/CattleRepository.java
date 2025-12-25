package com.example.backend.Repository;

import com.example.backend.Entity.Cattle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CattleRepository extends JpaRepository<Cattle, Long> {
    List<Cattle> findByFarmId(Long farmId);
    Optional<Cattle> findByTagId(String tagId);
    Optional<Cattle> findByFarm_IdAndTagId(Long farmId, String tagId);

}