package com.example.backend.Repository;

import com.example.backend.Entity.WorkerFarmInvitation;
import com.example.backend.Entity.type.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerFarmInvitationRepository extends JpaRepository<WorkerFarmInvitation, Long> {

    List<WorkerFarmInvitation> findByWorkerIdAndStatus(Long workerId, InvitationStatus status);

    List<WorkerFarmInvitation> findByFarmIdAndStatus(Long farmId, InvitationStatus status);

    Optional<WorkerFarmInvitation> findByFarmIdAndWorkerId(Long farmId, Long workerId);

    boolean existsByFarmIdAndWorkerIdAndStatus(Long farmId, Long workerId, InvitationStatus status);

    @Modifying
    @Query("DELETE FROM WorkerFarmInvitation i WHERE i.farm.id = :farmId AND i.worker.id = :workerId")
    void deleteByFarmIdAndWorkerId(@Param("farmId") Long farmId, @Param("workerId") Long workerId);
}
