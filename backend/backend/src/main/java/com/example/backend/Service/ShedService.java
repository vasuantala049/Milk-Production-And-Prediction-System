package com.example.backend.Service;

import com.example.backend.DTO.CreateShedDto;
import com.example.backend.DTO.ShedResponseDto;
import com.example.backend.Entity.User;

import java.util.List;

public interface ShedService {

    List<ShedResponseDto> getShedsForFarm(Long farmId);

    ShedResponseDto createShed(CreateShedDto dto, User owner);

    void deleteShed(Long shedId, User owner);
}
