package com.example.backend.Service.impl;

import com.example.backend.DTO.CattlePatchDto;
import com.example.backend.DTO.CattleResponseDto;
import com.example.backend.DTO.CreateCattleDto;
import com.example.backend.Entity.Cattle;
import com.example.backend.Entity.Farm;
import com.example.backend.Repository.CattleRepository;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Service.CattleService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CattleServiceImpl implements CattleService {

    private final CattleRepository cattleRepository;
    private final FarmRepository farmRepository;
    private final ModelMapper modelMapper;

    @Override
    public CattleResponseDto createCattle(CreateCattleDto dto) {

        Farm farm = farmRepository.findById(dto.getFarmId())
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        Cattle cattle = new Cattle();
        cattle.setTagId(dto.getTagId());
        cattle.setBreed(dto.getBreed());
        cattle.setStatus(dto.getStatus());
        cattle.setFarm(farm);

        Cattle saved = cattleRepository.save(cattle);
        return toResponseDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CattleResponseDto getCattleById(Long id) {

        Cattle cattle = cattleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cattle not found"));

        return toResponseDto(cattle);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CattleResponseDto> getCattleByFarm(Long farmId) {
        return cattleRepository.findByFarmId(farmId)
                .stream()
                .map(this::toResponseDto)
                .toList();

    }

    @Override
    public CattleResponseDto patchCattle(Long id, CattlePatchDto patchDto) {

        Cattle cattle = cattleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cattle not found"));

        if (patchDto.getBreed() != null) {
            cattle.setBreed(patchDto.getBreed());
        }

        if (patchDto.getStatus() != null) {
            cattle.setStatus(patchDto.getStatus());
        }

        Cattle saved = cattleRepository.save(cattle);
        return toResponseDto(saved);
    }

    @Override
    public void deleteCattle(Long id) {

        if (!cattleRepository.existsById(id)) {
            throw new IllegalArgumentException("Cattle not found");
        }

        cattleRepository.deleteById(id);
    }

    // -------- helper --------
    private CattleResponseDto toResponseDto(Cattle cattle) {
        return new CattleResponseDto(
                cattle.getId(),
                cattle.getTagId(),
                cattle.getBreed(),
                cattle.getStatus(),
                cattle.getFarm().getId()
        );
    }
}
