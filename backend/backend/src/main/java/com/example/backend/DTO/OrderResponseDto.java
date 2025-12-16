package com.example.backend.DTO;

import com.example.backend.Entity.type.OrderStatus;

import java.time.LocalDateTime;

public class OrderResponseDto {
    private Long id;
    private Long buyerId;
    private Double quantity;
    private OrderStatus status;
    private LocalDateTime orderDate;
}
