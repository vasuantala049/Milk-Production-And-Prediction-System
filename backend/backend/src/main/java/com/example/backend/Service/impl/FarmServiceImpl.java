package com.example.backend.Service.impl;

import com.example.backend.DTO.*;
import com.example.backend.Entity.Farm;
import com.example.backend.Entity.FarmWorker;
import com.example.backend.Entity.FarmWorkerShed;
import com.example.backend.Entity.Shed;
import com.example.backend.Entity.User;
import com.example.backend.Entity.WorkerFarmInvitation;
import com.example.backend.Entity.type.InvitationStatus;
import com.example.backend.Entity.type.UserRole;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.FarmWorkerRepository;
import com.example.backend.Repository.FarmWorkerShedRepository;
import com.example.backend.Repository.ShedRepository;
import com.example.backend.Repository.UserRepository;
import com.example.backend.Repository.WorkerFarmInvitationRepository;
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

    private static final double DEFAULT_MILK_PRICE = 60.0;

    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final FarmWorkerRepository farmWorkerRepository;
    private final FarmWorkerShedRepository farmWorkerShedRepository;
    private final ShedRepository shedRepository;
    private final ModelMapper modelMapper;
    private final com.example.backend.Repository.CattleRepository cattleRepository;
    private final com.example.backend.Service.MilkInventoryService milkInventoryService;
    private final com.example.backend.Repository.CattleMilkEntryRepository cattleMilkEntryRepository;
    private final WorkerFarmInvitationRepository invitationRepository;

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
            result.addAll(farmRepository.findByCityContainingIgnoreCaseAndIsSellingTrue(trimmedLocation));
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
        farm.setCity(dto.getCity());
        farm.setOwner(loggedInUser);
        // Initialize per-animal prices so new farms never start with zero pricing.
        farm.setCowPrice(DEFAULT_MILK_PRICE);
        farm.setBuffaloPrice(DEFAULT_MILK_PRICE);
        farm.setSheepPrice(DEFAULT_MILK_PRICE);
        farm.setGoatPrice(DEFAULT_MILK_PRICE);

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
        if (patchDto.getCity() != null)
            farm.setCity(patchDto.getCity());
        if (patchDto.getIsSelling() != null)
            farm.setSelling(patchDto.getIsSelling());

        if (patchDto.getCowPrice() != null) {
            farm.setCowPrice(normalizeMilkPrice(patchDto.getCowPrice()));
        }

        if (patchDto.getBuffaloPrice() != null) {
            farm.setBuffaloPrice(normalizeMilkPrice(patchDto.getBuffaloPrice()));
        }

        if (patchDto.getSheepPrice() != null) {
            farm.setSheepPrice(normalizeMilkPrice(patchDto.getSheepPrice()));
        }

        if (patchDto.getGoatPrice() != null) {
            farm.setGoatPrice(normalizeMilkPrice(patchDto.getGoatPrice()));
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
        // Legacy: now redirects to invitation flow — sends invitation instead of direct assign
        inviteWorkerToFarm(farmId, workerEmail, loggedInUser);
    }

    private final com.example.backend.Repository.MilkAllocationRepository milkAllocationRepository;

    // ---------- helper ----------
    private FarmResponseDto toResponseDto(Farm farm) {
        FarmResponseDto dto = modelMapper.map(farm, FarmResponseDto.class);
        dto.setOwnerId(farm.getOwner().getId());
        dto.setPricePerLiter(farm.getPricePerLiter() != null ? farm.getPricePerLiter() : 0.0);

        // Use MilkInventoryService for consistency
        Double todayMilk = milkInventoryService.getTodayTotal(farm.getId());
        dto.setTodayMilk(todayMilk != null ? todayMilk : 0.0);

        // Calculate available (Today - All Allocations)
        java.time.LocalDate today = java.time.LocalDate.now();
        com.example.backend.DTO.MilkAvailabilityDto morningReq = milkInventoryService.getAvailability(farm.getId(), today,
                com.example.backend.Entity.type.MilkSession.MORNING);
        com.example.backend.DTO.MilkAvailabilityDto eveningReq = milkInventoryService.getAvailability(farm.getId(), today,
                com.example.backend.Entity.type.MilkSession.EVENING);
        
        double availMilk = 0.0;
        double cowAvail = 0.0;
        double buffaloAvail = 0.0;
        double sheepAvail = 0.0;
        double goatAvail = 0.0;
        
        if (morningReq != null) {
            availMilk += morningReq.getAvailableMilk() != null ? morningReq.getAvailableMilk() : 0.0;
            cowAvail += morningReq.getCowAvailableMilk() != null ? morningReq.getCowAvailableMilk() : 0.0;
            buffaloAvail += morningReq.getBuffaloAvailableMilk() != null ? morningReq.getBuffaloAvailableMilk() : 0.0;
        }
        if (eveningReq != null) {
            availMilk += eveningReq.getAvailableMilk() != null ? eveningReq.getAvailableMilk() : 0.0;
            cowAvail += eveningReq.getCowAvailableMilk() != null ? eveningReq.getCowAvailableMilk() : 0.0;
            buffaloAvail += eveningReq.getBuffaloAvailableMilk() != null ? eveningReq.getBuffaloAvailableMilk() : 0.0;
        }
        
        dto.setAvailableMilk(availMilk);
        dto.setCowAvailableMilk(cowAvail);
        dto.setBuffaloAvailableMilk(buffaloAvail);
        dto.setSheepAvailableMilk(sheepAvail);
        dto.setGoatAvailableMilk(goatAvail);

        // Populate herd and worker counts
        dto.setHerdCount(cattleRepository.countByFarmId(farm.getId()));
        long workerCount = farmWorkerRepository.findByFarmId(farm.getId()).stream()
                .filter(fw -> fw.getWorker().getRole() == UserRole.WORKER).count();
        dto.setWorkerCount(workerCount);
        dto.setSelling(farm.isSelling());

        return dto;
    }

    private final com.example.backend.Repository.MilkInventoryRepository milkInventoryRepository;

    private Double getAvailableForSession(Long farmId, java.time.LocalDate date,
            com.example.backend.Entity.type.MilkSession session) {
        // Obsolete, but kept to avoid signature breaks elsewhere if any
        return milkInventoryRepository.findByFarmIdAndRecordDateAndSession(farmId, date, session)
                .map(inventory -> {
                    Double totalProduction = inventory.getMilkLiters();
                    Double allocated = milkAllocationRepository.sumAllocationsByInventoryId(inventory.getId());
                    return totalProduction - allocated;
                })
                .orElse(0.0);
    }

    private Double normalizeMilkPrice(Double inputPrice) {
        if (inputPrice == null || inputPrice <= 0.0) {
            return DEFAULT_MILK_PRICE;
        }
        return inputPrice;
    }

    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

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
    @Transactional(readOnly = true)
    public java.util.List<com.example.backend.DTO.ShedStatusDto> getShedStatus(Long farmId, User loggedInUser) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));
        if (!farm.getOwner().getId().equals(loggedInUser.getId())) {
            throw new IllegalArgumentException("Only farm owner can view shed status");
        }

        java.util.List<com.example.backend.Entity.Cattle> allCattle = cattleRepository.findByFarmId(farmId);
        
        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.List<com.example.backend.Entity.CattleMilkEntry> todayEntriesRaw = cattleMilkEntryRepository.findByFarm_IdAndRecordDate(farmId, today);
        java.util.Set<Long> milkedCattleIds = todayEntriesRaw.stream().map(e -> e.getCattle().getId()).collect(java.util.stream.Collectors.toSet());

        java.util.List<FarmWorker> farmWorkers = farmWorkerRepository.findByFarmId(farmId);
        java.util.Map<String, String> shedToWorkerMap = new java.util.HashMap<>();
        for (FarmWorker fw : farmWorkers) {
            if (fw.getWorker().getRole() == UserRole.WORKER) {
                java.util.List<com.example.backend.Entity.Shed> workerSheds = farmWorkerShedRepository
                        .findByFarmWorkerId(fw.getId())
                        .stream()
                        .map(com.example.backend.Entity.FarmWorkerShed::getShed)
                        .toList();
                for (com.example.backend.Entity.Shed shed : workerSheds) {
                    shedToWorkerMap.merge(shed.getName(), fw.getWorker().getName(), (a, b) -> a + ", " + b);
                }
            }
        }

        java.util.Map<String, com.example.backend.DTO.ShedStatusDto> shedStats = new java.util.HashMap<>();
        for (com.example.backend.Entity.Cattle c : allCattle) {
            if (c.getStatus() == null || !"ACTIVE".equalsIgnoreCase(c.getStatus())) {
                continue;
            }
            String shed = c.getShed() != null ? c.getShed().getName() : "Unassigned";
            com.example.backend.DTO.ShedStatusDto stat = shedStats.computeIfAbsent(shed, s -> new com.example.backend.DTO.ShedStatusDto(s, 0, 0, 0, shedToWorkerMap.getOrDefault(s, "Unassigned")));
            stat.setTotalCattle(stat.getTotalCattle() + 1);
            if (milkedCattleIds.contains(c.getId())) {
                stat.setMilkedCattle(stat.getMilkedCattle() + 1);
            } else {
                stat.setRemainingCattle(stat.getRemainingCattle() + 1);
            }
        }

        return new java.util.ArrayList<>(shedStats.values());
    }

    @Override
    public void updateWorkerSheds(Long farmId, Long workerId, com.example.backend.DTO.UpdateWorkerShedDto dto, User loggedInUser) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        if (!farm.getOwner().getId().equals(loggedInUser.getId())) {
            throw new IllegalArgumentException("Only farm owner can update worker assignments");
        }

        User user = userRepository.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));

        if (user.getRole() != UserRole.WORKER) {
            throw new IllegalArgumentException("User is not a worker");
        }

        FarmWorker farmWorker = farmWorkerRepository.findByFarmIdAndWorkerId(farmId, workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker is not assigned to this farm"));

        // Delete existing shed assignments for this worker on this farm
        farmWorkerShedRepository.deleteByFarmWorkerId(farmWorker.getId());

        // Add new shed assignments
        if (dto.getShedIds() != null && !dto.getShedIds().isEmpty()) {
            for (Long shedId : dto.getShedIds()) {
                Shed shed = shedRepository.findById(shedId)
                        .orElseThrow(() -> new IllegalArgumentException("Shed not found: " + shedId));
                if (!shed.getFarm().getId().equals(farmId)) {
                    throw new IllegalArgumentException("Shed does not belong to this farm");
                }
                FarmWorkerShed fws = new FarmWorkerShed();
                fws.setFarmWorker(farmWorker);
                fws.setShed(shed);
                farmWorkerShedRepository.save(fws);
            }
        }
    }

    @Override
    public WorkerFarmInvitationDto inviteWorkerToFarm(Long farmId, String workerEmail, User loggedInUser) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        if (!farm.getOwner().getId().equals(loggedInUser.getId())) {
            throw new IllegalArgumentException("Only the farm owner can invite workers");
        }

        User worker = userRepository.findByEmail(workerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Worker with that email not found"));

        if (worker.getRole() != UserRole.WORKER) {
            throw new IllegalArgumentException("Target user is not a WORKER");
        }

        // Already assigned
        if (farmWorkerRepository.findByFarmIdAndWorkerId(farmId, worker.getId()).isPresent()) {
            throw new IllegalArgumentException("Worker is already assigned to this farm");
        }

        // Check for existing pending invitation
        if (invitationRepository.existsByFarmIdAndWorkerIdAndStatus(farmId, worker.getId(), InvitationStatus.PENDING)) {
            throw new IllegalArgumentException("An invitation is already pending for this worker");
        }

        // Remove previous declined invitation so a fresh one can be sent
        invitationRepository.deleteByFarmIdAndWorkerId(farmId, worker.getId());

        WorkerFarmInvitation invitation = WorkerFarmInvitation.builder()
                .farm(farm)
                .worker(worker)
                .status(InvitationStatus.PENDING)
                .build();

        WorkerFarmInvitation saved = invitationRepository.save(invitation);
        return toInvitationDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkerFarmInvitationDto> getPendingInvitationsForWorker(User loggedInUser) {
        return invitationRepository.findByWorkerIdAndStatus(loggedInUser.getId(), InvitationStatus.PENDING)
                .stream()
                .map(this::toInvitationDto)
                .toList();
    }

    @Override
    public WorkerFarmInvitationDto respondToInvitation(Long invitationId, boolean accept, User loggedInUser) {
        WorkerFarmInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        if (!invitation.getWorker().getId().equals(loggedInUser.getId())) {
            throw new IllegalArgumentException("This invitation is not for you");
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new IllegalArgumentException("Invitation already responded to");
        }

        if (accept) {
            invitation.setStatus(InvitationStatus.ACCEPTED);
            invitationRepository.save(invitation);

            // Actually assign the worker to the farm
            if (farmWorkerRepository.findByFarmIdAndWorkerId(invitation.getFarm().getId(), loggedInUser.getId()).isEmpty()) {
                FarmWorker assignment = new FarmWorker();
                assignment.setFarm(invitation.getFarm());
                assignment.setWorker(loggedInUser);
                farmWorkerRepository.save(assignment);
            }
        } else {
            invitation.setStatus(InvitationStatus.DECLINED);
            invitationRepository.save(invitation);
        }

        return toInvitationDto(invitation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkerFarmInvitationDto> getInvitationsForFarm(Long farmId, User loggedInUser) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        if (!farm.getOwner().getId().equals(loggedInUser.getId())) {
            throw new IllegalArgumentException("Only the farm owner can view invitations");
        }

        return invitationRepository.findByFarmIdAndStatus(farmId, InvitationStatus.PENDING)
                .stream()
                .map(this::toInvitationDto)
                .toList();
    }

    @Override
    public void removeWorkerFromFarm(Long farmId, Long workerId, User loggedInUser) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        if (!farm.getOwner().getId().equals(loggedInUser.getId())) {
            throw new IllegalArgumentException("Only the farm owner can remove workers");
        }

        FarmWorker farmWorker = farmWorkerRepository.findByFarmIdAndWorkerId(farmId, workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker is not assigned to this farm"));

        // Delete shed assignments first (cascade safety)
        farmWorkerShedRepository.deleteByFarmWorkerId(farmWorker.getId());

        // Delete any pending invitations
        invitationRepository.deleteByFarmIdAndWorkerId(farmId, workerId);

        // Delete the farm-worker link
        farmWorkerRepository.delete(farmWorker);
    }

    private WorkerFarmInvitationDto toInvitationDto(WorkerFarmInvitation inv) {
        return WorkerFarmInvitationDto.builder()
                .id(inv.getId())
                .farmId(inv.getFarm().getId())
                .farmName(inv.getFarm().getName())
                .farmAddress(inv.getFarm().getAddress())
                .workerId(inv.getWorker().getId())
                .workerName(inv.getWorker().getName())
                .workerEmail(inv.getWorker().getEmail())
                .status(inv.getStatus())
                .createdAt(inv.getCreatedAt())
                .build();
    }
}
