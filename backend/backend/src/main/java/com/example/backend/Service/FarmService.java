package com.example.backend.Service;

import com.example.backend.DTO.CreateFarmDto;
import com.example.backend.DTO.FarmPatchDto;
import com.example.backend.DTO.FarmResponseDto;
import jakarta.validation.Valid;

import java.util.List;

public interface FarmService {
    FarmResponseDto createFarm(@Valid CreateFarmDto dto, com.example.backend.Entity.User loggedInUser);

    FarmResponseDto getFarmById(Long id);

    List<FarmResponseDto> getFarmsByOwner(Long ownerId);

    List<FarmResponseDto> getAllFarms(String location);

    FarmResponseDto patchFarm(Long id, FarmPatchDto patchDto, com.example.backend.Entity.User loggedInUser);

    List<FarmResponseDto> getMyFarms(com.example.backend.Entity.User loggedInUser);

    void assignWorkerToFarm(Long farmId, String workerEmail, com.example.backend.Entity.User loggedInUser);

    List<FarmResponseDto> getFarmsByWorker(Long workerId);

    void deleteFarm(Long id);

    long getHerdCount(Long farmId);

    long getWorkerCount(Long farmId);

    java.util.List<com.example.backend.DTO.UserResponseDto> getWorkersByFarm(Long farmId);

    long getActiveCattleCount(Long farmId);

    com.example.backend.DTO.UserResponseDto createWorkerForFarm(Long farmId,
            com.example.backend.DTO.CreateUserRequestDto dto, com.example.backend.Entity.User loggedInUser);

    List<com.example.backend.DTO.ShedStatusDto> getShedStatus(Long farmId, com.example.backend.Entity.User loggedInUser);

    void updateWorkerSheds(Long farmId, Long workerId, com.example.backend.DTO.UpdateWorkerShedDto dto, com.example.backend.Entity.User loggedInUser);

    // Invitation flow
    com.example.backend.DTO.WorkerFarmInvitationDto inviteWorkerToFarm(Long farmId, String workerEmail, com.example.backend.Entity.User loggedInUser);

    List<com.example.backend.DTO.WorkerFarmInvitationDto> getPendingInvitationsForWorker(com.example.backend.Entity.User loggedInUser);

    com.example.backend.DTO.WorkerFarmInvitationDto respondToInvitation(Long invitationId, boolean accept, com.example.backend.Entity.User loggedInUser);

    List<com.example.backend.DTO.WorkerFarmInvitationDto> getInvitationsForFarm(Long farmId, com.example.backend.Entity.User loggedInUser);

    void removeWorkerFromFarm(Long farmId, Long workerId, com.example.backend.Entity.User loggedInUser);
}
