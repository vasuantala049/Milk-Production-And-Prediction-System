package com.example.backend.DTO;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FarmPatchDto {
    private String name;
    private String address;
    private String city;
    private Boolean isSelling;

    // TEMP until Spring Security
    private Long ownerId;

    private Double cowPrice;
    private Double buffaloPrice;
    private Double sheepPrice;
    private Double goatPrice;
}
