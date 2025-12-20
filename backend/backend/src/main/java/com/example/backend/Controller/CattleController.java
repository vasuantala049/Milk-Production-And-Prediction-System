package com.example.backend.Controller;
import com.example.backend.DTO.*;
import com.example.backend.Service.CattleService;
import com.example.backend.Service.FarmService;
import jakarta.validation.Valid;
import com.example.backend.Service.UserService;
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

    // CREATE cattle
    @PostMapping
    public ResponseEntity<CattleResponseDto> createCattle(
            @RequestBody @Valid CreateCattleDto dto) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(cattleService.createCattle(dto));
    }

    // GET cattle by id
    @GetMapping("/{id}")
    public ResponseEntity<CattleResponseDto> getCattle(@PathVariable Long id) {
        return ResponseEntity.ok(cattleService.getCattleById(id));
    }

    // GET all cattle of a farm
    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<CattleResponseDto>> getCattleByFarm(
            @PathVariable Long farmId) {

        return ResponseEntity.ok(cattleService.getCattleByFarm(farmId));
    }

    // PATCH cattle
    @PatchMapping("/{id}")
    public ResponseEntity<CattleResponseDto> patchCattle(
            @PathVariable Long id,
            @RequestBody CattlePatchDto patchDto) {

        return ResponseEntity.ok(cattleService.patchCattle(id, patchDto));
    }

    // DELETE cattle
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCattle(@PathVariable Long id) {
        cattleService.deleteCattle(id);
        return ResponseEntity.noContent().build();
    }
}
