package com.example.backend.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FarmResponseDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String city;
    private String address;
    private Long ownerId;
    private Double availableMilk;
    private Double todayMilk;
    private Long herdCount;
    private Long workerCount;
    @JsonProperty("isSelling")
    private boolean isSelling;
    private Double pricePerLiter;
}
