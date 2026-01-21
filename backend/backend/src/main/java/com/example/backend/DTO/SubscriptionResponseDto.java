package com.example.backend.DTO;

import com.example.backend.Entity.type.MilkSession;
import com.example.backend.Entity.type.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionResponseDto {
    private Long id;
    private Long buyerId;
    private String buyerName;
    private Long farmId;
    private String farmName;
    private Double quantity;
    private MilkSession session;
    private LocalDate startDate;
    private LocalDate endDate;
    private SubscriptionStatus status;
}
