package com.example.backend.Controller;

import com.example.backend.DTO.*;
import com.example.backend.Service.CattleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cattle")
@RequiredArgsConstructor
public class CattleController {

    private final CattleService cattleService;

    // CREATE cattle (only OWNER)
    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<?> createCattle(
            @RequestBody @Valid CreateCattleDto dto) {
        try {
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(cattleService.createCattle(dto));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    // Error response DTO for user-friendly errors
    static class ErrorResponse {
        public final String message;

        public ErrorResponse(String message) {
            this.message = message;
        }
    }

    // GET cattle by id
    @GetMapping("/{id}")
    public ResponseEntity<CattleResponseDto> getCattle(@PathVariable Long id) {
        return ResponseEntity.ok(cattleService.getCattleById(id));
    }

    // GET all cattle of a farm
    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<CattleResponseDto>> getCattleByFarm(
            @PathVariable Long farmId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        List<CattleResponseDto> allCattle = cattleService.getCattleByFarm(farmId);
        return ResponseEntity.ok(allCattle);
    }

    // PATCH cattle (only OWNER)
    @PatchMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<CattleResponseDto> patchCattle(
            @PathVariable Long id,
            @RequestBody CattlePatchDto patchDto) {

        return ResponseEntity.ok(cattleService.patchCattle(id, patchDto));
    }

    // DELETE cattle (only OWNER)
    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('FARM_OWNER')")
    public ResponseEntity<Void> deleteCattle(@PathVariable Long id) {
        cattleService.deleteCattle(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/count")
    public Long getTotalCattle() {
        return cattleService.getTotalCattle();
    }
}
