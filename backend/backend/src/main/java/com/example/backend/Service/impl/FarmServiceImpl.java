package com.example.backend.Service.impl;

import com.example.backend.DTO.*;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.FarmWorker;
import com.example.backend.Entity.FarmWorkerShed;
import com.example.backend.Entity.Shed;
import com.example.backend.Entity.User;
import com.example.backend.Entity.type.UserRole;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.FarmWorkerRepository;
import com.example.backend.Repository.FarmWorkerShedRepository;
import com.example.backend.Repository.ShedRepository;
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
    private final FarmWorkerRepository farmWorkerRepository;
    private final FarmWorkerShedRepository farmWorkerShedRepository;
    private final ShedRepository shedRepository;
    private final ModelMapper modelMapper;
    private final com.example.backend.Repository.CattleRepository cattleRepository;
    private final com.example.backend.Service.MilkInventoryService milkInventoryService;
    private final com.example.backend.Repository.MilkAllocationRepository milkAllocationRepository;
    private final com.example.backend.Repository.MilkInventoryRepository milkInventoryRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

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
        return farmWorkerRepository.findByFarmId(farmId).size();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<com.example.backend.DTO.UserResponseDto> getWorkersByFarm(Long farmId) {
        if (!farmRepository.existsById(farmId)) {
            throw new IllegalArgumentException("Farm not found");
        }
        java.util.List<FarmWorker> farmWorkers = farmWorkerRepository.findByFarmId(farmId);
        return farmWorkers.stream()
                .map(fw -> {
                    UserResponseDto dto = modelMapper.map(fw.getWorker(), UserResponseDto.class);
                    // Load sheds for this worker–farm pair (farm-scoped)
                    List<ShedResponseDto> sheds = farmWorkerShedRepository
                            .findByFarmWorkerId(fw.getId())
                            .stream()
                            .map(fws -> new ShedResponseDto(fws.getShed().getId(), fws.getShed().getName()))
                            .toList();
                    dto.setSheds(sheds);
                    return dto;
                })
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
        return farms.stream().map(this::toResponseDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FarmResponseDto> getAllFarms(String location) {
        String trimmedLocation = location != null ? location.trim() : null;

        java.util.List<Farm> farms;
        if (trimmedLocation != null && !trimmedLocation.isEmpty()) {
            java.util.Set<Farm> result = new java.util.LinkedHashSet<>();
            result.addAll(farmRepository.findByCityIgnoreCaseAndIsSellingTrue(trimmedLocation));
            result.addAll(farmRepository.findByAddressContainingIgnoreCaseAndIsSellingTrue(trimmedLocation));
            farms = new java.util.ArrayList<>(result);
        } else {
            farms = farmRepository.findByIsSellingTrue();
        }

        return farms.stream().map(this::toResponseDto).toList();
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

        if (patchDto.getName() != null)
            farm.setName(patchDto.getName());
        if (patchDto.getAddress() != null)
            farm.setAddress(patchDto.getAddress());
        if (patchDto.getIsSelling() != null)
            farm.setSelling(patchDto.getIsSelling());

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

        User worker = userRepository.findByEmail(workerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));

        if (worker.getRole() != UserRole.WORKER) {
            throw new IllegalArgumentException("Target user is not a WORKER");
        }

        java.util.Optional<FarmWorker> existing = farmWorkerRepository.findByFarmIdAndWorkerId(farmId, worker.getId());
        if (!existing.isPresent()) {
            FarmWorker assignment = new FarmWorker();
            assignment.setFarm(farm);
            assignment.setWorker(worker);
            farmWorkerRepository.save(assignment);
        }
    }

    @Override
    public com.example.backend.DTO.UserResponseDto createWorkerForFarm(Long farmId,
            com.example.backend.DTO.CreateUserRequestDto dto, User loggedInUser) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        if (!farm.getOwner().getId().equals(loggedInUser.getId())) {
            throw new IllegalArgumentException("Only the farm owner can create workers for this farm");
        }

        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("User with this email already exists.");
        }

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setRole(UserRole.WORKER);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        User saved = userRepository.save(user);

        // Create FarmWorker (farm-scoped)
        FarmWorker assignment = new FarmWorker();
        assignment.setFarm(farm);
        assignment.setWorker(saved);
        FarmWorker savedAssignment = farmWorkerRepository.save(assignment);

        // Assign sheds (farm-scoped via FarmWorkerShed)
        if (dto.getShedIds() != null && !dto.getShedIds().isEmpty()) {
            for (Long shedId : dto.getShedIds()) {
                Shed shed = shedRepository.findById(shedId)
                        .orElseThrow(() -> new IllegalArgumentException("Shed not found: " + shedId));
                if (!shed.getFarm().getId().equals(farmId)) {
                    throw new IllegalArgumentException("Shed does not belong to this farm");
                }
                FarmWorkerShed fws = new FarmWorkerShed();
                fws.setFarmWorker(savedAssignment);
                fws.setShed(shed);
                farmWorkerShedRepository.save(fws);
            }
        }

        return modelMapper.map(saved, com.example.backend.DTO.UserResponseDto.class);
    }

    @Override
    public void updateWorkerShedForFarm(Long farmId, Long workerId, java.util.List<Long> shedIds, User loggedInUser) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        if (!farm.getOwner().getId().equals(loggedInUser.getId())) {
            throw new IllegalArgumentException("Only the farm owner can update worker assignments");
        }

        FarmWorker assignment = farmWorkerRepository.findByFarmIdAndWorkerId(farmId, workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker is not assigned to this farm"));

        // Remove all existing shed assignments for this worker–farm pair
        farmWorkerShedRepository.deleteByFarmWorkerId(assignment.getId());

        // Re-assign new sheds (all must belong to this farm)
        if (shedIds != null && !shedIds.isEmpty()) {
            for (Long shedId : shedIds) {
                Shed shed = shedRepository.findById(shedId)
                        .orElseThrow(() -> new IllegalArgumentException("Shed not found: " + shedId));
                if (!shed.getFarm().getId().equals(farmId)) {
                    throw new IllegalArgumentException("Shed does not belong to this farm");
                }
                FarmWorkerShed fws = new FarmWorkerShed();
                fws.setFarmWorker(assignment);
                fws.setShed(shed);
                farmWorkerShedRepository.save(fws);
            }
        }
    }

    // ---------- helper ----------
    private FarmResponseDto toResponseDto(Farm farm) {
        FarmResponseDto dto = modelMapper.map(farm, FarmResponseDto.class);
        dto.setOwnerId(farm.getOwner().getId());
        dto.setPricePerLiter(farm.getPricePerLiter() != null ? farm.getPricePerLiter() : 0.0);

        Double todayMilk = milkInventoryService.getTodayTotal(farm.getId());
        dto.setTodayMilk(todayMilk != null ? todayMilk : 0.0);

        java.time.LocalDate today = java.time.LocalDate.now();
        double morningAvail = getAvailableForSession(farm.getId(), today,
                com.example.backend.Entity.type.MilkSession.MORNING);
        double eveningAvail = getAvailableForSession(farm.getId(), today,
                com.example.backend.Entity.type.MilkSession.EVENING);
        dto.setAvailableMilk(morningAvail + eveningAvail);

        dto.setHerdCount(cattleRepository.countByFarmId(farm.getId()));
        dto.setWorkerCount((long) farmWorkerRepository.findByFarmId(farm.getId()).size());
        dto.setSelling(farm.isSelling());

        return dto;
    }

    private Double getAvailableForSession(Long farmId, java.time.LocalDate date,
            com.example.backend.Entity.type.MilkSession session) {
        return milkInventoryRepository.findByFarmIdAndRecordDateAndSession(farmId, date, session)
                .map(inventory -> {
                    Double totalProduction = inventory.getMilkLiters();
                    Double allocated = milkAllocationRepository.sumAllocationsByInventoryId(inventory.getId());
                    return totalProduction - allocated;
                })
                .orElse(0.0);
    }
}
