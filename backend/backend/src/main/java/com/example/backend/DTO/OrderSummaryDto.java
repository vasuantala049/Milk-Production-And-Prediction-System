package com.example.backend.DTO;

import com.example.backend.Entity.type.OrderStatus;

import java.time.LocalDateTime;

public class OrderSummaryDto {
    private Long id;
    private Double quantity;
    private OrderStatus status;
    private LocalDateTime orderDate;
}
