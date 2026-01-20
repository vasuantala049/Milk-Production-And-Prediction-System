package com.example.backend.Repository;

import com.example.backend.Entity.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmRepository extends JpaRepository<Farm, Long> {
    List<Farm> findByOwnerId(Long ownerId);


    Optional<Farm> findByIdAndOwnerId(Long farmId, Long ownerId);

    // Farms where a given worker is assigned
    java.util.List<Farm> findByWorkers_Id(Long workerId);

    List<Farm> findByAddressContainingIgnoreCase(String location);

}