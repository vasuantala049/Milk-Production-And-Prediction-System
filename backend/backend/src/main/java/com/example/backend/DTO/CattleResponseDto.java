package com.example.backend.DTO;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CattleResponseDto {

    private Long id;
    private String tagId;
    private String breed;
    private String type;
    private String status;
    private Double avgMilkPerDay;
    private Long farmId;
}
