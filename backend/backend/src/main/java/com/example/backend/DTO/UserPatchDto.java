package com.example.backend.DTO;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserPatchDto {

    private String name;
    private String email;
    private String location;

    // only for assigning / reassigning WORKER to farm
    private Long farmId;
}
