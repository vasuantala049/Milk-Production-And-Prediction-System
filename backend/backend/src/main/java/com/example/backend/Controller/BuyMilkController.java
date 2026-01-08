package com.example.backend.Controller;

import com.example.backend.DTO.MilkBuyDto;
import com.example.backend.DTO.OrderResponseDto;
import com.example.backend.Entity.User;
import com.example.backend.Service.BuyMilkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/BuyMilk")
@RequiredArgsConstructor
public class BuyMilkController {
    private final BuyMilkService buyMilkService;

    @PostMapping
    public ResponseEntity<OrderResponseDto> buyMilk(
            @RequestBody MilkBuyDto dto,
            @AuthenticationPrincipal User user
    ) {
        OrderResponseDto order = buyMilkService.buyMilk(dto, user);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(order);
    }
}
