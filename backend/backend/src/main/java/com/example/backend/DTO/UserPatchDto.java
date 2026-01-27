package com.example.backend.DTO;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserPatchDto {

    private String name;
    private String email;
    private String location;

    // Optional city field; when provided we also use it for location-based filtering
    private String city;

    // only for assigning / reassigning WORKER to farm
    private Long farmId;
}
