package com.example.backend.Controller;

import com.example.backend.DTO.*;
import com.example.backend.Service.FarmService;
import jakarta.validation.Valid;
import com.example.backend.Service.UserService;
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
    public ResponseEntity<FarmResponseDto> createFarm(
            @RequestBody @Valid CreateFarmDto dto) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(farmService.createFarm(dto));
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
    public ResponseEntity<FarmResponseDto> updateFarm(
            @PathVariable Long id,
            @RequestBody FarmPatchDto patchDto) {

        return ResponseEntity.ok(farmService.patchFarm(id, patchDto));
    }

    // DELETE farm (only OWNER) - for now just deletes by id
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFarm(@PathVariable Long id) {
        farmService.deleteFarm(id);
        return ResponseEntity.noContent().build();
    }
}
