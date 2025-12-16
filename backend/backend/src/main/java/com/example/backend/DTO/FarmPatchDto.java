package com.example.backend.DTO;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FarmPatchDto {
    private String name;
    private String address;

    // TEMP until Spring Security
    private Long ownerId;
}
