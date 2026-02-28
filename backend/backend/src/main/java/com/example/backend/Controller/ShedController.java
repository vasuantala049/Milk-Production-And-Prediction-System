package com.example.backend.Controller;

import com.example.backend.DTO.CreateShedDto;
import com.example.backend.DTO.ShedResponseDto;
import com.example.backend.Entity.User;
import com.example.backend.Service.ShedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/farms/{farmId}/sheds")
@RequiredArgsConstructor
public class ShedController {

    private final ShedService shedService;

    // GET all sheds for a farm — FARM_OWNER only
    @GetMapping
    @PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<List<ShedResponseDto>> getSheds(@PathVariable Long farmId) {
        return ResponseEntity.ok(shedService.getShedsForFarm(farmId));
    }

    // CREATE a new shed — FARM_OWNER only
    @PostMapping
    @PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<ShedResponseDto> createShed(
            @PathVariable Long farmId,
            @RequestBody @Valid CreateShedDto dto,
            @AuthenticationPrincipal User user) {

        dto.setFarmId(farmId); // enforce path var
        return ResponseEntity.status(HttpStatus.CREATED).body(shedService.createShed(dto, user));
    }

    // DELETE a shed — FARM_OWNER only
    @DeleteMapping("/{shedId}")
    @PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<Void> deleteShed(
            @PathVariable Long farmId,
            @PathVariable Long shedId,
            @AuthenticationPrincipal User user) {

        shedService.deleteShed(shedId, user);
        return ResponseEntity.noContent().build();
    }
}
