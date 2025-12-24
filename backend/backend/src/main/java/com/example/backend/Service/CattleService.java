package com.example.backend.Service;

import com.example.backend.DTO.CattlePatchDto;
import com.example.backend.DTO.CattleResponseDto;
import com.example.backend.DTO.CreateCattleDto;
import org.springframework.http.ResponseEntity;

import java.util.List;

public interface CattleService {

    CattleResponseDto createCattle(CreateCattleDto dto);

    CattleResponseDto getCattleById(Long id);

    List<CattleResponseDto> getCattleByFarm(Long farmId);

    CattleResponseDto patchCattle(Long id, CattlePatchDto patchDto);

    void deleteCattle(Long id);

    Long getTotalCattle();
}
