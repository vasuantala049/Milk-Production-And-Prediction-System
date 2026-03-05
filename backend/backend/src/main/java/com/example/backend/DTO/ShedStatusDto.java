package com.example.backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShedStatusDto {
    private String shedName;
    private int totalCattle;
    private int milkedCattle;
    private int remainingCattle;
    private String workerInCharge;
}
