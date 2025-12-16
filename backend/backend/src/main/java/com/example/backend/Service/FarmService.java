package com.example.backend.Service;

import com.example.backend.DTO.CreateFarmDto;
import com.example.backend.DTO.FarmPatchDto;
import com.example.backend.DTO.FarmResponseDto;
import jakarta.validation.Valid;

import java.util.List;

public interface FarmService {
    FarmResponseDto createFarm(@Valid CreateFarmDto dto);

    FarmResponseDto getFarmById(Long id);

    List<FarmResponseDto> getFarmsByOwner(Long ownerId);

    FarmResponseDto patchFarm(Long id, FarmPatchDto patchDto);
}
