package com.example.backend.DTO;

import com.example.backend.Entity.type.MilkSession;
import com.example.backend.Entity.type.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderResponseDto {
    private Long id;
    private String displayCode;
    private LocalDate orderDate;
    private Double quantity;
    private MilkSession session;
    private OrderStatus status;
    private Long buyerId;
    private String buyerName;
    private Long farmId;
    private String farmName;
    private String animalType;
    private Double totalPrice;
    private Boolean paid;
    private Double paidAmount;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
