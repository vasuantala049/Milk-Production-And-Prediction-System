package com.example.backend.DTO;

import com.example.backend.Entity.type.MilkSession;
import com.example.backend.Entity.type.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionResponseDto {
    private Long id;
    private String displayCode;
    private Long buyerId;
    private String buyerName;
    private String buyerAddress;
    private String buyerCity;
    private Long farmId;
    private String farmName;
    private Double quantity;
    private MilkSession session;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate skipDate;
    private SubscriptionStatus status;
    private String animalType;
    private Integer billingDayCounter;
    private Integer maxBillingDays;
    private Boolean paymentRequired;
    private Double billingAmountDue;
    private LocalDateTime lastCyclePaidAt;
    private LocalDateTime createdAt;
}
