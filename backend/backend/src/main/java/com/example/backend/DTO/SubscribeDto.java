package com.example.backend.DTO;

import com.example.backend.Entity.type.MilkSession;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SubscribeDto {
    private Long farmId;
    private Double quantity;
    private MilkSession session;
    private LocalDate startDate;
}
