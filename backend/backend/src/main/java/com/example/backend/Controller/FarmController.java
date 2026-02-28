package com.example.backend.Controller;

import com.example.backend.DTO.*;
import com.example.backend.Service.FarmService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/farms")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;

    // CREATE farm (only OWNER)
    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<FarmResponseDto> createFarm(
            @RequestBody @Valid CreateFarmDto dto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(farmService.createFarm(dto, user));
    }

    // GET all farms (Public/Customer)
    @GetMapping
    public ResponseEntity<List<FarmResponseDto>> getAllFarms(
            @RequestParam(required = false) String location,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {
        String searchLoc = location;
        if (searchLoc == null && user != null) {
            // Prefer the user's city if set, otherwise fall back to generic location
            if (user.getCity() != null && !user.getCity().isEmpty()) {
                searchLoc = user.getCity();
            } else {
                searchLoc = user.getLocation();
            }
        }
        return ResponseEntity.ok(farmService.getAllFarms(searchLoc));
    }

    // GET farm by id
    @GetMapping("/{id}")
    public ResponseEntity<FarmResponseDto> getFarm(@PathVariable Long id) {
        return ResponseEntity.ok(farmService.getFarmById(id));
    }

    // GET all farms of an owner
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<FarmResponseDto>> getFarmsByOwner(
            @PathVariable Long ownerId) {

        return ResponseEntity.ok(farmService.getFarmsByOwner(ownerId));
    }

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<List<FarmResponseDto>> getFarmsByWorker(
            @PathVariable Long workerId) {

        return ResponseEntity.ok(farmService.getFarmsByWorker(workerId));
    }

    // UPDATE farm (only OWNER)
    @PatchMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<FarmResponseDto> updateFarm(
            @PathVariable Long id,
            @RequestBody FarmPatchDto patchDto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        return ResponseEntity.ok(farmService.patchFarm(id, patchDto, user));
    }

    // GET farms for current logged-in user
    @GetMapping("/me")
    public ResponseEntity<List<FarmResponseDto>> getMyFarms(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        return ResponseEntity.ok(farmService.getMyFarms(user));
    }

    // Owner-only: assign a worker to this farm
    @PostMapping("/{farmId}/assign-worker")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<Void> assignWorker(
            @PathVariable Long farmId,
            @RequestBody com.example.backend.DTO.AssignWorkerDto dto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        farmService.assignWorkerToFarm(farmId, dto.getEmail(), user);
        return ResponseEntity.ok().build();
    }

    // Create and assign a NEW worker to this farm (only OWNER)
    @PostMapping("/{farmId}/workers")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<com.example.backend.DTO.UserResponseDto> createWorker(
            @PathVariable Long farmId,
            @RequestBody @Valid com.example.backend.DTO.CreateUserRequestDto dto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(farmService.createWorkerForFarm(farmId, dto, user));
    }

    // DELETE farm (only OWNER) - for now just deletes by id
    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<Void> deleteFarm(@PathVariable Long id) {
        farmService.deleteFarm(id);
        return ResponseEntity.noContent().build();
    }

    // GET herd count for a farm
    @GetMapping("/{id}/herd-count")
    public ResponseEntity<Long> getHerdCount(@PathVariable Long id) {
        long count = farmService.getHerdCount(id);
        return ResponseEntity.ok(count);
    }

    // GET worker count for a farm
    @GetMapping("/{id}/worker-count")
    public ResponseEntity<Long> getWorkerCount(@PathVariable Long id) {
        long count = farmService.getWorkerCount(id);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/{id}/workers")
    public ResponseEntity<java.util.List<com.example.backend.DTO.UserResponseDto>> getWorkers(@PathVariable Long id) {
        return ResponseEntity.ok(farmService.getWorkersByFarm(id));
    }

    @GetMapping("/{id}/active-cattle-count")
    public ResponseEntity<Long> getActiveCattleCount(@PathVariable Long id) {
        long count = farmService.getActiveCattleCount(id);
        return ResponseEntity.ok(count);
    }

    // Update shed assignments for a worker in a specific farm (supports multiple
    // sheds)
    @PatchMapping("/{farmId}/workers/{workerId}/shed")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<Void> updateWorkerShed(
            @PathVariable Long farmId,
            @PathVariable Long workerId,
            @RequestBody com.example.backend.DTO.UpdateWorkerShedDto dto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        farmService.updateWorkerShedForFarm(farmId, workerId, dto.getShedIds(), user);
        return ResponseEntity.ok().build();
    }
}
