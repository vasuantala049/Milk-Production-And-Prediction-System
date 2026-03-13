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
            @RequestParam(required = false) String city,
            @RequestParam(required = false, name = "location") String legacyLocation,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {
        String searchCity = city != null ? city : legacyLocation;
        if (searchCity == null && user != null) {
            // Prefer the user's city if set, otherwise fall back to the legacy location field.
            if (user.getCity() != null && !user.getCity().isEmpty()) {
                searchCity = user.getCity();
            } else {
                searchCity = user.getLocation();
            }
        }
        return ResponseEntity.ok(farmService.getAllFarms(searchCity));
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

    // Owner-only: invite a worker to this farm (sends invitation, not direct assign)
    @PostMapping("/{farmId}/assign-worker")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<com.example.backend.DTO.WorkerFarmInvitationDto> assignWorker(
            @PathVariable Long farmId,
            @RequestBody com.example.backend.DTO.AssignWorkerDto dto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        return ResponseEntity.ok(farmService.inviteWorkerToFarm(farmId, dto.getEmail(), user));
    }

    // GET pending invitations for current farm (owner only)
    @GetMapping("/{farmId}/invitations")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<java.util.List<com.example.backend.DTO.WorkerFarmInvitationDto>> getFarmInvitations(
            @PathVariable Long farmId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        return ResponseEntity.ok(farmService.getInvitationsForFarm(farmId, user));
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

    // Update worker's shed assignments (only OWNER)
    @PatchMapping("/{farmId}/workers/{workerId}/shed")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<Void> updateWorkerSheds(
            @PathVariable Long farmId,
            @PathVariable Long workerId,
            @RequestBody com.example.backend.DTO.UpdateWorkerShedDto dto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        farmService.updateWorkerSheds(farmId, workerId, dto, user);
        return ResponseEntity.ok().build();
    }

    // Remove a worker from a farm (only OWNER)
    @DeleteMapping("/{farmId}/workers/{workerId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<Void> removeWorker(
            @PathVariable Long farmId,
            @PathVariable Long workerId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        farmService.removeWorkerFromFarm(farmId, workerId, user);
        return ResponseEntity.noContent().build();
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

    @GetMapping("/{id}/sheds-status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<java.util.List<com.example.backend.DTO.ShedStatusDto>> getShedsStatus(
            @PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {
        return ResponseEntity.ok(farmService.getShedStatus(id, user));
    }
}
