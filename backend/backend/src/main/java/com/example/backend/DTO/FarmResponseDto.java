package com.example.backend.DTO;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FarmResponseDto {

    private Long id;
    private String name;
    private String address;
    private Long ownerId;
}
