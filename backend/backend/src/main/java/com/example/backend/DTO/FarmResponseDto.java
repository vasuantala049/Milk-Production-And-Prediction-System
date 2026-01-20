package com.example.backend.DTO;

import lombok.*;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FarmResponseDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String address;
    private Long ownerId;
    private Double availableMilk;
    private Double pricePerLiter;
}
