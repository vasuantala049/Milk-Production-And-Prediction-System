package com.example.backend.Service.impl;

import com.example.backend.DTO.CattlePatchDto;
import com.example.backend.DTO.CattleResponseDto;
import com.example.backend.DTO.CreateCattleDto;
import com.example.backend.Entity.Cattle;
import com.example.backend.Entity.CattleMilkEntry;
import com.example.backend.Entity.Farm;
import com.example.backend.Repository.CattleRepository;
import com.example.backend.Repository.FarmRepository;
import com.example.backend.Repository.CattleMilkEntryRepository;
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
    private final CattleMilkEntryRepository cattleMilkEntryRepository;
    private final ModelMapper modelMapper;

    @Override
    public CattleResponseDto createCattle(CreateCattleDto dto) {
        Farm farm = farmRepository.findById(dto.getFarmId())
                .orElseThrow(() -> new IllegalArgumentException("Farm not found"));

        // Prevent duplicate tagId in the same farm
        boolean exists = cattleRepository.findByFarm_IdAndTagId(farm.getId(), dto.getTagId()).isPresent();
        if (exists) {
            throw new IllegalArgumentException("A cattle with this tagId already exists in this farm.");
        }

        Cattle cattle = new Cattle();
        cattle.setTagId(dto.getTagId());
        cattle.setBreed(dto.getBreed());
        cattle.setType(dto.getType());
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

    @Override
    public Long getTotalCattle() {
        return (Long) cattleRepository.count();
    }

    // -------- helper --------
    private CattleResponseDto toResponseDto(Cattle cattle) {
        // Calculate average milk per day dynamically
        Double avgMilkPerDay = calculateAverageMilkPerDay(cattle.getId());

        return new CattleResponseDto(
                cattle.getId(),
                cattle.getTagId(),
                cattle.getBreed(),
                cattle.getType(),
                cattle.getStatus(),
                avgMilkPerDay,
                cattle.getFarm().getId()
        );
    }

    private Double calculateAverageMilkPerDay(Long cattleId) {
        try {
            // First check if cattle has any milk entries
            java.util.List<CattleMilkEntry> entries = cattleMilkEntryRepository.findByCattle_Id(cattleId);
            if (entries.isEmpty()) {
                return 0.0;
            }

            // Calculate total milk and unique days
            double totalMilk = entries.stream()
                    .mapToDouble(CattleMilkEntry::getMilkLiters)
                    .sum();

            long uniqueDays = entries.stream()
                    .map(entry -> entry.getRecordDate())
                    .distinct()
                    .count();

            return uniqueDays > 0 ? totalMilk / uniqueDays : 0.0;
        } catch (Exception e) {
            // Return 0.0 if calculation fails
            return 0.0;
        }
    }
}
