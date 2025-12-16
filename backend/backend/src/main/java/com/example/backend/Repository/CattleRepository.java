package com.example.backend.Repository;

import com.example.backend.Entity.Cattle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CattleRepository extends JpaRepository<Cattle, Long> {
}