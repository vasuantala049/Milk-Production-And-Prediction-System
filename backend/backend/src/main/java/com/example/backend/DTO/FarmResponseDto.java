package com.example.backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FarmResponseDto {
    private Long id;
    private String name;
    private String address;
    private Long ownerId;
}
