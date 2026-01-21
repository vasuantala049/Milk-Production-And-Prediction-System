package com.example.backend.Service.impl;

import com.example.backend.DTO.CreateFarmDto;
import com.example.backend.DTO.FarmPatchDto;
import com.example.backend.DTO.FarmResponseDto;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.UserRole;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Service.FarmService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class FarmServiceImpl implements FarmService {

    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final com.example.backend.Repository.CattleRepository cattleRepository;
    


    @Override
    @Transactional(readOnly = true)
    public FarmResponseDto getFarmById(Long id) {

        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        return toResponseDto(farm);
    }

    @Override
    @Transactional(readOnly = true)
    public long getHerdCount(Long farmId) {
        if (!farmRepository.existsById(farmId)) {
            throw new IllegalArgumentException("Farm not found");
        }
        return cattleRepository.countByFarmId(farmId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getWorkerCount(Long farmId) {
        if (!farmRepository.existsById(farmId)) {
            throw new IllegalArgumentException("Farm not found");
        }
        return userRepository.countByAssignedFarms_IdAndRole(farmId, com.example.backend.Entity.type.UserRole.WORKER);
    }
    
    @Override
    @Transactional(readOnly = true)
    public java.util.List<com.example.backend.DTO.UserResponseDto> getWorkersByFarm(Long farmId) {
        if (!farmRepository.existsById(farmId)) {
            throw new IllegalArgumentException("Farm not found");
        }
        java.util.List<com.example.backend.Entity.User> users = userRepository.findByAssignedFarms_IdAndRole(farmId, com.example.backend.Entity.type.UserRole.WORKER);
        return users.stream()
                .map(u -> modelMapper.map(u, com.example.backend.DTO.UserResponseDto.class))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getActiveCattleCount(Long farmId) {
        if (!farmRepository.existsById(farmId)) {
            throw new IllegalArgumentException("Farm not found");
        }
        return cattleRepository.countByFarmIdAndStatus(farmId, "ACTIVE");
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmResponseDto> getFarmsByOwner(Long ownerId) {

        List<Farm> farms = farmRepository.findByOwnerId(ownerId);

        return farms.stream()
                .map(this::toResponseDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    // removed @Cacheable per request
    public List<FarmResponseDto> getAllFarms(String location) {
        java.util.List<Farm> farms;
        if (location != null && !location.trim().isEmpty()) {
            farms = farmRepository.findByAddressContainingIgnoreCase(location.trim());
        } else {
            farms = farmRepository.findAll();
        }
        return farms.stream()
                .map(this::toResponseDto)
                .toList();
    }


    @Override
    public List<FarmResponseDto> getFarmsByWorker(Long workerId) {
        User user = userRepository.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getRole() != UserRole.WORKER) {
            throw new IllegalArgumentException("User is not a WORKER");
        }
        java.util.List<Farm> farms = farmRepository.findByWorkers_Id(workerId);
        return farms.stream().map(this::toResponseDto).toList();
    }

    @Override
    public FarmResponseDto createFarm(CreateFarmDto dto, User loggedInUser) {

        if (loggedInUser.getRole() != UserRole.FARM_OWNER) {
            throw new IllegalArgumentException("Only FARM_OWNER can create farms");
        }

        Farm farm = new Farm();
        farm.setName(dto.getName());
        farm.setAddress(dto.getAddress());
        farm.setOwner(loggedInUser);

        Farm saved = farmRepository.save(farm);
        return toResponseDto(saved);
    }

    @Override
    public FarmResponseDto patchFarm(Long id, FarmPatchDto patchDto, User loggedInUser) {

        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        if (!farm.getOwner().getId().equals(loggedInUser.getId())) {
            throw new IllegalArgumentException("You are not the owner of this farm");
        }

        if (patchDto.getName() != null) {
            farm.setName(patchDto.getName());
        }

        if (patchDto.getAddress() != null) {
            farm.setAddress(patchDto.getAddress());
        }

        Farm saved = farmRepository.save(farm);
        return toResponseDto(saved);
    }

    @Override
    public List<FarmResponseDto> getMyFarms(User loggedInUser) {
        if (loggedInUser.getRole() == UserRole.FARM_OWNER) {
            return farmRepository.findByOwnerId(loggedInUser.getId())
                    .stream().map(this::toResponseDto).toList();
        }

        if (loggedInUser.getRole() == UserRole.WORKER) {
            java.util.List<Farm> farms = farmRepository.findByWorkers_Id(loggedInUser.getId());
            return farms.stream().map(this::toResponseDto).toList();
        }

        return List.of();
    }

    @Override
    public void deleteFarm(Long id) {
        if (!farmRepository.existsById(id)) {
            throw new IllegalArgumentException("Farm not found");
        }
        farmRepository.deleteById(id);
    }

    @Override
    public void assignWorkerToFarm(Long farmId, String workerEmail, User loggedInUser) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        if (!farm.getOwner().getId().equals(loggedInUser.getId())) {
            throw new IllegalArgumentException("Only the farm owner can assign workers to this farm");
        }

        User worker = userRepository.findByEmailWithAssignedFarms(workerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));

        if (worker.getRole() != UserRole.WORKER) {
            throw new IllegalArgumentException("Target user is not a WORKER");
        }

        // Add farm to worker's assignments (many-to-many)
        java.util.List<Farm> assigned = worker.getAssignedFarms();
        if (assigned == null) {
            assigned = new java.util.ArrayList<>();
            worker.setAssignedFarms(assigned);
        }
        boolean alreadyAssigned = assigned.stream().anyMatch(f -> f.getId().equals(farmId));
        if (!alreadyAssigned) {
            assigned.add(farm);
        }
        userRepository.save(worker);
    }
    

    private final com.example.backend.Repository.MilkInventoryRepository milkInventoryRepository;
    private final com.example.backend.Repository.MilkAllocationRepository milkAllocationRepository;

    // ---------- helper ----------
    private FarmResponseDto toResponseDto(Farm farm) {
        FarmResponseDto dto = modelMapper.map(farm, FarmResponseDto.class);
        dto.setOwnerId(farm.getOwner().getId());
        dto.setPricePerLiter(farm.getPricePerLiter());

        // Calculate available milk (Today's Total)
        java.time.LocalDate today = java.time.LocalDate.now();
        Double morning = com.example.backend.Entity.type.MilkSession.MORNING != null ?
                getMilkForSession(farm.getId(), today, com.example.backend.Entity.type.MilkSession.MORNING) : 0.0;
        Double evening = com.example.backend.Entity.type.MilkSession.EVENING != null ?
                getMilkForSession(farm.getId(), today, com.example.backend.Entity.type.MilkSession.EVENING) : 0.0;
        dto.setAvailableMilk(morning + evening);

        return dto;
    }

    private Double getMilkForSession(Long farmId, java.time.LocalDate date, com.example.backend.Entity.type.MilkSession session) {
        return milkInventoryRepository.findByFarmIdAndRecordDateAndSession(farmId, date, session)
                .map(inventory -> {
                    // Calculate available milk: total production - allocations
                    Double totalProduction = inventory.getMilkLiters();
                    Double allocated = milkAllocationRepository.sumAllocationsByInventoryId(inventory.getId());
                    return totalProduction - allocated;
                })
                .orElse(0.0);
    }
}
