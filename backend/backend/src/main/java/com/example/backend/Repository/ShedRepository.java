package com.example.backend.Repository;

import com.example.backend.Entity.Shed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShedRepository extends JpaRepository<Shed, Long> {

    List<Shed> findByFarmId(Long farmId);

    Optional<Shed> findByFarmIdAndName(Long farmId, String name);
}
