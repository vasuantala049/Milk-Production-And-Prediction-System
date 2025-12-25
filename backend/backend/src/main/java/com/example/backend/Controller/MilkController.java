package com.example.backend.Controller;

import com.example.backend.DTO.AddMilkInventoryRequestDto;
import com.example.backend.Entity.User;
import com.example.backend.Service.MilkInventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<Void> addTodayMilk(
            @RequestBody AddMilkInventoryRequestDto dto,
            @AuthenticationPrincipal User user
    ) {
        milkInventoryService.addTodayMilk(dto, user);
        return ResponseEntity.ok().build();
    }
}
