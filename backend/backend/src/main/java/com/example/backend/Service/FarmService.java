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

    List<FarmResponseDto> getAllFarms();

    FarmResponseDto patchFarm(Long id, FarmPatchDto patchDto, com.example.backend.Entity.User loggedInUser);

    List<FarmResponseDto> getMyFarms(com.example.backend.Entity.User loggedInUser);

    void assignWorkerToFarm(Long farmId, String workerEmail, com.example.backend.Entity.User loggedInUser);

    List<FarmResponseDto> getFarmsByWorker(Long workerId);

    void deleteFarm(Long id);

    long getHerdCount(Long farmId);
    long getWorkerCount(Long farmId);
    java.util.List<com.example.backend.DTO.UserResponseDto> getWorkersByFarm(Long farmId);
    long getActiveCattleCount(Long farmId);
}
