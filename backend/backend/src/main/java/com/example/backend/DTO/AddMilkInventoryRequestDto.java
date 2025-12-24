package com.example.backend.DTO;

import com.example.backend.Entity.type.MilkSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddMilkInventoryRequestDto {
    private String tagId;           // scanned
    private MilkSession session;    // MORNING / EVENING
    private Double milkLiters;
}
