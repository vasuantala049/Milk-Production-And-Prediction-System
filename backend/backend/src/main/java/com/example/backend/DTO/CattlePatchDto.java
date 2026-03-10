package com.example.backend.DTO;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CattlePatchDto {

    private String breed;
    private String status;
    private Long shedId;
}
