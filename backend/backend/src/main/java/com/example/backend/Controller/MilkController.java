package com.example.backend.Controller;

import com.example.backend.DTO.AddMilkInventoryRequestDto;
import com.example.backend.DTO.MilkHistoryDto;
import com.example.backend.DTO.TodayMilkBreakdownDto;
import com.example.backend.DTO.TodayMilkEntryDto;
import com.example.backend.Entity.User;
import com.example.backend.Service.MilkInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/milk")
public class MilkController {

    private final MilkInventoryService milkInventoryService;

    @PostMapping("/today")
    public ResponseEntity<?> addTodayMilk(
            @RequestBody AddMilkInventoryRequestDto dto,
            @AuthenticationPrincipal User user) {
        try {
            milkInventoryService.addTodayMilk(dto, user);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        }
    }

    // Simple error response wrapper
    static class ErrorResponse {
        public final String message;

        public ErrorResponse(String message) {
            this.message = message;
        }
    }

    @GetMapping("/today")
    public ResponseEntity<Double> getTodayTotal(@RequestParam Long farmId) {
        Double total = milkInventoryService.getTodayTotal(farmId);
        return ResponseEntity.ok(total);
    }

    @GetMapping("/today/breakdown")
    public ResponseEntity<TodayMilkBreakdownDto> getTodayBreakdown(@RequestParam Long farmId) {
        TodayMilkBreakdownDto dto = milkInventoryService.getTodayBreakdown(farmId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/history")
    public ResponseEntity<java.util.List<MilkHistoryDto>> getHistory(
            @RequestParam Long farmId,
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(milkInventoryService.getLastNDaysMilk(farmId, days));
    }

    @GetMapping("/today/entries")
    public ResponseEntity<java.util.List<TodayMilkEntryDto>> getTodayEntries(
            @RequestParam Long farmId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(milkInventoryService.getTodayEntries(farmId, user));
    }

    @GetMapping("/availability")
    public ResponseEntity<com.example.backend.DTO.MilkAvailabilityDto> getAvailability(
            @RequestParam Long farmId,
            @RequestParam String date,
            @RequestParam com.example.backend.Entity.type.MilkSession session) {
        java.time.LocalDate localDate = java.time.LocalDate.parse(date);
        return ResponseEntity.ok(milkInventoryService.getAvailability(farmId, localDate, session));
    }
}
