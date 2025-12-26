package com.example.backend.Controller;

import com.example.backend.DTO.AddMilkInventoryRequestDto;
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

    private final MilkInventoryService milkInventoryService; // ✅ final

    @PostMapping("/today")
    public ResponseEntity<?> addTodayMilk(
            @RequestBody AddMilkInventoryRequestDto dto,
            @AuthenticationPrincipal User user
    ) {
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
        public ErrorResponse(String message) { this.message = message; }
    }

    @GetMapping("/today")
    public ResponseEntity<Double> getTodayTotal(@RequestParam Long farmId) {
        Double total = milkInventoryService.getTodayTotal(farmId);
        return ResponseEntity.ok(total);
    }

    @GetMapping("/today/breakdown")
    public ResponseEntity<com.example.backend.DTO.TodayMilkBreakdownDto> getTodayBreakdown(@RequestParam Long farmId) {
        com.example.backend.DTO.TodayMilkBreakdownDto dto = milkInventoryService.getTodayBreakdown(farmId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/history")
    public ResponseEntity<java.util.List<com.example.backend.DTO.MilkHistoryDto>> getHistory(
            @RequestParam Long farmId,
            @RequestParam(defaultValue = "7") int days
    ) {
        return ResponseEntity.ok(milkInventoryService.getLastNDaysMilk(farmId, days));
    }
}
